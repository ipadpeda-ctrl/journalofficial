import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Header, { Tab } from "@/components/Header";
import StatCard from "@/components/StatCard";
import TradeForm, { TradeFormData } from "@/components/TradeForm";
import TradesTable, { Trade } from "@/components/TradesTable";
import TradeDetailModal from "@/components/TradeDetailModal";
import { EquityCurveChart } from "@/components/Charts";
import Settings from "@/components/Settings";
import Calendar from "@/components/Calendar";
import WeeklyRecap from "@/components/WeeklyRecap";
import ResultBreakdownCard from "@/components/ResultBreakdownCard";
import MoodTracker from "@/components/MoodTracker";
import StatisticsView from "@/components/views/StatisticsView";
import MonthlyComparison from "@/components/MonthlyComparison";
import TradingDiary from "@/components/TradingDiary";
import MonthlyGoals from "@/components/MonthlyGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade as SchemaTrade } from "@shared/schema";
import TradeFilterBar, { TradeFilters, defaultFilters } from "@/components/TradeFilterBar";

const defaultPairs = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const defaultEmotions = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const defaultConfluencesPro = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const defaultConfluencesContro = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];
const defaultBarrierOptions = ["m15", "m10", "m5", "m1"];
const FIXED_ALIGNED_TIMEFRAMES = ["Mensile", "Settimanale", "Daily", "H4", "H1", "M30"];

// --- Helpers e Mappers ---
function mapSchemaTradeToTrade(t: SchemaTrade): Trade {
  return {
    id: t.id.toString(),
    date: t.date,
    time: t.time || "",
    pair: t.pair,
    direction: t.direction as "long" | "short",
    target: t.target || 0,
    stopLoss: t.stopLoss || 0,
    slPips: t.slPips || undefined,
    tpPips: t.tpPips || undefined,
    rr: t.rr || undefined,
    result: t.result as Trade["result"],
    pnl: t.pnl || 0,
    emotion: t.emotion || "",
    confluencesPro: t.confluencesPro || [],
    confluencesContro: t.confluencesContro || [],
    alignedTimeframes: t.alignedTimeframes || [],
    barrier: t.barrier || [],
    imageUrls: t.imageUrls || [],
    notes: t.notes || "",
  };
}

function exportTradesToCSV(trades: Trade[]) {
  const headers = ["Data", "Ora", "Coppia", "Direzione", "Target", "Stop Loss", "Risultato", "P&L", "Emozione", "Confluenze Pro", "Confluenze Contro", "TF Allineati", "Barrier", "Note"];
  const rows = trades.map(t => [
    t.date, t.time, t.pair, t.direction === "long" ? "Long" : "Short",
    t.target.toFixed(5), t.stopLoss.toFixed(5), t.result, (t.pnl || 0).toFixed(2),
    t.emotion, t.confluencesPro.join("; "), t.confluencesContro.join("; "), t.alignedTimeframes.join("; "), t.barrier.join("; "), t.notes.replace(/"/g, '""'),
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

export default function Dashboard() {
  const { user } = useAuth();
  const initialCapital = user?.initialCapital ?? 10000;
  const [location, setLocation] = useLocation();

  // --- LOGICA DI NAVIGAZIONE PULITA ---
  const getTabFromPath = (path: string): Tab => {
    if (path === "/operations") return "operations";
    if (path === "/calendar") return "calendario";
    if (path === "/stats") return "statistiche";
    if (path === "/diary") return "diary";
    if (path === "/goals") return "goals";
    if (path === "/settings") return "settings";
    return "new-entry";
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPath(location));

  useEffect(() => {
    setActiveTab(getTabFromPath(location));
  }, [location]);

  const handleTabChange = (tab: Tab) => {
    switch (tab) {
      case "admin": setLocation("/admin"); break; // <-- PUNTO CRUCIALE: Se admin, vai su /admin
      case "operations": setLocation("/operations"); break;
      case "calendario": setLocation("/calendar"); break;
      case "statistiche": setLocation("/stats"); break;
      case "diary": setLocation("/diary"); break;
      case "goals": setLocation("/goals"); break;
      case "settings": setLocation("/settings"); break;
      default: setLocation("/"); break;
    }
  };
  // ------------------------------------

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const [filters, setFilters] = useState<TradeFilters>(defaultFilters);

  const { data: schemaTrades = [], isLoading } = useQuery<SchemaTrade[]>({
    queryKey: ["/api/trades"],
  });

  const trades: Trade[] = schemaTrades.map(mapSchemaTradeToTrade);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Data
      if (filters.startDate && trade.date < filters.startDate) return false;
      if (filters.endDate && trade.date > filters.endDate) return false;

      // Ora
      if (filters.startTime && trade.time < filters.startTime) return false;
      if (filters.endTime && trade.time > filters.endTime) return false;

      // Giorno della settimana
      if (filters.daysOfWeek.length > 0) {
        const tradeDay = new Date(trade.date).getDay();
        if (!filters.daysOfWeek.includes(tradeDay)) return false;
      }

      // Coppia
      if (filters.pairs.length > 0 && !filters.pairs.includes(trade.pair)) return false;

      // Direzione
      if (filters.directions.length > 0 && !filters.directions.includes(trade.direction)) return false;

      // Risultato
      if (filters.results.length > 0 && !filters.results.includes(trade.result)) return false;

      // Confluenze (Deve contenere ALMENO UNA delle confluenze selezionate se il filtro non è vuoto)
      if (filters.confluencesPro.length > 0) {
        const hasMatch = filters.confluencesPro.some(c => trade.confluencesPro.includes(c));
        if (!hasMatch) return false;
      }
      if (filters.confluencesContro.length > 0) {
        const hasMatch = filters.confluencesContro.some(c => trade.confluencesContro.includes(c));
        if (!hasMatch) return false;
      }

      // TF Allineati (Deve contenerli TUTTI quelli selezionati per essere davvero allineato)
      if (filters.alignedTimeframes.length > 0) {
        const hasAll = filters.alignedTimeframes.every(tf => trade.alignedTimeframes.includes(tf));
        if (!hasAll) return false;
      }

      // Barrier (Basta UNA delle barriere selezionate? Diciamo di sì, stile "ANY")
      if (filters.barriers.length > 0) {
        const hasMatch = filters.barriers.some(b => trade.barrier.includes(b));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [trades, filters]);

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => apiRequest("POST", "/api/trades", { ...data, target: parseFloat(data.target), stopLoss: parseFloat(data.stopLoss), slPips: data.slPips ? parseFloat(data.slPips) : null, tpPips: data.tpPips ? parseFloat(data.tpPips) : null, rr: data.rr ? parseFloat(data.rr) : null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TradeFormData }) => apiRequest("PATCH", `/api/trades/${id}`, { ...data, target: parseFloat(data.target), stopLoss: parseFloat(data.stopLoss), slPips: data.slPips ? parseFloat(data.slPips) : null, tpPips: data.tpPips ? parseFloat(data.tpPips) : null, rr: data.rr ? parseFloat(data.rr) : null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/trades/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/trades"] }),
  });



  const handleSubmitTrade = (formData: TradeFormData) => {
    if (editingTrade) {
      updateTradeMutation.mutate({ id: editingTrade.id, data: formData }, { onSuccess: () => { setEditingTrade(null); handleTabChange("operations"); } });
    } else {
      createTradeMutation.mutate(formData, { onSuccess: () => handleTabChange("operations") });
    }
  };

  const handleEditTrade = (trade: Trade) => { setEditingTrade(trade); setIsDetailModalOpen(false); handleTabChange("new-entry"); };
  const handleCancelEdit = () => setEditingTrade(null);
  const handleRowClick = (trade: Trade) => { setSelectedTrade(trade); setIsDetailModalOpen(true); };
  const handleDeleteTrade = (id: string) => { deleteTradeMutation.mutate(id); if (editingTrade?.id === id) setEditingTrade(null); };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-xl mt-4" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Mostriamo la TradeFilterBar su tutte le tab tranne New Entry, Settings, Diary, Goals */}
        {(activeTab === "statistiche" || activeTab === "calendario" || activeTab === "operations") && (
          <TradeFilterBar
            filters={filters}
            onFilterChange={setFilters}
            availablePairs={user?.pairs?.length ? user.pairs : defaultPairs}
            availableConfluencesPro={user?.confluencesPro?.length ? user.confluencesPro : defaultConfluencesPro}
            availableConfluencesContro={user?.confluencesContro?.length ? user.confluencesContro : defaultConfluencesContro}
            availableAlignedTimeframes={FIXED_ALIGNED_TIMEFRAMES}
            availableBarriers={user?.barrierOptions?.length ? user.barrierOptions : defaultBarrierOptions}
            tradesCount={filteredTrades.length}
          />
        )}

        {activeTab === "statistiche" && (
          <StatisticsView trades={filteredTrades} initialCapital={initialCapital} />
        )}

        {activeTab === "calendario" && (
          <div className="flex gap-6 flex-col md:flex-row">
            <div className="flex-1"><Calendar trades={filteredTrades} /></div>
            <div className="w-full md:w-80 flex-shrink-0"><WeeklyRecap trades={filteredTrades} currentDate={selectedDate} /></div>
          </div>
        )}

        {activeTab === "operations" && (
          <>
            <TradesTable trades={filteredTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onRowClick={handleRowClick} />
            <TradeDetailModal trade={selectedTrade} open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />
          </>
        )}

        {activeTab === "new-entry" && (
          <TradeForm onSubmit={handleSubmitTrade} onDuplicate={() => console.log("Duplicate")} editingTrade={editingTrade ? { ...editingTrade, target: editingTrade.target.toString(), stopLoss: editingTrade.stopLoss.toString(), slPips: editingTrade.slPips?.toString() || "", tpPips: editingTrade.tpPips?.toString() || "", rr: editingTrade.rr?.toString() || "", alignedTimeframes: editingTrade.alignedTimeframes || [], barrier: editingTrade.barrier || [] } : undefined} onCancelEdit={handleCancelEdit} />
        )}

        {activeTab === "settings" && <Settings
          pairs={user?.pairs?.length ? user.pairs : defaultPairs}
          emotions={user?.emotions?.length ? user.emotions : defaultEmotions}
          confluencesPro={user?.confluencesPro?.length ? user.confluencesPro : defaultConfluencesPro}
          confluencesContro={user?.confluencesContro?.length ? user.confluencesContro : defaultConfluencesContro}
          barrierOptions={user?.barrierOptions?.length ? user.barrierOptions : defaultBarrierOptions}
          initialCapital={initialCapital}
          onSave={(settings) => console.log("Settings saved:", settings)}
        />}
        {activeTab === "diary" && <TradingDiary />}
        {activeTab === "goals" && <MonthlyGoals trades={trades.map((t) => ({ date: t.date, result: t.result, target: t.target, stopLoss: t.stopLoss }))} />}
      </main>
    </div>
  );
}