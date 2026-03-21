import {
  users,
  trades,
  tradingDiary,
  goals,
  strategies,
  aiAnalyses,
  type User,
  type UpsertUser,
  type Trade,
  type InsertTrade,
  type TradingDiary,
  type InsertDiary,
  type Goal,
  type InsertGoal,
  type Strategy,
  type InsertStrategy,
  type AiAnalysis,
  type InsertAiAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { pool } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUserAndData(id: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserApproval(id: string, isApproved: string): Promise<User | undefined>;
  updateUserSubscriptionPlan(id: string, plan: string, expiresAt?: Date | null): Promise<User | undefined>;
  updateUserCapital(id: string, capital: number): Promise<User | undefined>;
  updateUserSettings(id: string, settings: { pairs?: string[], emotions?: string[], confluencesPro?: string[], confluencesContro?: string[], barrierOptions?: string[], isBarrierEnabled?: boolean }): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  setResetToken(id: string, token: string, expiry: Date): Promise<User | undefined>;
  clearResetToken(id: string): Promise<User | undefined>;
  clearUserSessions(userId: string): Promise<void>;
  updateUserTutorial(id: string, hasCompletedTutorial: boolean): Promise<User | undefined>;
  isFirstUser(): Promise<boolean>;

  // Trade operations
  getTradesByUser(userId: string, limit?: number, offset?: number): Promise<Trade[]>;
  getAllTrades(limit?: number, offset?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, userId: string, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number, userId: string): Promise<boolean>;
  getTradeById(id: number): Promise<Trade | undefined>;

  // Diary operations
  getDiaryByUser(userId: string): Promise<TradingDiary[]>;
  getDiaryByDate(userId: string, date: string): Promise<TradingDiary | undefined>;
  upsertDiary(diary: InsertDiary): Promise<TradingDiary>;
  deleteDiary(id: number, userId: string): Promise<boolean>;

  // Goal operations
  getGoalsByUser(userId: string): Promise<Goal[]>;
  getGoalByMonth(userId: string, month: number, year: number): Promise<Goal | undefined>;
  upsertGoal(goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: number, userId: string): Promise<boolean>;

  // Strategy operations
  getStrategiesByUser(userId: string): Promise<Strategy[]>;
  getStrategyById(id: number, userId: string): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, userId: string, data: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number, userId: string): Promise<boolean>;

  // AI Coach operations
  getAiAnalysesByUser(userId: string): Promise<AiAnalysis[]>;
  getLatestAiAnalysis(userId: string): Promise<AiAnalysis | undefined>;
  createAiAnalysis(data: InsertAiAnalysis): Promise<AiAnalysis>;
  getAiAnalysisById(id: number, userId: string): Promise<AiAnalysis | undefined>;
  getTradeCountByUser(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    // Use a transaction to atomically check first-user and insert (#7 race condition fix)
    const result = await db.transaction(async (tx) => {
      // Check if any users exist within the transaction
      const countResult = await tx.select({ count: sql<number>`count(*)` }).from(users);
      const isFirst = countResult[0].count === 0;
      const role = isFirst ? "super_admin" : "user";
      const isApproved = isFirst ? "approved" : "pending";

      const [user] = await tx
        .insert(users)
        .values({ ...userData, role, isApproved })
        .returning();
      return user;
    });
    return result;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user (becomes super_admin)
    const isFirst = await this.isFirstUser();
    const role = isFirst ? "super_admin" : (userData.role || "user");
    const isApproved = isFirst ? "approved" : (userData.isApproved || "pending");

    const [user] = await db
      .insert(users)
      .values({ ...userData, role, isApproved })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUserAndData(id: string): Promise<void> {
    await db.delete(trades).where(eq(trades.userId, id));
    await db.delete(tradingDiary).where(eq(tradingDiary.userId, id));
    await db.delete(goals).where(eq(goals.userId, id));
    await db.delete(strategies).where(eq(strategies.userId, id));
    await db.delete(aiAnalyses).where(eq(aiAnalyses.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserApproval(id: string, isApproved: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isApproved, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSubscriptionPlan(id: string, plan: string, expiresAt?: Date | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionPlan: plan, 
        subscriptionExpiresAt: expiresAt || null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCapital(id: string, initialCapital: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ initialCapital, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSettings(id: string, settings: { pairs?: string[], emotions?: string[], confluencesPro?: string[], confluencesContro?: string[], barrierOptions?: string[], isBarrierEnabled?: boolean }): Promise<User | undefined> {
    // Explicit field extraction to prevent mass-assignment attacks
    const safeUpdate: Record<string, any> = { updatedAt: new Date() };
    if (settings.pairs !== undefined) safeUpdate.pairs = settings.pairs;
    if (settings.emotions !== undefined) safeUpdate.emotions = settings.emotions;
    if (settings.confluencesPro !== undefined) safeUpdate.confluencesPro = settings.confluencesPro;
    if (settings.confluencesContro !== undefined) safeUpdate.confluencesContro = settings.confluencesContro;
    if (settings.barrierOptions !== undefined) safeUpdate.barrierOptions = settings.barrierOptions;
    if (settings.isBarrierEnabled !== undefined) safeUpdate.isBarrierEnabled = settings.isBarrierEnabled;

    const [user] = await db
      .update(users)
      .set(safeUpdate)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async isFirstUser(): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count === 0;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    return user;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async setResetToken(id: string, token: string, expiry: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiry: expiry, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async clearResetToken(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async clearUserSessions(userId: string): Promise<void> {
    // Delete all sessions belonging to this user from the sessions table.
    // Sessions store user ID inside the JSON 'sess' column as sess.passport.user
    await pool.query(
      `DELETE FROM sessions WHERE sess::jsonb -> 'passport' ->> 'user' = $1`,
      [userId]
    );
  }

  async updateUserTutorial(id: string, hasCompletedTutorial: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ hasCompletedTutorial, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Trade operations
  async getTradesByUser(userId: string, limit = 5000, offset = 0): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.date), desc(trades.time))
      .limit(limit)
      .offset(offset);
  }

  async getAllTrades(limit = 5000, offset = 0): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .orderBy(desc(trades.date), desc(trades.time))
      .limit(limit)
      .offset(offset);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: number, userId: string, trade: Partial<InsertTrade>): Promise<Trade | undefined> {
    const [updated] = await db
      .update(trades)
      .set(trade)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTrade(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(trades)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  // Diary operations
  async getDiaryByUser(userId: string): Promise<TradingDiary[]> {
    return await db
      .select()
      .from(tradingDiary)
      .where(eq(tradingDiary.userId, userId))
      .orderBy(desc(tradingDiary.date));
  }

  async getDiaryByDate(userId: string, date: string): Promise<TradingDiary | undefined> {
    const [diary] = await db
      .select()
      .from(tradingDiary)
      .where(and(eq(tradingDiary.userId, userId), eq(tradingDiary.date, date)));
    return diary;
  }

  async upsertDiary(diary: InsertDiary): Promise<TradingDiary> {
    // Use transaction to prevent race condition on concurrent upserts (#19)
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(tradingDiary)
        .where(and(eq(tradingDiary.userId, diary.userId), eq(tradingDiary.date, diary.date)));

      if (existing) {
        const [updated] = await tx
          .update(tradingDiary)
          .set({ content: diary.content, mood: diary.mood })
          .where(eq(tradingDiary.id, existing.id))
          .returning();
        return updated;
      }
      const [newDiary] = await tx.insert(tradingDiary).values(diary).returning();
      return newDiary;
    });
  }

  async deleteDiary(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(tradingDiary)
      .where(and(eq(tradingDiary.id, id), eq(tradingDiary.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Goal operations
  async getGoalsByUser(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.year), desc(goals.month));
  }

  async getGoalByMonth(userId: string, month: number, year: number): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.month, month), eq(goals.year, year)));
    return goal;
  }

  async upsertGoal(goal: InsertGoal): Promise<Goal> {
    // Use transaction to prevent race condition on concurrent upserts (#19)
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(goals)
        .where(and(eq(goals.userId, goal.userId), eq(goals.month, goal.month), eq(goals.year, goal.year)));

      if (existing) {
        const [updated] = await tx
          .update(goals)
          .set({
            targetTrades: goal.targetTrades,
            targetWinRate: goal.targetWinRate,
            targetProfit: goal.targetProfit,
          })
          .where(eq(goals.id, existing.id))
          .returning();
        return updated;
      }
      const [newGoal] = await tx.insert(goals).values(goal).returning();
      return newGoal;
    });
  }

  async deleteGoal(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Strategy operations
  async getStrategiesByUser(userId: string): Promise<Strategy[]> {
    return await db
      .select()
      .from(strategies)
      .where(eq(strategies.userId, userId))
      .orderBy(strategies.name);
  }

  async getStrategyById(id: number, userId: string): Promise<Strategy | undefined> {
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId)));
    return strategy;
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async updateStrategy(id: number, userId: string, data: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const [updated] = await db
      .update(strategies)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId)))
      .returning();
    return updated;
  }

  async deleteStrategy(id: number, userId: string): Promise<boolean> {
    // First, unlink any trades that reference this strategy
    await db
      .update(trades)
      .set({ strategyId: null })
      .where(and(eq(trades.strategyId, id), eq(trades.userId, userId)));

    const result = await db
      .delete(strategies)
      .where(and(eq(strategies.id, id), eq(strategies.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // AI Coach operations
  async getAiAnalysesByUser(userId: string): Promise<AiAnalysis[]> {
    return await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.userId, userId))
      .orderBy(desc(aiAnalyses.createdAt));
  }

  async getLatestAiAnalysis(userId: string): Promise<AiAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.userId, userId))
      .orderBy(desc(aiAnalyses.createdAt))
      .limit(1);
    return analysis;
  }

  async createAiAnalysis(data: InsertAiAnalysis): Promise<AiAnalysis> {
    const [analysis] = await db.insert(aiAnalyses).values(data).returning();
    return analysis;
  }

  async getAiAnalysisById(id: number, userId: string): Promise<AiAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(aiAnalyses)
      .where(and(eq(aiAnalyses.id, id), eq(aiAnalyses.userId, userId)));
    return analysis;
  }

  async getTradeCountByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.userId, userId));
    return Number(result[0].count);
  }
}

export const storage = new DatabaseStorage();
