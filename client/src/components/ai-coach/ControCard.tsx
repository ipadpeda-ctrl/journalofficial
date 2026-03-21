import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, AlertOctagon } from "lucide-react";

interface ControStat {
  name: string;
  lossCorrelation: string;
}

interface ControCardProps {
  controConfluences: ControStat[];
}

export default function ControCard({ controConfluences }: ControCardProps) {
  if (!controConfluences || controConfluences.length === 0) return null;

  return (
    <Card className="border-rose-500/20 shadow-rose-500/5">
      <CardHeader className="bg-rose-500/5 pb-4 border-b border-rose-500/10">
        <CardTitle className="flex items-center gap-2 text-lg text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          Confluenze Contro Pericolose
        </CardTitle>
        <CardDescription>
          Segnali a sfavore che hanno la maggior correlazione con le tue perdite.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {controConfluences.map((c, i) => (
          <div key={i} className="flex gap-3 items-start pt-3 border-t first:border-0 first:pt-0">
            <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">{c.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.lossCorrelation}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
