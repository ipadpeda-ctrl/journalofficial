import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, AlertCircle, ArrowUpCircle } from "lucide-react";

interface Advice {
  title: string;
  advice: string;
  priority: "high" | "medium" | "low";
  dataPoint: string;
}

interface AdviceCardProps {
  advices: Advice[];
}

export default function AdviceCard({ advices }: AdviceCardProps) {
  if (!advices || advices.length === 0) return null;

  return (
    <Card className="border-violet-500/20 shadow-lg shadow-violet-500/5 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-blue-500" />
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Consigli Personalizzati
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {advices.map((item, idx) => {
          const isHigh = item.priority === "high";
          const isLow = item.priority === "low";
          
          return (
            <div key={idx} className={`p-4 rounded-xl border ${isHigh ? 'bg-amber-500/5 border-amber-500/20' : 'bg-secondary/50 border-border/50'}`}>
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {isHigh ? (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  ) : isLow ? (
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-sm leading-tight">{item.title}</h4>
                    {isHigh && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Alta Priorità
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.advice}
                  </p>
                  
                  {item.dataPoint && (
                    <div className="inline-flex items-center mt-2 px-2.5 py-1 rounded-md bg-background/50 border shadow-sm text-xs font-mono text-muted-foreground">
                      Dato di supporto: <span className="text-foreground ml-1 font-semibold">{item.dataPoint}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
