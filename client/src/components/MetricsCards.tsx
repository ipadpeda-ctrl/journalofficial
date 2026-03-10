import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import { CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getStatisticalTrades,
  isWinningTrade,
  isLosingTrade,
  calculateProfitFactor,
  calculateAvgWinPercent,
  calculateAvgLossPercent,
  calculateExpectancy,
  calculateWinRate,
} from "@/lib/tradeStatsUtils";

interface MetricsCardsProps {
  trades: Trade[];
}

interface MetricCardProps {
  label: string;
  value: string;
  color: "green" | "blue" | "teal" | "red";
  tooltip: string;
}

function MetricCard({ label, value, color, tooltip }: MetricCardProps) {
  const colorClasses = {
    green: "bg-emerald-600",
    blue: "bg-blue-600",
    teal: "bg-teal-600",
    red: "bg-red-800",
  };

  return (
    <Card className={`p-4 ${colorClasses[color]} text-white`}>
      <div className="flex items-center justify-center mb-2">
        <CheckCircle className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-center font-mono">{value}</p>
      <div className="flex items-center justify-center gap-1 mt-2">
        <span className="text-sm opacity-90">{label}</span>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-3 h-3 opacity-70" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-48 text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}

export default function MetricsCards({ trades }: MetricsCardsProps) {
  const statTrades = getStatisticalTrades(trades);

  const profitFactor = calculateProfitFactor(trades);
  const profitFactorStr = profitFactor === Infinity ? "∞" : profitFactor.toFixed(2);

  const avgWin = calculateAvgWinPercent(trades);
  const avgLoss = calculateAvgLossPercent(trades);

  // RR medio: solo su trade vincenti (target + parziale), esclude stop_loss
  const winningTradesWithRR = statTrades.filter((t) => t.rr != null && t.rr > 0 && (t.result === "target" || t.result === "parziale"));
  const avgRR = winningTradesWithRR.length > 0
    ? (winningTradesWithRR.reduce((sum, t) => sum + (t.rr || 0), 0) / winningTradesWithRR.length).toFixed(2)
    : avgLoss > 0
      ? (avgWin / avgLoss).toFixed(2)
      : avgWin > 0 ? avgWin.toFixed(2) : "0.00";

  // Expectancy in unità percentuali del conto per trade
  const expectancy = calculateExpectancy(trades);

  // Perdita media come percentuale del conto
  const avgLossPercent = avgLoss > 0
    ? `-${avgLoss.toFixed(2)}%`
    : "0%";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Profit Factor"
        value={profitFactorStr}
        color="green"
        tooltip="Rapporto tra profitti totali e perdite totali. Un valore sopra 1.5 è considerato buono."
      />
      <MetricCard
        label="RR medio"
        value={avgRR}
        color="blue"
        tooltip="Risk/Reward medio basato sui valori RR inseriti nei trade. Un valore sopra 2 indica un buon risk management."
      />
      <MetricCard
        label="Expectancy"
        value={`${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}%`}
        color="teal"
        tooltip="Guadagno medio atteso per trade in % del conto. Valore positivo indica strategia profittevole nel lungo termine."
      />
      <MetricCard
        label="Perdita media"
        value={avgLossPercent}
        color="red"
        tooltip="Perdita media per ogni trade in perdita, in percentuale del conto."
      />
    </div>
  );
}

