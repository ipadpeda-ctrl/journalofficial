import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, ThumbsUp, Medal } from "lucide-react";

interface ConfluenceStat {
  name: string;
  winRate: number;
  totalTrades: number;
  avgRR: number;
  verdict: string;
}

interface ComboStat {
  combo: string;
  winRate: number;
  totalTrades: number;
  verdict: string;
}

interface ConfluenceCardProps {
  topConfluences: ConfluenceStat[];
  bestCombos: ComboStat[];
  summary: string;
}

export default function ConfluenceCard({ topConfluences, bestCombos, summary }: ConfluenceCardProps) {
  return (
    <Card className="shadow-violet-500/5 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LineChart className="w-5 h-5 text-violet-500" />
          Pattern di Confluenza
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          <div className="p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="w-4 h-4" /> Top Confluenze Singole
            </h4>
            {topConfluences?.length > 0 ? (
              <div className="space-y-3">
                {topConfluences.map((c, i) => (
                  <div key={i} className="flex justify-between items-start pt-2 border-t first:border-0 first:pt-0">
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.verdict}</div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-bold text-emerald-500">{c.winRate.toFixed(0)}% WR</div>
                      <div className="text-[10px] text-muted-foreground">{c.totalTrades} trades • {c.avgRR.toFixed(1)} RR</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Dati insufficienti.</p>
            )}
          </div>
          
          <div className="p-4 space-y-4 bg-muted/10">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Medal className="w-4 h-4" /> Migliori Combinazioni
            </h4>
            {bestCombos?.length > 0 ? (
              <div className="space-y-3">
                {bestCombos.map((c, i) => (
                  <div key={i} className="pt-2 border-t first:border-0 first:pt-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium text-sm break-words line-clamp-2">{c.combo}</div>
                      <div className="font-bold text-violet-500 ml-2 shrink-0">{c.winRate.toFixed(0)}%</div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{c.verdict}</span>
                      <span>({c.totalTrades} tr)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Dati insufficienti o nessuna combo definita.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
