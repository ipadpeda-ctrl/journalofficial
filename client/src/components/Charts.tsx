import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  Brush,
} from "recharts";
import { RotateCcw } from "lucide-react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-sm font-medium mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </Card>
  );
}

interface TradeDistributionData {
  target: number;
  stopLoss: number;
  breakeven: number;
}

export function TradeDistributionChart({ data }: { data: TradeDistributionData }) {
  const chartData = [
    { name: "Target", value: data.target, fill: "hsl(142, 71%, 45%)" },
    { name: "Stop Loss", value: data.stopLoss, fill: "hsl(0, 84%, 60%)" },
    { name: "Breakeven", value: data.breakeven, fill: "hsl(45, 93%, 47%)" },
  ];

  return (
    <ChartCard title="Distribuzione Trade">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} dy={10} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} dx={-10} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface DirectionData {
  long: number;
  short: number;
}

export function DirectionChart({ data }: { data: DirectionData }) {
  const chartData = [
    { name: "Long", value: data.long, fill: "hsl(142, 71%, 45%)" },
    { name: "Short", value: data.short, fill: "hsl(0, 84%, 60%)" },
  ];
  const total = data.long + data.short;

  return (
    <ChartCard title="Distribuzione Direzione (Long vs Short)">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface WinRateData {
  wins: number;
  losses: number;
}

export function WinRateChart({ data }: { data: WinRateData }) {
  const total = data.wins + data.losses;
  const winRate = total > 0 ? ((data.wins / total) * 100).toFixed(1) : "0";
  const chartData = [
    { name: "Win", value: data.wins, fill: "hsl(142, 71%, 45%)" },
    { name: "Loss", value: data.losses, fill: "hsl(0, 84%, 60%)" },
  ];

  return (
    <ChartCard title="Win Rate">
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold font-mono">{winRate}%</span>
        </div>
      </div>
    </ChartCard>
  );
}

interface EquityPoint {
  date: string;
  equity: number;
}

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  const [brushRange, setBrushRange] = useState<{ start: number; end: number } | null>(null);

  const isZoomed = brushRange !== null &&
    (brushRange.start > 0 || brushRange.end < data.length - 1);

  const displayData = brushRange
    ? data.slice(brushRange.start, brushRange.end + 1)
    : data;

  const handleBrushChange = (brushData: { startIndex?: number; endIndex?: number } | null) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushRange({ start: brushData.startIndex, end: brushData.endIndex });
    }
  };

  const handleResetZoom = () => {
    setBrushRange(null);
  };

  return (
    <Card className="p-4 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-medium">Equity Curve</h3>

        <div className="flex flex-wrap items-center gap-2">
          {isZoomed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              data-testid="button-reset-zoom"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Zoom
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">
        Usa la barra di scorrimento in basso per zoomare
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              dy={10}
              axisLine={false}
              tickLine={false}
              allowDataOverflow
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              dx={-10}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              allowDataOverflow
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
              formatter={(value: number) => [`${value.toFixed(2)}`, "Equity"]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorEquity)"
              strokeWidth={2}
            />
            <Brush
              dataKey="date"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
              startIndex={brushRange?.start}
              endIndex={brushRange?.end}
              onChange={handleBrushChange}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface EmotionData {
  emotion: string;
  count: number;
}

export function EmotionalFrequencyChart({ data }: { data: EmotionData[] }) {
  return (
    <ChartCard title="Frequenza Emotiva" className="lg:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
          <XAxis dataKey="emotion" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-45} textAnchor="end" height={60} dy={10} axisLine={false} tickLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} dx={-10} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
          />
          <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
