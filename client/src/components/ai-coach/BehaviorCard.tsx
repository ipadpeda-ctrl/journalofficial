import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Zap, Clock, TrendingDown } from "lucide-react";

interface BehavioralPatterns {
  tiltRisk: "high" | "medium" | "low";
  longestWinStreak: number;
  longestLossStreak: number;
  performanceAfterLosses: string;
  holdTimeAnalysis: string;
  summary: string;
}

interface BehaviorCardProps {
  data: BehavioralPatterns;
}

export default function BehaviorCard({ data }: BehaviorCardProps) {
  if (!data) return null;

  const tiltColor = 
    data.tiltRisk === "high" ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
    data.tiltRisk === "medium" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
    "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

  return (
    <Card className="shadow-violet-500/5">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            Comportamento e Psicologia
          </div>
          <div className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${tiltColor}`}>
            <Zap className="w-3 h-3" />
            TILT RISK: {data.tiltRisk?.toUpperCase() || "N/D"}
          </div>
        </CardTitle>
        <CardDescription>{data.summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center text-sm border-b pb-4">
          <div className="text-center w-full border-r">
            <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">Win Streak</div>
            <div className="text-2xl font-black text-emerald-500">{data.longestWinStreak || 0}</div>
          </div>
          <div className="text-center w-full">
            <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">Loss Streak</div>
            <div className="text-2xl font-black text-rose-500">{data.longestLossStreak || 0}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg flex gap-3 items-start border">
            <TrendingDown className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Performance dopo le Loss</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.performanceAfterLosses || "Nessun dato sufficiente sul comportamento dopo serie di perdite."}
              </p>
            </div>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg flex gap-3 items-start border">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Analisi Holding Time</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.holdTimeAnalysis || "Non hai registrato orari di chiusura a sufficienza per analizzare l'holding time."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
