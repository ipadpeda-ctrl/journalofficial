import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartPulse, Scale, ShieldAlert } from "lucide-react";

interface EmotionStat {
  emotion: string;
  winRate: number;
  impact: "positivo" | "negativo" | "neutro";
}

interface RiskAnalysis {
  avgRR: number;
  avgRRWinners: number;
  avgRRLosers: number;
  overtradingDays: string[];
  emotionCorrelation: EmotionStat[];
  summary: string;
}

interface RiskCardProps {
  data: RiskAnalysis;
}

export default function RiskCard({ data }: RiskCardProps) {
  if (!data) return null;

  return (
    <Card className="shadow-violet-500/5 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="w-5 h-5 text-fuchsia-500" />
          Rischio & Emozioni
        </CardTitle>
        <CardDescription>{data.summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-4 space-y-4 bg-muted/5">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
              <Scale className="w-4 h-4" /> Statistiche R:R
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border rounded-lg bg-background">
                <div className="text-xs text-muted-foreground">RR Medio (Winner)</div>
                <div className="text-xl font-bold text-emerald-500">{data.avgRRWinners?.toFixed(2) || "N/A"}</div>
              </div>
              <div className="p-3 border rounded-lg bg-background">
                <div className="text-xs text-muted-foreground">RR Medio (Loser)</div>
                <div className="text-xl font-bold text-rose-500">{data.avgRRLosers?.toFixed(2) || "N/A"}</div>
              </div>
              <div className="p-3 border rounded-lg bg-background col-span-2 flex justify-between items-center">
                <div className="text-sm font-medium text-muted-foreground">RR Complessivo</div>
                <div className="text-lg font-bold">{data.avgRR?.toFixed(2) || "N/A"}</div>
              </div>
            </div>

            {data.overtradingDays?.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 text-rose-500 text-sm font-semibold mb-1">
                  <ShieldAlert className="w-4 h-4" /> Overtrading Rilevato
                </div>
                <p className="text-xs text-muted-foreground">Giorni a rischio: {data.overtradingDays.join(", ")}</p>
              </div>
            )}
          </div>
          
          <div className="p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400">
              <HeartPulse className="w-4 h-4" /> Impatto Emotivo
            </h4>
            {data.emotionCorrelation?.length > 0 ? (
              <div className="space-y-3">
                {data.emotionCorrelation.map((e, i) => (
                  <div key={i} className="flex justify-between items-center pt-2 border-t first:border-0 first:pt-0">
                    <div className="font-medium text-sm">{e.emotion}</div>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-foreground text-sm">{e.winRate.toFixed(0)}% WR</div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${e.impact === 'positivo' ? 'bg-emerald-500/10 text-emerald-500' : 
                          e.impact === 'negativo' ? 'bg-rose-500/10 text-rose-500' : 
                          'bg-secondary text-muted-foreground'}`}
                      >
                        {e.impact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nessun dato sulle emozioni.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
