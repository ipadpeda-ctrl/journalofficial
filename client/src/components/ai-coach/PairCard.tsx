import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

interface PairStat {
  pair: string;
  winRate: number;
  totalTrades: number;
  totalPnl: number;
  verdict: string;
}

interface PairAnalysis {
  bestPairs: PairStat[];
  worstPairs: PairStat[];
  summary: string;
}

interface PairCardProps {
  data: PairAnalysis;
}

export default function PairCard({ data }: PairCardProps) {
  if (!data) return null;

  return (
    <Card className="shadow-violet-500/5">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="w-5 h-5 text-amber-500" />
          Analisi Asset (Pairs)
        </CardTitle>
        <CardDescription>{data.summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" /> Migliori Asset
            </h4>
            {data.bestPairs?.length > 0 ? (
              <div className="space-y-3">
                {data.bestPairs.map((p, i) => (
                  <div key={i} className="flex justify-between items-center pt-2 border-t first:border-0 first:pt-0">
                    <div>
                      <div className="font-bold text-sm bg-muted px-2 py-0.5 rounded inline-block">{p.pair}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.verdict}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-500">{p.winRate.toFixed(0)}% WR</div>
                      <div className="text-[10px] text-muted-foreground">{p.totalTrades} tr • {p.totalPnl > 0 ? '+' : ''}${p.totalPnl.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nessun dato.</p>
            )}
          </div>
          
          <div className="p-4 space-y-4 bg-muted/10">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" /> Asset da Evitare
            </h4>
            {data.worstPairs?.length > 0 ? (
              <div className="space-y-3">
                {data.worstPairs.map((p, i) => (
                  <div key={i} className="flex justify-between items-center pt-2 border-t first:border-0 first:pt-0">
                    <div>
                      <div className="font-bold text-sm bg-muted px-2 py-0.5 rounded inline-block">{p.pair}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.verdict}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-500">{p.winRate.toFixed(0)}% WR</div>
                      <div className="text-[10px] text-muted-foreground">{p.totalTrades} tr • {p.totalPnl > 0 ? '+' : ''}${p.totalPnl.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nessun asset negativo rilevante.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
