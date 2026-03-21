import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, TrendingUp, AlertTriangle, AlertCircle } from "lucide-react";

interface OverallScoreProps {
  score: number;
  summary: string;
}

export default function OverallScore({ score, summary }: OverallScoreProps) {
  const getScoreInfo = (s: number) => {
    if (s >= 80) return { color: "text-emerald-500", progressClass: "bg-emerald-500", icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />, label: "Eccellente" };
    if (s >= 60) return { color: "text-blue-500", progressClass: "bg-blue-500", icon: <TrendingUp className="w-8 h-8 text-blue-500" />, label: "Buono" };
    if (s >= 40) return { color: "text-amber-500", progressClass: "bg-amber-500", icon: <AlertTriangle className="w-8 h-8 text-amber-500" />, label: "Migliorabile" };
    return { color: "text-rose-500", progressClass: "bg-rose-500", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, label: "Critico" };
  };

  const info = getScoreInfo(score);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
      {/* Background glow base on score */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${info.progressClass}`} />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {info.icon}
          <div>
            <div>Trading Score Complessivo</div>
            <div className={`text-sm font-normal ${info.color}`}>{info.label}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <span className={`text-5xl font-extrabold tracking-tighter ${info.color}`}>
            {score}
            <span className="text-xl text-muted-foreground font-normal tracking-normal">/100</span>
          </span>
        </div>
        
        <Progress value={score} className={`h-3 [&>div]:${info.progressClass}`} />
        
        <div className="pt-2">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
