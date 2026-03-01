import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Pencil, Trash2, Search, Filter } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";

export type TradeResult = "target" | "stop_loss" | "breakeven" | "parziale" | "non_fillato";

export interface Trade {
  id: string;
  date: string;
  time: string;
  pair: string;
  direction: "long" | "short";
  target: number;
  stopLoss: number;
  slPips?: number;
  tpPips?: number;
  rr?: number;
  result: TradeResult;
  pnl?: number;
  emotion: string;
  confluencesPro: string[];
  confluencesContro: string[];
  alignedTimeframes: string[];
  barrier: string[];
  imageUrls: string[];
  notes: string;
}

interface TradesTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (trade: Trade) => void;
}

export default function TradesTable({ trades, onEdit, onDelete, onRowClick }: TradesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.emotion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getResultBadge = (result: Trade["result"]) => {
    switch (result) {
      case "target":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Target</Badge>;
      case "stop_loss":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Stop Loss</Badge>;
      case "breakeven":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Breakeven</Badge>;
      case "parziale":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Parziale</Badge>;
      case "non_fillato":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Non Fillato</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per coppia o emozione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Data</TableHead>
              <TableHead className="w-16">Ora</TableHead>
              <TableHead className="w-24">Coppia</TableHead>
              <TableHead className="w-20">Dir.</TableHead>
              <TableHead className="w-20 text-right">Target</TableHead>
              <TableHead className="w-20 text-right">Stop</TableHead>
              <TableHead className="w-16 text-right">RR</TableHead>
              <TableHead className="w-24">Risultato</TableHead>
              <TableHead className="w-24">Emozione</TableHead>
              <TableHead className="w-20">TF/Bar.</TableHead>
              <TableHead className="min-w-40">Confluenze</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  Nessuna operazione trovata
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  data-testid={`row-trade-${trade.id}`}
                  className="cursor-pointer hover-elevate"
                  onClick={() => onRowClick?.(trade)}
                >
                  <TableCell className="font-mono text-sm">{trade.date}</TableCell>
                  <TableCell className="font-mono text-sm">{trade.time}</TableCell>
                  <TableCell className="font-medium">{trade.pair || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 ${trade.direction === "long" ? "text-emerald-500" : "text-red-500"
                        }`}
                    >
                      {trade.direction === "long" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      {trade.direction === "long" ? "Long" : "Short"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{trade.target.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{trade.stopLoss.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-blue-400">
                    {trade.rr ? trade.rr.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell>{getResultBadge(trade.result)}</TableCell>
                  <TableCell className="text-sm">{trade.emotion}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                      <span>{trade.alignedTimeframes.length > 0 ? trade.alignedTimeframes.join(", ") : "-"}</span>
                      <span className="text-blue-500">{trade.barrier.length > 0 ? trade.barrier.join(", ") : "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-emerald-500">+{trade.confluencesPro.length}</span>
                      <span className="text-xs text-red-500">-{trade.confluencesContro.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit?.(trade)}
                        data-testid={`button-edit-trade-${trade.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Sei sicuro di voler eliminare questo trade?")) {
                            onDelete?.(trade.id);
                          }
                        }}
                        data-testid={`button-delete-trade-${trade.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="flex flex-col gap-4 md:hidden mt-4">
        {filteredTrades.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border rounded-lg">
            Nessuna operazione trovata
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <Card
              key={trade.id}
              className="p-4 flex flex-col gap-3 cursor-pointer hover-elevate transition-shadow"
              onClick={() => onRowClick?.(trade)}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{trade.pair || "-"}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trade.direction === "long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}
                  >
                    {trade.direction === "long" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {trade.direction === "long" ? "Long" : "Short"}
                  </span>
                </div>
                {getResultBadge(trade.result)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Data e Ora</span>
                  <span className="font-mono">{trade.date} {trade.time}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-xs">Rischio/Rendimento</span>
                  <span className="font-mono text-blue-400 font-medium">{trade.rr ? trade.rr.toFixed(2) : "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Target</span>
                  <span className="font-mono text-emerald-500">{trade.target.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-xs">Stop Loss</span>
                  <span className="font-mono text-red-500">{trade.stopLoss.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t mt-1">
                <div className="flex gap-2 text-xs">
                  <span className="bg-muted px-2 py-1 rounded-md">{trade.emotion || "Neutrale"}</span>
                  <span className="bg-muted px-2 py-1 rounded-md flex gap-1">
                    <span className="text-emerald-500">+{trade.confluencesPro.length}</span>
                    <span className="text-red-500">-{trade.confluencesContro.length}</span>
                  </span>
                  <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md cursor-help" title={`TF: ${trade.alignedTimeframes.join(", ")} | Barrier: ${trade.barrier.join(", ")}`}>
                    TF/B
                  </span>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onEdit?.(trade)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Sei sicuro di voler eliminare questo trade?")) {
                        onDelete?.(trade.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}