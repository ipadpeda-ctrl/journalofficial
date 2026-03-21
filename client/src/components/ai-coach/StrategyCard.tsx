import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderGit2 } from "lucide-react";

interface StratStat {
  strategyName: string;
  winRate: number;
  totalTrades: number;
}

interface StrategyAnalysis {
  strategies: StratStat[];
  summary: string;
}

interface StrategyCardProps {
  data: StrategyAnalysis;
}

export default function StrategyCard({ data }: StrategyCardProps) {
  if (!data || !data.strategies || data.strategies.length === 0) return null;

  return (
    <Card className="shadow-violet-500/5">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderGit2 className="w-5 h-5 text-blue-500" />
          Confronto Strategie
        </CardTitle>
        <CardDescription>{data.summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {data.strategies.map((s, i) => (
          <div key={i} className="flex justify-between items-center pt-3 border-t first:border-0 first:pt-0">
            <div>
              <div className="font-bold text-sm bg-muted px-2 py-0.5 rounded inline-block">{s.strategyName}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.totalTrades} trade registrati</div>
            </div>
            <div className="text-right">
              <div className={`font-bold text-lg ${s.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {s.winRate.toFixed(0)}% WR
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
