import type { Trade, TradeResult } from "@/components/TradesTable";

// ─── Trade Classification ───────────────────────────────────────────

/** A trade è vincente se il risultato è target o parziale */
export function isWinningTrade(trade: Trade): boolean {
    return trade.result === "target" || trade.result === "parziale";
}

/** A trade è perdente se il risultato è stop_loss */
export function isLosingTrade(trade: Trade): boolean {
    return trade.result === "stop_loss";
}

/** A trade è neutro se breakeven o non_fillato (nessun impatto economico) */
export function isNeutralTrade(trade: Trade): boolean {
    return trade.result === "breakeven" || trade.result === "non_fillato";
}

/**
 * Filtra via i trade "non_fillato" che non dovrebbero partecipare ai calcoli statistici.
 * Breakeven rimane perché è un trade eseguito con impatto zero.
 */
export function getStatisticalTrades(trades: Trade[]): Trade[] {
    return trades.filter((t) => t.result !== "non_fillato");
}

// ─── P&L Calculations ──────────────────────────────────────────────

/**
 * Calcola il P&L di un singolo trade in percentuale del conto.
 * - target:     +target%
 * - parziale:   +target * 0.5%
 * - stop_loss:  -stopLoss%
 * - breakeven:  0%
 * - non_fillato: 0%
 */
export function calculateTradePnlPercent(trade: Trade): number {
    switch (trade.result) {
        case "target":
            return trade.target;
        case "parziale":
            return trade.target * 0.5;
        case "stop_loss":
            return -trade.stopLoss;
        case "breakeven":
        case "non_fillato":
        default:
            return 0;
    }
}

/**
 * Calcola il P&L di un singolo trade in EUR.
 * Formula: (percentuale / 100) * initialCapital
 */
export function calculateTradePnlEur(trade: Trade, initialCapital: number): number {
    return (calculateTradePnlPercent(trade) / 100) * initialCapital;
}

// ─── Aggregate Statistics ───────────────────────────────────────────

/**
 * Calcola il Win Rate come percentuale.
 * Conta solo i trade statisticamente rilevanti (esclusi non_fillato).
 */
export function calculateWinRate(trades: Trade[]): number {
    const statTrades = getStatisticalTrades(trades);
    if (statTrades.length === 0) return 0;
    const wins = statTrades.filter(isWinningTrade).length;
    return (wins / statTrades.length) * 100;
}

/**
 * Calcola il Profit Factor: somma dei guadagni / somma delle perdite (in %).
 * Se non ci sono perdite, ritorna Infinity (o 0 se nemmeno guadagni).
 */
export function calculateProfitFactor(trades: Trade[]): number {
    const statTrades = getStatisticalTrades(trades);
    let totalWins = 0;
    let totalLosses = 0;

    for (const t of statTrades) {
        const pnl = calculateTradePnlPercent(t);
        if (pnl > 0) totalWins += pnl;
        else if (pnl < 0) totalLosses += Math.abs(pnl);
    }

    if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
    return totalWins / totalLosses;
}

/**
 * Calcola l'equity totale dopo tutti i trade.
 */
export function calculateTotalEquity(trades: Trade[], initialCapital: number): number {
    let equity = initialCapital;
    for (const trade of trades) {
        equity += calculateTradePnlEur(trade, initialCapital);
    }
    return equity;
}

/**
 * Calcola la curva equity ordinata cronologicamente.
 */
export function calculateEquityCurve(
    trades: Trade[],
    initialCapital: number
): { date: string; equity: number }[] {
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = parseTradeDateSafe(a);
        const dateB = parseTradeDateSafe(b);
        return dateA - dateB;
    });

    let equity = initialCapital;
    const curve = [{ date: "Start", equity }];

    for (const trade of sortedTrades) {
        equity += calculateTradePnlEur(trade, initialCapital);
        curve.push({ date: trade.date.slice(5), equity });
    }

    return curve;
}

// ─── Date Utilities ─────────────────────────────────────────────────

/**
 * Parsa la data di un trade (formato "YYYY-MM-DD") in modo sicuro, evitando
 * problemi di timezone. Ritorna il timestamp numerico.
 */
export function parseTradeDateSafe(trade: Trade): number {
    const [year, month, day] = trade.date.split("-").map(Number);
    const timeStr = trade.time || "00:00";
    const [hours, minutes] = timeStr.split(":").map(Number);

    // Usiamo valori numerici per evitare interpretazione UTC di new Date("YYYY-MM-DD")
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 0; // data invalida → inizio per sorting sicuro
    }

    return new Date(year, month - 1, day, hours || 0, minutes || 0).getTime();
}

/**
 * Ottiene il giorno della settimana (0=Dom, 6=Sab) dalla stringa data "YYYY-MM-DD",
 * senza problemi di timezone.
 */
export function getTradeDayOfWeek(trade: Trade): number {
    const [year, month, day] = trade.date.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return -1;
    return new Date(year, month - 1, day).getDay();
}

/**
 * Calcola il range di date dei trade in settimane e mesi.
 * Utile per calcolare medie realistiche (trade/settimana, trade/mese).
 */
export function calculateDateRange(trades: Trade[]): {
    weeks: number;
    months: number;
    days: number;
} {
    if (trades.length === 0) return { weeks: 0, months: 0, days: 0 };

    const dates = trades
        .map((t) => {
            const [y, m, d] = t.date.split("-").map(Number);
            if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
            return new Date(y, m - 1, d).getTime();
        })
        .filter((d): d is number => d !== null);

    if (dates.length === 0) return { weeks: 0, months: 0, days: 0 };

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffMs = maxDate - minDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return {
        days: Math.max(1, Math.ceil(diffDays) + 1), // +1 per includere il primo giorno
        weeks: Math.max(1, Math.ceil((diffDays + 1) / 7)),
        months: Math.max(1, Math.ceil((diffDays + 1) / 30)),
    };
}

// ─── Advanced Metrics ───────────────────────────────────────────────

/**
 * Media delle vincite in percentuale (solo trade vincenti).
 */
export function calculateAvgWinPercent(trades: Trade[]): number {
    const wins = getStatisticalTrades(trades).filter(isWinningTrade);
    if (wins.length === 0) return 0;
    return wins.reduce((sum, t) => sum + calculateTradePnlPercent(t), 0) / wins.length;
}

/**
 * Media delle perdite in percentuale (solo trade perdenti). Ritorna valore positivo.
 */
export function calculateAvgLossPercent(trades: Trade[]): number {
    const losses = getStatisticalTrades(trades).filter(isLosingTrade);
    if (losses.length === 0) return 0;
    return Math.abs(losses.reduce((sum, t) => sum + calculateTradePnlPercent(t), 0) / losses.length);
}

/**
 * Expectancy in unità R (Risk units).
 * Formula: (winRate * avgWin) - (lossRate * avgLoss)
 * dove avgWin e avgLoss sono in percentuale del conto.
 */
export function calculateExpectancy(trades: Trade[]): number {
    const statTrades = getStatisticalTrades(trades);
    if (statTrades.length === 0) return 0;

    const winRate = calculateWinRate(trades) / 100;
    const avgWin = calculateAvgWinPercent(trades);
    const avgLoss = calculateAvgLossPercent(trades);

    return (winRate * avgWin) - ((1 - winRate) * avgLoss);
}
