import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Clock, CheckCircle2 } from "lucide-react";

interface StatusResponse {
  canRequest: boolean;
  lastAnalysisDate: string | null;
  nextAvailableDate: string | null;
  tradesNeeded: number;
  tradesSinceLastAnalysis: number;
  hoursRemaining: number;
}

interface RequestButtonProps {
  onAnalysisComplete?: (data: any) => void;
}

export default function RequestButton({ onAnalysisComplete }: RequestButtonProps) {
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery<StatusResponse>({
    queryKey: ["/api/ai-coach/status"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", "/api/ai-coach/analyze");
      return await resp.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-coach/status"] });
      toast({
        title: "Analisi completata!",
        description: "Il tuo AI Coach ha estratto nuove statistiche.",
      });
      if (onAnalysisComplete) onAnalysisComplete(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore durante l'analisi",
        description: error.message || "Riprova tra poco.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <Button disabled className="w-full h-12 relative overflow-hidden">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Sincronizzazione...
      </Button>
    );
  }

  const {
    canRequest,
    tradesNeeded,
    tradesSinceLastAnalysis,
    hoursRemaining,
  } = status || { canRequest: false, tradesNeeded: 10, tradesSinceLastAnalysis: 0, hoursRemaining: 0 };

  const isPending = analyzeMutation.isPending;

  if (canRequest) {
    return (
      <Button 
        onClick={() => analyzeMutation.mutate()} 
        disabled={isPending}
        className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg transition-all"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine" />
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            L'AI sta calcolando...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Richiedi Nuova Analisi
          </>
        )}
      </Button>
    );
  }

  // Se non si può richiedere, determino il motivo
  const progressPercent = Math.min(((tradesSinceLastAnalysis) / 10) * 100, 100);

  return (
    <div className="w-full space-y-3 bg-card p-4 rounded-xl border">
      <h3 className="text-sm font-semibold flex items-center justify-between">
        Nuova Analisi
        <Clock className="w-4 h-4 text-muted-foreground" />
      </h3>
      
      <div className="space-y-4 pt-2">
        {hoursRemaining > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tempo richiesto (48h)</span>
              <span className="font-medium text-amber-500">{hoursRemaining.toFixed(1)}h rimanenti</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500/50 rounded-full transition-all" 
                style={{ width: `${Math.max(0, 100 - (hoursRemaining / 48) * 100)}%` }} 
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Volume Trade</span>
            {tradesNeeded > 0 ? (
              <span className="font-medium text-blue-500">{tradesNeeded} mancanti</span>
            ) : (
              <span className="font-medium text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Raggiunto</span>
            )}
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${tradesNeeded > 0 ? 'bg-blue-500/50' : 'bg-green-500/50'}`} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      <Button disabled variant="outline" className="w-full mt-4 h-10 border-dashed">
        Non ancora disponibile
      </Button>
    </div>
  );
}
