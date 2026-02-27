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
import RiskOfRuinTable from "@/components/RiskOfRuinTable";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import MonthlyComparison from "@/components/MonthlyComparison";

// Helpers passed as props or re-implemented here if small (using props for simplicity)
interface StatisticsViewProps {
    trades: Trade[];
    initialCapital: number;
}

// Helpers
function exportTradesToCSV(trades: Trade[]) {
    const headers = ["Data", "Ora", "Coppia", "Direzione", "Target", "Stop Loss", "Risultato", "P&L", "Emozione", "Confluenze Pro", "Confluenze Contro", "Note"];
    const rows = trades.map(t => [
        t.date, t.time, t.pair, t.direction === "long" ? "Long" : "Short",
        t.target.toFixed(5), t.stopLoss.toFixed(5), t.result, (t.pnl || 0).toFixed(2),
        t.emotion, t.confluencesPro.join("; "), t.confluencesContro.join("; "), t.notes.replace(/"/g, '""'),
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trades_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function calculateProfitFactor(trades: Trade[]): string {
    const wins = trades.filter((t) => t.result === "target");
    const losses = trades.filter((t) => t.result === "stop_loss");
    const totalWins = wins.reduce((sum, t) => sum + t.target, 0);
    const totalLosses = losses.reduce((sum, t) => sum + t.stopLoss, 0);
    if (totalLosses === 0) return totalWins > 0 ? "∞" : "0.00";
    return (totalWins / totalLosses).toFixed(2);
}

function calculateEquity(trades: Trade[], initialCapital: number): string {
    let equity = initialCapital;
    for (const trade of trades) {
        if (trade.result === "target") equity += trade.target * 100;
        else if (trade.result === "stop_loss") equity -= trade.stopLoss * 100;
        else if (trade.result === "parziale") equity += (trade.target * 0.5) * 100;
    }
    return equity.toFixed(2);
}

function calculateEquityCurve(trades: Trade[], initialCapital: number) {
    const sortedTrades = [...trades].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    let equity = initialCapital;
    const curve = [{ date: "Start", equity }];
    for (const trade of sortedTrades) {
        if (trade.result === "target") equity += trade.target * 100;
        else if (trade.result === "stop_loss") equity -= trade.stopLoss * 100;
        else if (trade.result === "parziale") equity += (trade.target * 0.5) * 100;
        curve.push({ date: trade.date.slice(5), equity });
    }
    return curve;
}

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

    const stats = useMemo(() => ({
        totalOperations: filteredTrades.length,
        winRate: filteredTrades.length > 0 ? ((filteredTrades.filter((t) => t.result === "target").length / filteredTrades.length) * 100).toFixed(1) : "0",
        profitFactor: calculateProfitFactor(filteredTrades),
        totalEquity: calculateEquity(filteredTrades, initialCapital),
    }), [filteredTrades, initialCapital]);

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
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.winRate}%</div>
                        <p className="text-sm text-muted-foreground mt-1">{filteredTrades.filter((t) => t.result === "target").length} vincenti su {filteredTrades.length} totali</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Risultato Finale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${parseFloat(stats.totalEquity) >= initialCapital ? "text-emerald-500" : "text-red-500"}`}>
                            {parseFloat(stats.totalEquity) >= initialCapital ? "+" : ""}{(parseFloat(stats.totalEquity) - initialCapital).toFixed(2)} EUR
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Equity totale: {stats.totalEquity} EUR</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <TradeCountDonut trades={filteredTrades} />
                <PerformanceByPair trades={filteredTrades} />
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

            <MoodTracker trades={filteredTrades} />

            <div className="grid lg:grid-cols-2 gap-6">
                <ConfluenceStats trades={filteredTrades} type="pro" />
                <ConfluenceStats trades={filteredTrades} type="contro" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <EquityProjection trades={filteredTrades} initialCapital={initialCapital} />
                <RiskOfRuinTable trades={filteredTrades} />
            </div>

            <EquityCurveChart data={equityData} />
        </div>
    );
}
