import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Trade } from "./TradesTable";
import { calculateTradePnlPercent } from "@/lib/tradeStatsUtils";

interface CalendarProps {
  trades: Trade[];
  onDayClick?: (date: string) => void;
  onTradeClick?: (trade: Trade) => void;
}

const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export default function Calendar({ trades, onDayClick, onTradeClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekends, setShowWeekends] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTradesForDay = (day: number): Trade[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return trades.filter((t) => t.date === dateStr);
  };

  const getTradeColor = (trade: Trade): string => {
    switch (trade.result) {
      case "target": return "bg-emerald-500/80 text-white";
      case "stop_loss": return "bg-red-500/80 text-white";
      case "breakeven": return "bg-yellow-500/80 text-black";
      case "parziale": return "bg-blue-500/80 text-white";
      case "non_fillato": return "bg-gray-500/80 text-white";
      default: return "bg-gray-500/80 text-white";
    }
  };

  const getTradeLabel = (trade: Trade): string => {
    if (trade.result === "non_fillato") return `(N/F) ${trade.pair}`;
    const pnl = calculateTradePnlPercent(trade);
    const pnlStr = pnl > 0 ? `+${pnl.toFixed(1)}%` : pnl < 0 ? `${pnl.toFixed(1)}%` : "0%";
    return `(${pnlStr}) ${trade.pair}`;
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  while (weeks[weeks.length - 1]?.length < 7) {
    weeks[weeks.length - 1].push(null);
  }

  const activeDays = showWeekends ? DAYS : DAYS.slice(0, 5);
  const gridColsClass = showWeekends ? "grid-cols-7" : "grid-cols-5";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant={showWeekends ? "default" : "outline"}
          size="sm"
          onClick={() => setShowWeekends(!showWeekends)}
          data-testid="button-toggle-weekend"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Weekend
        </Button>

        <div className="flex items-center gap-4">
          <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="button-prev-month">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold min-w-48 text-center">
            {MONTHS[month]} {year}
          </span>
          <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="button-next-month">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Button variant="default" size="sm" onClick={goToToday} data-testid="button-today">
          Oggi
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className={`grid ${gridColsClass} bg-muted`}>
          {activeDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={`grid ${gridColsClass}`}>
            {week.slice(0, showWeekends ? 7 : 5).map((day, dayIndex) => {
              const dayTrades = day ? getTradesForDay(day) : [];
              const isToday = day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={dayIndex}
                  className={`min-h-24 p-1 border-b border-r last:border-r-0 transition-colors ${day ? "hover-elevate hover:bg-muted/50 cursor-pointer" : "bg-muted/30"
                    } ${isToday ? "bg-chart-1/10" : ""}`}
                  onClick={() => day && onDayClick?.(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                  data-testid={day ? `calendar-day-${day}` : undefined}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-chart-1" : ""}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayTrades.slice(0, 3).map((trade) => (
                          <div
                            key={trade.id}
                            className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:brightness-110 ${getTradeColor(trade)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTradeClick?.(trade);
                            }}
                          >
                            {getTradeLabel(trade)}
                          </div>
                        ))}
                        {dayTrades.length > 3 && (
                          <div className="text-[10px] text-muted-foreground font-medium text-center bg-muted/20 py-0.5 rounded-sm">
                            +{dayTrades.length - 3} altri
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
