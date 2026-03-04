import { useMemo, useState } from "react";
import { Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/components/TradesTable";

// Components
import { EquityCurveChart } from "@/components/Charts";
import { PerformanceByPair, TradeCountDonut, DirectionBreakdown } from "@/components/PerformanceCharts";
import ResultBreakdownCard from "@/components/ResultBreakdownCard";
import MoodTracker from "@/components/MoodTracker";
import ConfluenceStats from "@/components/ConfluenceStats";
import MetricsCards from "@/components/MetricsCards";
import EquityProjection from "@/components/EquityProjection";
import RRDistributionChart from "@/components/RRDistributionChart";
import RiskOfRuinTable from "@/components/RiskOfRuinTable";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import MonthlyComparison from "@/components/MonthlyComparison";

// Centralized stats utilities
import {
    calculateWinRate,
    calculateProfitFactor,
    calculateTotalEquity,
    calculateEquityCurve,
    getStatisticalTrades,
    isWinningTrade,
} from "@/lib/tradeStatsUtils";

interface StatisticsViewProps {
    trades: Trade[];
    initialCapital: number;
}

import { exportTradesToCSV } from "@/lib/csvExport";

export default function StatisticsView({ trades, initialCapital }: StatisticsViewProps) {
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const filteredTrades = useMemo(() => {
        if (!filterStartDate && !filterEndDate) return trades;
        return trades.filter((trade) => {
            const tradeDate = trade.date;
            if (filterStartDate && tradeDate < filterStartDate) return false;
            if (filterEndDate && tradeDate > filterEndDate) return false;
            return true;
        });
    }, [trades, filterStartDate, filterEndDate]);

    const isFiltered = filterStartDate || filterEndDate;
    const clearFilters = () => { setFilterStartDate(""); setFilterEndDate(""); };

    const stats = useMemo(() => {
        const statTrades = getStatisticalTrades(filteredTrades);
        const winRate = calculateWinRate(filteredTrades);
        const profitFactor = calculateProfitFactor(filteredTrades);
        const totalEquity = calculateTotalEquity(filteredTrades, initialCapital);

        return {
            totalOperations: filteredTrades.length,
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2),
            totalEquity: totalEquity.toFixed(2),
            winsCount: statTrades.filter(isWinningTrade).length,
            statTradesCount: statTrades.length,
        };
    }, [filteredTrades, initialCapital]);

    const equityData = useMemo(() => calculateEquityCurve(filteredTrades, initialCapital), [filteredTrades, initialCapital]);

    return (
        <div className="space-y-6">
            <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filtra per periodo:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filterStart" className="text-xs text-muted-foreground">Da:</Label>
                            <Input id="filterStart" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-8 w-36 text-xs" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filterEnd" className="text-xs text-muted-foreground">A:</Label>
                            <Input id="filterEnd" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-8 w-36 text-xs" />
                        </div>
                        {isFiltered && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8"><X className="w-3 h-3 mr-1" />Rimuovi filtri</Button>}
                    </div>
                    <div className="flex items-center gap-2">
                        {isFiltered && <span className="text-xs text-muted-foreground">Mostrati {filteredTrades.length} di {trades.length} trade</span>}
                        <Button variant="outline" onClick={() => exportTradesToCSV(filteredTrades)} disabled={filteredTrades.length === 0}><Download className="w-4 h-4 mr-2" />Esporta CSV</Button>
                    </div>
                </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <DirectionBreakdown trades={filteredTrades} />
                <Card className="bg-gradient-to-br from-card to-emerald-900/10 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-500/80">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-mono text-emerald-500">{stats.winRate}%</div>
                        <p className="text-sm text-muted-foreground mt-1">{stats.winsCount} vincenti su {stats.statTradesCount} totali</p>
                    </CardContent>
                </Card>
                <Card className={`bg-gradient-to-br from-card ${parseFloat(stats.totalEquity) >= initialCapital ? "to-emerald-900/10 border-emerald-500/20" : "to-red-900/10 border-red-500/20"}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${parseFloat(stats.totalEquity) >= initialCapital ? "text-emerald-500/80" : "text-red-500/80"}`}>Risultato Finale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold font-mono ${parseFloat(stats.totalEquity) >= initialCapital ? "text-emerald-500" : "text-red-500"}`}>
                            {parseFloat(stats.totalEquity) >= initialCapital ? "+" : ""}{(parseFloat(stats.totalEquity) - initialCapital).toFixed(2)} EUR
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Equity totale: <span className="font-mono">{stats.totalEquity}</span> EUR</p>
                    </CardContent>
                </Card>
            </div>

            <MetricsCards trades={filteredTrades} />
            <AdvancedMetrics trades={filteredTrades} initialCapital={initialCapital} />
            <MonthlyComparison trades={filteredTrades} initialCapital={initialCapital} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ResultBreakdownCard title="Take Profit" result="target" trades={filteredTrades} color="hsl(142, 71%, 45%)" />
                <ResultBreakdownCard title="Stop Loss" result="stop_loss" trades={filteredTrades} color="hsl(0, 84%, 60%)" />
                <ResultBreakdownCard title="Breakeven" result="breakeven" trades={filteredTrades} color="hsl(45, 93%, 47%)" />
                <ResultBreakdownCard title="Parziali" result="parziale" trades={filteredTrades} color="hsl(217, 91%, 60%)" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <RRDistributionChart trades={filteredTrades} />
                <TradeCountDonut trades={filteredTrades} />
            </div>

            <MoodTracker trades={filteredTrades} />

            <div className="grid lg:grid-cols-2 gap-6">
                <ConfluenceStats trades={filteredTrades} type="pro" />
                <ConfluenceStats trades={filteredTrades} type="contro" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <PerformanceByPair trades={filteredTrades} />
                <RiskOfRuinTable trades={filteredTrades} />
            </div>

            <div className="grid lg:grid-cols-1 gap-6">
                <EquityProjection trades={filteredTrades} initialCapital={initialCapital} />
            </div>

            <EquityCurveChart data={equityData} />
        </div >
    );
}
