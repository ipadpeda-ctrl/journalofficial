import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

interface RatingStat {
  rating: string;
  winRate: number;
  totalTrades: number;
  verdict: string;
}

interface BarrierAnalysis {
  isAvailable: boolean;
  ratings: RatingStat[];
  summary: string;
}

interface BarrierCardProps {
  data: BarrierAnalysis;
}

export default function BarrierCard({ data }: BarrierCardProps) {
  if (!data || !data.isAvailable) return null;

  return (
    <Card className="shadow-violet-500/5">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="w-5 h-5 text-indigo-500" />
          Rating (Barrier)
        </CardTitle>
        <CardDescription>{data.summary || "Affidabilità del tuo giudizio pre-trade."}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {data.ratings?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.ratings.map((r, i) => (
              <div key={i} className="p-3 border rounded-xl bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">{r.rating}</div>
                  <div className={`text-sm font-bold ${r.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {r.winRate.toFixed(0)}% WR
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{r.totalTrades} trades totali</div>
                <div className="text-xs font-medium text-foreground">{r.verdict}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center">Nessun dato su barrier/rating.</p>
        )}
      </CardContent>
    </Card>
  );
}
