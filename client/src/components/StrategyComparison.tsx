import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from "recharts";
import { Layers } from "lucide-react";
import { Trade } from "./TradesTable";
import { isWinningTrade, calculateTradePnlPercent } from "@/lib/tradeStatsUtils";

interface Strategy {
    id: number;
    name: string;
}

interface StrategyComparisonProps {
    trades: Trade[];
}

const COLORS = [
    "hsl(210, 90%, 55%)",
    "hsl(142, 71%, 45%)",
    "hsl(350, 80%, 55%)",
    "hsl(45, 93%, 47%)",
    "hsl(280, 70%, 55%)",
    "hsl(180, 60%, 45%)",
    "hsl(15, 80%, 55%)",
    "hsl(240, 60%, 55%)",
];

export default function StrategyComparison({ trades }: StrategyComparisonProps) {
    const { data: strategies = [] } = useQuery<Strategy[]>({
        queryKey: ["/api/strategies"],
    });

    const chartData = useMemo(() => {
        if (strategies.length === 0) return [];

        // Build a map: strategyId -> trades
        const strategyTradesMap = new Map<number | null, Trade[]>();
        for (const trade of trades) {
            const key = trade.strategyId || null;
            if (!strategyTradesMap.has(key)) strategyTradesMap.set(key, []);
            strategyTradesMap.get(key)!.push(trade);
        }

        const data: {
            name: string;
            trades: number;
            winRate: number;
            avgRR: number;
            pnl: number;
        }[] = [];

        // Add strategies
        for (const strategy of strategies) {
            const stratTrades = strategyTradesMap.get(strategy.id) || [];
            const statTrades = stratTrades.filter((t) => t.result !== "non_fillato");
            const wins = statTrades.filter(isWinningTrade).length;
            const winRate = statTrades.length > 0 ? (wins / statTrades.length) * 100 : 0;
            const avgRR =
                statTrades.length > 0
                    ? statTrades.reduce((sum, t) => sum + (t.rr || 0), 0) / statTrades.length
                    : 0;
            const pnl = stratTrades.reduce(
                (sum, t) => sum + calculateTradePnlPercent(t),
                0
            );

            data.push({
                name: strategy.name,
                trades: stratTrades.length,
                winRate: parseFloat(winRate.toFixed(1)),
                avgRR: parseFloat(avgRR.toFixed(2)),
                pnl: parseFloat(pnl.toFixed(2)),
            });
        }

        // Add "Senza strategia" if there are trades without strategy
        const noStratTrades = strategyTradesMap.get(null) || [];
        if (noStratTrades.length > 0) {
            const statTrades = noStratTrades.filter((t) => t.result !== "non_fillato");
            const wins = statTrades.filter(isWinningTrade).length;
            const winRate = statTrades.length > 0 ? (wins / statTrades.length) * 100 : 0;
            const avgRR =
                statTrades.length > 0
                    ? statTrades.reduce((sum, t) => sum + (t.rr || 0), 0) / statTrades.length
                    : 0;
            const pnl = noStratTrades.reduce(
                (sum, t) => sum + calculateTradePnlPercent(t),
                0
            );
            data.push({
                name: "Senza strategia",
                trades: noStratTrades.length,
                winRate: parseFloat(winRate.toFixed(1)),
                avgRR: parseFloat(avgRR.toFixed(2)),
                pnl: parseFloat(pnl.toFixed(2)),
            });
        }

        return data;
    }, [trades, strategies]);

    if (strategies.length === 0 || chartData.length < 2) return null;

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Confronto Strategie</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
                Win Rate, RR medio e P&L per strategia
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Win Rate Chart */}
                <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Win Rate (%)</p>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
                                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "6px",
                                    }}
                                    formatter={(value: number) => [`${value}%`, "Win Rate"]}
                                />
                                <Bar dataKey="winRate" maxBarSize={32}>
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* P&L Chart */}
                <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">P&L Cumulativo (%)</p>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "6px",
                                    }}
                                    formatter={(value: number) => [`${value}%`, "P&L"]}
                                />
                                <Bar dataKey="pnl" maxBarSize={32}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary table */}
            <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {chartData.map((d, i) => (
                        <div key={d.name} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-xs font-medium truncate">{d.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <span className="text-muted-foreground">Trades:</span>
                                <span className="font-mono text-right">{d.trades}</span>
                                <span className="text-muted-foreground">Win Rate:</span>
                                <span className={`font-mono text-right ${d.winRate >= 50 ? "text-emerald-500" : "text-red-500"}`}>{d.winRate}%</span>
                                <span className="text-muted-foreground">RR medio:</span>
                                <span className="font-mono text-right text-blue-500">{d.avgRR}</span>
                                <span className="text-muted-foreground">P&L:</span>
                                <span className={`font-mono text-right ${d.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{d.pnl}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
