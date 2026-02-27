import { Card } from "@/components/ui/card";
import { Trade } from "./TradesTable";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    CartesianGrid,
} from "recharts";

interface RRDistributionChartProps {
    trades: Trade[];
}

export default function RRDistributionChart({ trades }: RRDistributionChartProps) {
    // Only use trades that have an RR value, or estimate it based on target/stop_loss if not available
    const rrValues = trades.map(t => {
        if (t.rr != null && t.rr !== 0) {
            // If the trade was a loss, the RR realized is typically -1
            if (t.result === "stop_loss") return -1;
            // If parziale, realized is half
            if (t.result === "parziale") return t.rr * 0.5;
            // Breakeven is 0
            if (t.result === "breakeven") return 0;
            return t.rr;
        }

        // Estimate if t.rr is not set but target/stop is
        if (t.stopLoss > 0 && t.target > 0) {
            const potentialRR = t.target / t.stopLoss;
            if (t.result === "stop_loss") return -1;
            if (t.result === "parziale") return potentialRR * 0.5;
            if (t.result === "breakeven") return 0;
            if (t.result === "target") return potentialRR;
        }

        return null;
    }).filter(v => v !== null) as number[];

    if (rrValues.length === 0) {
        return (
            <Card className="p-4" data-testid="rr-distribution">
                <h3 className="text-sm font-medium mb-4">Distribuzione R/R</h3>
                <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">
                        Dati R/R insufficienti o non inseriti nei trade.
                    </p>
                </div>
            </Card>
        );
    }

    // Create buckets for distribution
    const buckets = [
        { range: "< -1", min: -Infinity, max: -1.01, count: 0 },
        { range: "-1", min: -1.01, max: -0.99, count: 0 }, // Specific bucket for full stop loss
        { range: "-1 a 0", min: -0.99, max: -0.01, count: 0 },
        { range: "0", min: -0.01, max: 0.01, count: 0 }, // Breakeven
        { range: "0 a 1", min: 0.01, max: 0.99, count: 0 },
        { range: "1 a 2", min: 0.99, max: 1.99, count: 0 },
        { range: "2 a 3", min: 1.99, max: 2.99, count: 0 },
        { range: "3 a 4", min: 2.99, max: 3.99, count: 0 },
        { range: "> 4", min: 3.99, max: Infinity, count: 0 },
    ];

    rrValues.forEach(rr => {
        const bucket = buckets.find(b => rr > b.min && rr <= b.max);
        if (bucket) {
            bucket.count++;
        }
    });

    // Filter out empty buckets at the extremes to avoid clutter, but keep core ones
    const chartData = buckets.filter(b => b.count > 0 || (b.min >= -1.01 && b.min <= 2.99));

    return (
        <Card className="p-4" data-testid="rr-distribution">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Distribuzione R/R</h3>
                <p className="text-xs text-muted-foreground">{rrValues.length} trade calcolati</p>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRRPos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="colorRRNeg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="colorRRZero" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
                        <XAxis
                            dataKey="range"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            dy={10}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            allowDecimals={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            itemStyle={{ color: "hsl(var(--foreground))" }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                            formatter={(value: number) => [value, "Trade"]}
                            labelFormatter={(label) => `Range R/R: ${label}`}
                            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                        />
                        <ReferenceLine x="0" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                        >
                            {chartData.map((entry, index) => {
                                // Color mapping: Red for < 0, Yellow for 0, Green for > 0
                                let fill = "url(#colorRRZero)";
                                if (entry.max <= -0.01) fill = "url(#colorRRNeg)"; // Loss (Red)
                                else if (entry.min >= 0.01) fill = "url(#colorRRPos)"; // Profit (Green)

                                return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
                Mostra la frequenza dei ritorni R-Multiple realizzati.
            </p>
        </Card>
    );
}
