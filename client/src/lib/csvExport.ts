import type { Trade } from "@/components/TradesTable";
import { calculateTradePnlPercent } from "@/lib/tradeStatsUtils";

/**
 * Escape a value for safe CSV output:
 * - Wrap in double quotes
 * - Escape internal double quotes by doubling them
 * - Prefix formula-trigger characters (=, +, -, @) with a tab to prevent CSV injection
 */
function escapeCsvValue(value: string): string {
    // Prevent CSV injection: prefix formula triggers with a tab character
    let safe = value;
    if (/^[=+\-@]/.test(safe)) {
        safe = "\t" + safe;
    }
    // Escape double quotes by doubling them
    safe = safe.replace(/"/g, '""');
    return `"${safe}"`;
}

export function exportTradesToCSV(trades: Trade[]) {
    const headers = [
        "Data", "Ora", "Coppia", "Direzione", "Target", "Stop Loss",
        "Risultato", "P&L", "Emozione", "Confluenze Pro", "Confluenze Contro",
        "TF Allineati", "Barrier", "Note"
    ];

    const rows = trades.map(t => [
        t.date,
        t.time,
        t.pair,
        t.direction === "long" ? "Long" : "Short",
        (t.target || 0).toFixed(5),
        (t.stopLoss || 0).toFixed(5),
        t.result,
        (t.pnl || calculateTradePnlPercent(t)).toFixed(2),
        t.emotion,
        (t.confluencesPro || []).join("; "),
        (t.confluencesContro || []).join("; "),
        (t.alignedTimeframes || []).join("; "),
        (t.barrier || []).join("; "),
        t.notes || "",
    ]);

    const csvContent = [
        headers.map(h => escapeCsvValue(h)).join(","),
        ...rows.map(row => row.map(cell => escapeCsvValue(String(cell))).join(","))
    ].join("\n");

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
