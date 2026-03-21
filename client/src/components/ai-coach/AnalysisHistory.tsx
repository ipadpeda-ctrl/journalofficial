import { format } from "date-fns";
import { it } from "date-fns/locale";
import { History, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface AnalysisHistoryItem {
  id: number;
  createdAt: string;
  overallScore: number;
}

interface AnalysisHistoryProps {
  analyses: AnalysisHistoryItem[];
  activeAnalysisId?: number;
  onSelectAnalysis: (id: number) => void;
}

export default function AnalysisHistory({ analyses, activeAnalysisId, onSelectAnalysis }: AnalysisHistoryProps) {
  if (!analyses || analyses.length === 0) {
    return (
      <div className="w-full space-y-3 bg-card p-4 rounded-xl border opacity-70">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Storico Analisi
        </h3>
        <p className="text-xs text-muted-foreground italic">
          Nessuna analisi passata.
        </p>
      </div>
    );
  }

  // Helper per il colore dello score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    if (score >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="w-full space-y-3 bg-card p-4 rounded-xl border flex flex-col h-[300px]">
      <h3 className="text-sm font-semibold flex items-center gap-2 shrink-0">
        <History className="w-4 h-4 text-muted-foreground" />
        Storico Analisi
      </h3>
      
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {analyses.map((item) => {
            const isActive = activeAnalysisId === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-between h-auto py-3 px-3 ${isActive ? 'border-violet-500/30 bg-violet-500/10' : ''}`}
                onClick={() => onSelectAnalysis(item.id)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={`text-xs font-medium ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`}>
                    {format(new Date(item.createdAt), "dd MMM yyyy", { locale: it })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(item.createdAt), "HH:mm")}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreColor(item.overallScore)}`}>
                    {item.overallScore}
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-violet-500' : 'text-muted-foreground'}`} />
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
