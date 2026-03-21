import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, TrendingUp, BrainCircuit, Target, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function ProGate() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full border-violet-500/20 shadow-2xl relative overflow-hidden backdrop-blur-sm bg-background/95">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Sblocca l'
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-blue-500">
                AI Coach
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              L'analisi avanzata con intelligenza artificiale è riservata ai membri PRO.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left my-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Analisi Pattern</h4>
                <p className="text-xs text-muted-foreground">Scopri quali confluenze ti fanno più guadagnare.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Gestione Rischio</h4>
                <p className="text-xs text-muted-foreground">Risolvi overtrading e migliora il R:R medio.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border">
              <BrainCircuit className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Psicologia (Tilt)</h4>
                <p className="text-xs text-muted-foreground">Identifica reazioni a filotti di loss e hold-time.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border">
              <Target className="w-5 h-5 text-rose-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Advice Specifici</h4>
                <p className="text-xs text-muted-foreground">Consigli calcolati solo sui tuoi trade reali.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 w-full pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Upgrade automatico su piano Annuale
            </div>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-md h-12 shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                // Modello di subscription placeholder per ora.
                // Se implementato, navigherà al portale Stripe.
                alert("Questa è la pagina di simulazione Upgrade! Attiva l'utente da database settando subscriptionPlan='annual'.");
              }}
            >
              Passa al Piano PRO
            </Button>
            <Button variant="ghost" className="w-full hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={() => setLocation("/")}>
              Torna alla Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
