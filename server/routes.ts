import type { Express, RequestHandler } from "express";
import type { Server } from "http";
import passport from "passport";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, isAdmin, isSuperAdmin, hashPassword } from "./localAuth";
import { insertTradeSchema, insertDiarySchema, insertGoalSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { sendPasswordResetEmail, sendAdminResetPasswordEmail } from "./email";
import rateLimit from "express-rate-limit";
import { aggregateTradeData } from "./services/trade-aggregator";
import { generateAICoachAnalysis } from "./services/ai-coach.service";

// Zod schema per validazione impostazioni utente
const updateUserSettingsSchema = z.object({
  pairs: z.array(z.string().max(20)).max(50).optional(),
  emotions: z.array(z.string().max(50)).max(50).optional(),
  confluencesPro: z.array(z.string().max(100)).max(50).optional(),
  confluencesContro: z.array(z.string().max(100)).max(50).optional(),
  barrierOptions: z.array(z.string().max(20)).max(20).optional(),
  isBarrierEnabled: z.boolean().optional(),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: { message: "Troppi tentativi di accesso da questo IP, riprova più tardi." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupLocalAuth(app);

  // ============== AUTH ROUTES ==============

  // Register new user
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);

      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email.toLowerCase());
      if (existing) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // If first user, auto-login (already approved as super_admin)
      if (user.role === "super_admin") {
        req.login({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
        }, (err) => {
          if (err) {
            return res.status(500).json({ message: "Errore durante il login" });
          }
          return res.status(201).json({
            message: "Registrazione completata! Sei il primo utente, quindi sei Super Admin.",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isApproved: user.isApproved,
            }
          });
        });
      } else {
        res.status(201).json({
          message: "Registrazione completata! Un admin dovrà approvare il tuo account.",
          pending: true
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Login
  app.post("/api/auth/login", authLimiter, (req, res, next) => {
    try {
      loginUserSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: error.errors?.[0]?.message || "Dati non validi" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Errore durante il login" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenziali non valide" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login" });
        }
        res.json({ message: "Login effettuato", user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Errore durante il logout" });
      }
      res.json({ message: "Logout effettuato" });
    });
  });

  // Removed setup-admin endpoint for security reasons
  // Removed emergency-reset endpoint for security reasons

  // Request password reset
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email richiesta" });
      }

      // Always return same response to prevent email enumeration (#8)
      const genericMessage = "Se l'email esiste, riceverai un link per il reset";

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ message: genericMessage });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      // Store only the hash in DB to prevent token theft from DB dumps (#2)
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const expiry = new Date(Date.now() + 3600000);

      await storage.setResetToken(user.id, tokenHash, expiry);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      // Send the raw token to user, store the hash
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, baseUrl);

      if (!emailSent) {
        console.error("Failed to send reset email for user:", user.id);
      }

      // Always return 200 with same message regardless of outcome (#8)
      res.json({ message: genericMessage });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Errore durante la richiesta" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token e password richiesti" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "La password deve avere almeno 6 caratteri" });
      }

      // Hash the incoming token and compare against DB hash (#2)
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const user = await storage.getUserByResetToken(tokenHash);
      if (!user) {
        return res.status(400).json({ message: "Token non valido o scaduto" });
      }

      if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
        await storage.clearResetToken(user.id);
        return res.status(400).json({ message: "Token scaduto. Richiedi un nuovo reset." });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(user.id, passwordHash);
      await storage.clearResetToken(user.id);

      // Invalidate all existing sessions for this user (#10)
      await storage.clearUserSessions(user.id);

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Errore durante il reset" });
    }
  });

  // Change password (logged in user)
  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Password attuale e nuova richieste" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La nuova password deve avere almeno 6 caratteri" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Utente non trovato" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Password attuale non corretta" });
      }

      const passwordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, passwordHash);

      // Invalidate all other sessions for this user (#10)
      await storage.clearUserSessions(user.id);

      // Re-login the current session so the user stays authenticated
      req.login({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved,
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Password cambiata ma errore nella sessione" });
        }
        res.json({ message: "Password cambiata con successo" });
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Errore durante il cambio password" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Non autenticato" });
    }

    // Get full user data from database
    storage.getUser(req.user!.id).then(user => {
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      // Don't send password hash
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    }).catch(error => {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Errore nel recupero utente" });
    });
  });

  // Update user's initial capital
  app.patch("/api/auth/user/capital", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { initialCapital } = req.body;

      if (typeof initialCapital !== "number" || initialCapital < 0) {
        return res.status(400).json({ message: "Valore capitale non valido" });
      }

      const user = await storage.updateUserCapital(userId, initialCapital);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "Utente non trovato" });
      }
    } catch (error) {
      console.error("Error updating capital:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del capitale" });
    }
  });

  // Update user's tutorial status
  app.patch("/api/auth/user/tutorial", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { hasCompletedTutorial } = req.body;

      if (typeof hasCompletedTutorial !== "boolean") {
        return res.status(400).json({ message: "Valore boolean richiesto" });
      }

      const user = await storage.updateUserTutorial(userId, hasCompletedTutorial);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "Utente non trovato" });
      }
    } catch (error) {
      console.error("Error updating tutorial status:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento dello stato del tutorial" });
    }
  });

  // Update user's settings (pairs, emotions, confluences, barriers)
  app.patch("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validatedSettings = updateUserSettingsSchema.parse(req.body);

      const user = await storage.updateUserSettings(userId, validatedSettings);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "Utente non trovato" });
      }
    } catch (error: any) {
      console.error("Error updating user settings:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      res.status(500).json({ message: "Errore nell'aggiornamento delle impostazioni" });
    }
  });

  // ============== TRADE ROUTES ==============

  // Get current user's trades (with optional pagination #17)
  app.get("/api/trades", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 5000, 5000);
      const offset = parseInt(req.query.offset as string) || 0;
      const trades = await storage.getTradesByUser(userId, limit, offset);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Errore nel recupero trades" });
    }
  });

  // Create a new trade
  app.post("/api/trades", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tradeData = insertTradeSchema.parse({ ...req.body, userId });
      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(400).json({ message: "Errore nella creazione del trade" });
    }
  });

  // Update a trade
  app.patch("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const validatedData = insertTradeSchema.partial().parse(req.body);
      const trade = await storage.updateTrade(id, userId, validatedData);
      if (!trade) {
        return res.status(404).json({ message: "Trade non trovato" });
      }
      res.json(trade);
    } catch (error: any) {
      console.error("Error updating trade:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      res.status(400).json({ message: "Errore nell'aggiornamento del trade" });
    }
  });

  // Delete a trade
  app.delete("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const deleted = await storage.deleteTrade(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Trade non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Errore nell'eliminazione del trade" });
    }
  });

  // ============== STRATEGY ROUTES ==============

  const updateStrategySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    pairs: z.array(z.string().max(20)).max(50).optional(),
    confluencesPro: z.array(z.string().max(100)).max(50).optional(),
    confluencesContro: z.array(z.string().max(100)).max(50).optional(),
    barrierOptions: z.array(z.string().max(20)).max(20).optional(),
    isBarrierEnabled: z.boolean().optional(),
  });

  // Get user's strategies
  app.get("/api/strategies", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const strategies = await storage.getStrategiesByUser(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Errore nel recupero delle strategie" });
    }
  });

  // Create a new strategy
  app.post("/api/strategies", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, pairs, confluencesPro, confluencesContro, barrierOptions, isBarrierEnabled } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Nome strategia richiesto" });
      }
      if (name.length > 100) {
        return res.status(400).json({ message: "Nome strategia troppo lungo (max 100 caratteri)" });
      }

      const strategy = await storage.createStrategy({
        userId,
        name: name.trim(),
        pairs: pairs || [],
        confluencesPro: confluencesPro || [],
        confluencesContro: confluencesContro || [],
        barrierOptions: barrierOptions || [],
        isBarrierEnabled: isBarrierEnabled ?? true,
      });
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Errore nella creazione della strategia" });
    }
  });

  // Update a strategy
  app.patch("/api/strategies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const validatedData = updateStrategySchema.parse(req.body);
      const strategy = await storage.updateStrategy(id, userId, validatedData);
      if (!strategy) {
        return res.status(404).json({ message: "Strategia non trovata" });
      }
      res.json(strategy);
    } catch (error: any) {
      console.error("Error updating strategy:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dati non validi" });
      }
      res.status(400).json({ message: "Errore nell'aggiornamento della strategia" });
    }
  });

  // Delete a strategy
  app.delete("/api/strategies/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const deleted = await storage.deleteStrategy(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Strategia non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Errore nell'eliminazione della strategia" });
    }
  });

  // ============== DIARY ROUTES ==============

  app.get("/api/diary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const diary = await storage.getDiaryByUser(userId);
      res.json(diary);
    } catch (error) {
      console.error("Error fetching diary:", error);
      res.status(500).json({ message: "Errore nel recupero del diario" });
    }
  });

  app.post("/api/diary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const diaryData = insertDiarySchema.parse({ ...req.body, userId });
      const diary = await storage.upsertDiary(diaryData);
      res.status(201).json(diary);
    } catch (error) {
      console.error("Error saving diary:", error);
      res.status(400).json({ message: "Errore nel salvataggio del diario" });
    }
  });

  app.delete("/api/diary/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const deleted = await storage.deleteDiary(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Voce diario non trovata" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting diary:", error);
      res.status(500).json({ message: "Errore nell'eliminazione della voce" });
    }
  });

  // ============== GOAL ROUTES ==============

  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goals = await storage.getGoalsByUser(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Errore nel recupero degli obiettivi" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goalData = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.upsertGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error saving goal:", error);
      res.status(400).json({ message: "Errore nel salvataggio dell'obiettivo" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Obiettivo non trovato" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(500).json({ message: "Errore nell'eliminazione dell'obiettivo" });
    }
  });

  // ============== ADMIN ROUTES ==============

  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Errore nel recupero utenti" });
    }
  });

  // Get all trades (admin only, with optional pagination #16)
  app.get("/api/admin/trades", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 5000, 5000);
      const offset = parseInt(req.query.offset as string) || 0;
      const trades = await storage.getAllTrades(limit, offset);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Errore nel recupero trades" });
    }
  });

  // Update user role (super_admin only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Ruolo non valido" });
      }

      // Prevent changing super_admin role
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin") {
        return res.status(403).json({ message: "Non puoi modificare il ruolo del super admin" });
      }

      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del ruolo" });
    }
  });

  // Update user approval status (admin only)
  app.patch("/api/admin/users/:id/approval", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      if (!["approved", "rejected", "pending"].includes(isApproved)) {
        return res.status(400).json({ message: "Stato approvazione non valido" });
      }

      // Prevent changing super_admin approval
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin") {
        return res.status(403).json({ message: "Non puoi modificare lo stato del super admin" });
      }

      const user = await storage.updateUserApproval(id, isApproved);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user approval:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento dell'approvazione" });
    }
  });

  // Update user subscription plan (admin only)
  app.patch("/api/admin/users/:id/plan", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { plan } = req.body;

      if (!["free", "monthly", "annual"].includes(plan)) {
        return res.status(400).json({ message: "Piano non valido" });
      }

      // Prevent normal admins from changing super_admin plan
      const targetUser = await storage.getUser(id);
      if (targetUser?.role === "super_admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "Non puoi modificare il piano del super admin" });
      }

      let expiresAt: Date | null = null;
      if (plan === "annual") {
        expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (plan === "monthly") {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      const user = await storage.updateUserSubscriptionPlan(id, plan, expiresAt);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del piano" });
    }
  });

  // Reset user password (admin only)
  app.post("/api/admin/users/:id/reset-password", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Utente non trovato" });
      }

      // Prevent super_admin password reset by non-super_admins
      if (targetUser.role === "super_admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "Solo un super admin può resettare la password di un altro super admin" });
      }

      // Prevent normal admins from resetting other admin passwords (lateral escalation)
      if (targetUser.role === "admin" && req.user!.role !== "super_admin") {
        return res.status(403).json({ message: "Solo un super admin può resettare la password di un admin" });
      }

      // Generate a secure random temporary password
      const tempPassword = crypto.randomBytes(12).toString("base64url");
      const passwordHash = await hashPassword(tempPassword);
      await storage.updateUserPassword(id, passwordHash);

      // Try to send the new password via email
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const emailSent = await sendAdminResetPasswordEmail(targetUser.email, tempPassword, baseUrl);

      if (emailSent) {
        res.json({ message: "Password resettata e inviata via email all'utente." });
      } else {
        // Fallback without exposing plaintext to network if not strictly debugging
        console.log(`[ADMIN ACTION] Fallback Temp password for ${targetUser.email} is: ${tempPassword}`);
        res.json({ message: "Password resettata. L'email non è configurata, la nuova password è visibile nei server log." });
      }
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Errore nel reset della password" });
    }
  });

  // Delete user account and ALL their data
  app.delete("/api/admin/users/:id", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const targetUser = await storage.getUser(id);

      if (!targetUser) {
        return res.status(404).json({ message: "Utente non trovato" });
      }

      if (targetUser.role === "super_admin") {
        return res.status(403).json({ message: "Impossibile eliminare un super admin" });
      }

      await storage.deleteUserAndData(id);
      res.json({ message: "Utente e dati eliminati con successo" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Errore durante l'eliminazione dell'utente" });
    }
  });

  // Diagnostic Endpoint for Anthropic API
  app.get("/api/admin/debug-anthropic", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.json({ error: "Nessuna chiave rilevata in process.env.ANTHROPIC_API_KEY dal server Node" });
      }

      // Try fetching available models first
      const modelsResponse = await fetch("https://api.anthropic.com/v1/models", {
        method: "GET",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      });
      
      const modelsPayload = await modelsResponse.text();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 10, messages: [{ role: "user", content: "Test di connessione. Rispondi 'OK'" }] })
      });
      
      const payload = await response.text();
      res.json({ 
        modelsStatus: modelsResponse.status,
        availableModels: modelsPayload,
        httpStatus: response.status, 
        anthropicResponse: payload, 
        keyValidation: { length: apiKey.length, prefix: apiKey.substring(0, 10) + "..." }
      });
    } catch (err: any) {
      res.json({ systemError: err.message, stack: err.stack });
    }
  });

  // ============== AI COACH ROUTES ==============

  const isProUser: RequestHandler = async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      if (req.user.role === "super_admin") {
        return next();
      }

      const user = await storage.getUser(req.user.id);
      if (!user || user.subscriptionPlan !== "annual") {
        return res.status(403).json({ message: "Funzionalità riservata ai membri Pro" });
      }
      if (user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt) {
        return res.status(403).json({ message: "Il tuo abbonamento Pro è scaduto" });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: "Errore verifica abbonamento" });
    }
  };

  const aiCoachLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 1,
    keyGenerator: (req) => {
      // Use user id if authenticated, fallback to IP (fixes same-IP blockage)
      return (req as any).user?.id || req.ip;
    },
    message: { message: "Attendi 30 secondi prima di inviare un'altra richiesta." },
  });

  app.get("/api/ai-coach/status", isAuthenticated, isProUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const lastAnalysis = await storage.getLatestAiAnalysis(userId);
      const totalTrades = await storage.getTradeCountByUser(userId);

      const tradesSinceLastAnalysis = lastAnalysis ? totalTrades - lastAnalysis.tradeCountAtAnalysis : totalTrades;
      const tradesNeeded = Math.max(0, 10 - tradesSinceLastAnalysis);

      let hoursRemaining = 0;
      let nextAvailableDate = null;

      if (lastAnalysis) {
        const _48h = 48 * 60 * 60 * 1000;
        const timePassed = Date.now() - new Date(lastAnalysis.createdAt).getTime();
        
        if (timePassed < _48h) {
          hoursRemaining = (_48h - timePassed) / (1000 * 60 * 60);
          nextAvailableDate = new Date(new Date(lastAnalysis.createdAt).getTime() + _48h).toISOString();
        }
      }

      const canRequest = hoursRemaining === 0 && tradesSinceLastAnalysis >= 10;
      const previousAnalyses = await storage.getAiAnalysesByUser(userId);

      res.json({
        canRequest,
        lastAnalysisDate: lastAnalysis ? lastAnalysis.createdAt : null,
        nextAvailableDate: hoursRemaining > 0 ? nextAvailableDate : null,
        tradesNeeded,
        tradesSinceLastAnalysis,
        hoursRemaining,
        previousAnalyses: previousAnalyses.map(a => ({ 
          id: a.id, 
          createdAt: a.createdAt, 
          overallScore: (a.analysisData as any)?.overallScore ?? null 
        }))
      });
    } catch (error) {
      console.error("Error fetching AI status:", error);
      res.status(500).json({ message: "Errore nel recupero dello stato AI Coach" });
    }
  });

  app.post("/api/ai-coach/analyze", isAuthenticated, isProUser, aiCoachLimiter, async (req, res) => {
    try {
      const userId = req.user!.id;
      const lastAnalysis = await storage.getLatestAiAnalysis(userId);
      const totalTradesCount = await storage.getTradeCountByUser(userId);

      const tradesSinceLastAnalysis = lastAnalysis ? totalTradesCount - lastAnalysis.tradeCountAtAnalysis : totalTradesCount;
      if (tradesSinceLastAnalysis < 10) {
        return res.status(400).json({ message: "Registra almeno 10 trade dall'ultima analisi per attivare l'AI Coach" });
      }

      if (lastAnalysis) {
        const _48h = 48 * 60 * 60 * 1000;
        const timePassed = Date.now() - new Date(lastAnalysis.createdAt).getTime();
        if (timePassed < _48h) {
          return res.status(400).json({ message: "Devi attendere 48 ore dalla tua ultima analisi." });
        }
      }

      const trades = await storage.getTradesByUser(userId, 99999, 0);
      if (trades.length < 10) {
        return res.status(400).json({ message: "Registra almeno 10 trade totali per attivare l'AI Coach" });
      }

      const strategies = await storage.getStrategiesByUser(userId);
      const aggregatedData = aggregateTradeData(trades, strategies.map(s => ({ id: s.id, name: s.name })));
      const aiResult = await generateAICoachAnalysis(userId, aggregatedData);

      const analysis = await storage.createAiAnalysis({
        userId,
        tradeCountAtAnalysis: totalTradesCount,
        analysisData: aiResult.rawResponse,
        promptTokensUsed: aiResult.promptTokensUsed,
        completionTokensUsed: aiResult.completionTokensUsed,
        model: aiResult.model
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Error running AI Coach:", error);
      res.status(503).json({ message: error.message || "Il servizio AI è temporaneamente non disponibile. Riprova tra qualche minuto." });
    }
  });

  app.get("/api/ai-coach/:id", isAuthenticated, isProUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID non valido" });

      const analysis = await storage.getAiAnalysisById(id, userId);
      if (!analysis) {
        return res.status(404).json({ message: "Analisi non trovata" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      res.status(500).json({ message: "Errore nel recupero dell'analisi" });
    }
  });

  return httpServer;
}
