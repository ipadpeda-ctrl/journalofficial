import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, CalendarDays, ThumbsUp, ThumbsDown } from "lucide-react";

interface HeatmapData {
  day: string;
  hour: string;
  score: number; // 0-100
}

interface TimeAnalysis {
  bestDays: string[];
  worstDays: string[];
  bestHours: string[];
  worstHours: string[];
  heatmapData: HeatmapData[];
  summary: string;
}

interface TimeHeatmapProps {
  data: TimeAnalysis;
}

export default function TimeHeatmap({ data }: TimeHeatmapProps) {
  if (!data) return null;

  return (
    <Card className="shadow-violet-500/5">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-indigo-500" />
          Analisi Temporale
        </CardTitle>
        <CardDescription>{data.summary}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" /> Giorni della settimana
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Migliori:</span>{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">{data.bestDays?.join(", ") || "N/D"}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ThumbsDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Peggiori:</span>{" "}
                  <span className="text-rose-600 dark:text-rose-400">{data.worstDays?.join(", ") || "N/D"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" /> Fasce Orarie
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <ThumbsUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Migliori:</span>{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">{data.bestHours?.join(", ") || "N/D"}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ThumbsDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Peggiori:</span>{" "}
                  <span className="text-rose-600 dark:text-rose-400">{data.worstHours?.join(", ") || "N/D"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pseudo-heatmap */}
        {data.heatmapData && data.heatmapData.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-medium text-center text-muted-foreground">Hotspot di Trading</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {data.heatmapData.slice(0, 10).map((h, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-md text-xs font-medium border
                  ${h.score >= 80 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 
                    h.score >= 50 ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' : 
                    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'}`}
                >
                  {h.day} {h.hour}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
