import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { type Trade } from "@/components/TradesTable";
import ProGate from "@/components/ai-coach/ProGate";

import RequestButton from "@/components/ai-coach/RequestButton";
import AnalysisHistory from "@/components/ai-coach/AnalysisHistory";
import OverallScore from "@/components/ai-coach/OverallScore";
import AdviceCard from "@/components/ai-coach/AdviceCard";
import ConfluenceCard from "@/components/ai-coach/ConfluenceCard";
import ControCard from "@/components/ai-coach/ControCard";
import TimeHeatmap from "@/components/ai-coach/TimeHeatmap";
import PairCard from "@/components/ai-coach/PairCard";
import BarrierCard from "@/components/ai-coach/BarrierCard";
import RiskCard from "@/components/ai-coach/RiskCard";
import BehaviorCard from "@/components/ai-coach/BehaviorCard";
import StrategyCard from "@/components/ai-coach/StrategyCard";

interface AICoachProps {
  trades: Trade[];
}

export default function AICoach({ trades }: AICoachProps) {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === "annual" || user?.role === "super_admin";

  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);

  const { data: status } = useQuery<{ previousAnalyses: any[] }>({ queryKey: ["/api/ai-coach/status"], enabled: isPro });
  const analyses = status?.previousAnalyses || [];

  const defaultAnalysisId = analyses.length > 0 ? analyses[0].id : null;
  const currentId = activeAnalysisId || defaultAnalysisId;

  const { data: activeAnalysis, isLoading: analysisLoading } = useQuery<{ analysisData: any }>({
    queryKey: [`/api/ai-coach/${currentId}`],
    enabled: !!currentId && isPro
  });

  if (!isPro) {
    return <ProGate />;
  }

  const analysisData = activeAnalysis?.analysisData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              AI Coach
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold tracking-wider">
              PRO
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            L'intelligenza artificiale estrae pattern e leak dai tuoi trade.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {!analysisData ? (
             <div className="text-muted-foreground italic p-8 text-center border rounded-xl border-dashed bg-card/50">
               {analysisLoading ? "Caricamento analisi..." : "Nessuna analisi selezionata. Richiedine una nuova!"}
             </div>
          ) : (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <OverallScore score={analysisData.overallScore} summary={analysisData.overallSummary} />
               <AdviceCard advices={analysisData.personalizedAdvice} />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ConfluenceCard 
                   topConfluences={analysisData.confluenceAnalysis?.topConfluencesPro} 
                   bestCombos={analysisData.confluenceAnalysis?.bestCombos} 
                   summary={analysisData.confluenceAnalysis?.summary} 
                 />
                 <div className="space-y-6">
                   <ControCard controConfluences={analysisData.confluenceAnalysis?.dangerousControConfluences} />
                   <BehaviorCard data={analysisData.behavioralPatterns} />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <RiskCard data={analysisData.riskManagement} />
                 <TimeHeatmap data={analysisData.timeAnalysis} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <PairCard data={analysisData.pairAnalysis} />
                 <div className="space-y-6">
                   <BarrierCard data={analysisData.barrierAnalysis} />
                   <StrategyCard data={analysisData.strategyAnalysis} />
                 </div>
               </div>
             </div>
          )}
        </div>
        
        <div className="space-y-6 sticky top-24">
          <RequestButton onAnalysisComplete={(data) => setActiveAnalysisId(data.id)} />
          <AnalysisHistory 
            analyses={analyses} 
            activeAnalysisId={currentId} 
            onSelectAnalysis={(id) => setActiveAnalysisId(id)} 
          />
        </div>
      </div>
    </div>
  );
}
