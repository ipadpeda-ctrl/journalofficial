import { describe, it, expect } from 'vitest';
import {
    isWinningTrade,
    isLosingTrade,
    isNeutralTrade,
    getStatisticalTrades,
    calculateTradePnlPercent,
    calculateTradePnlEur,
    calculateWinRate,
    calculateProfitFactor,
    calculateTotalEquity,
    calculateAvgWinPercent,
    calculateAvgLossPercent,
    calculateExpectancy,
    calculateDateRange,
    getTradeDayOfWeek,
    parseTradeDateSafe,
    calculateEquityCurve,
} from '../lib/tradeStatsUtils';
import type { Trade } from '../components/TradesTable';

// --- Test Data Factory ---
function makeTrade(overrides: Partial<Trade> = {}): Trade {
    return {
        id: '1',
        date: '2026-03-01',
        time: '10:00',
        pair: 'EURUSD',
        direction: 'long',
        target: 2,
        stopLoss: 1,
        result: 'target',
        emotion: 'Neutrale',
        confluencesPro: [],
        confluencesContro: [],
        alignedTimeframes: [],
        barrier: [],
        imageUrls: [],
        notes: '',
        ...overrides,
    };
}

const targetTrade = makeTrade({ id: '1', result: 'target', target: 2, stopLoss: 1 });
const stopLossTrade = makeTrade({ id: '2', result: 'stop_loss', target: 2, stopLoss: 1 });
const parzialeTrade = makeTrade({ id: '3', result: 'parziale', target: 2, stopLoss: 1 });
const breakevenTrade = makeTrade({ id: '4', result: 'breakeven', target: 2, stopLoss: 1 });
const nonFillatoTrade = makeTrade({ id: '5', result: 'non_fillato', target: 2, stopLoss: 1 });

// --- Classification Tests ---
describe('Trade Classification', () => {
    it('isWinningTrade: target and parziale are wins', () => {
        expect(isWinningTrade(targetTrade)).toBe(true);
        expect(isWinningTrade(parzialeTrade)).toBe(true);
        expect(isWinningTrade(stopLossTrade)).toBe(false);
        expect(isWinningTrade(breakevenTrade)).toBe(false);
        expect(isWinningTrade(nonFillatoTrade)).toBe(false);
    });

    it('isLosingTrade: only stop_loss', () => {
        expect(isLosingTrade(stopLossTrade)).toBe(true);
        expect(isLosingTrade(targetTrade)).toBe(false);
        expect(isLosingTrade(breakevenTrade)).toBe(false);
    });

    it('isNeutralTrade: breakeven and non_fillato', () => {
        expect(isNeutralTrade(breakevenTrade)).toBe(true);
        expect(isNeutralTrade(nonFillatoTrade)).toBe(true);
        expect(isNeutralTrade(targetTrade)).toBe(false);
    });
});

// --- Filtering ---
describe('getStatisticalTrades', () => {
    it('filters out non_fillato trades', () => {
        const trades = [targetTrade, stopLossTrade, nonFillatoTrade, breakevenTrade];
        const stat = getStatisticalTrades(trades);
        expect(stat).toHaveLength(3);
        expect(stat.find(t => t.result === 'non_fillato')).toBeUndefined();
    });

    it('keeps breakeven trades', () => {
        const result = getStatisticalTrades([breakevenTrade]);
        expect(result).toHaveLength(1);
    });
});

// --- P&L Calculations ---
describe('calculateTradePnlPercent', () => {
    it('target: returns +target%', () => {
        expect(calculateTradePnlPercent(targetTrade)).toBe(2);
    });

    it('parziale: returns +target * 0.5%', () => {
        expect(calculateTradePnlPercent(parzialeTrade)).toBe(1);
    });

    it('stop_loss: returns -stopLoss%', () => {
        expect(calculateTradePnlPercent(stopLossTrade)).toBe(-1);
    });

    it('breakeven: returns 0', () => {
        expect(calculateTradePnlPercent(breakevenTrade)).toBe(0);
    });

    it('non_fillato: returns 0', () => {
        expect(calculateTradePnlPercent(nonFillatoTrade)).toBe(0);
    });
});

describe('calculateTradePnlEur', () => {
    it('converts percentage to EUR based on initialCapital', () => {
        // target: 2% of 10000 = 200 EUR
        expect(calculateTradePnlEur(targetTrade, 10000)).toBe(200);
        // stop_loss: -1% of 10000 = -100 EUR
        expect(calculateTradePnlEur(stopLossTrade, 10000)).toBe(-100);
        // parziale: 1% of 10000 = 100 EUR
        expect(calculateTradePnlEur(parzialeTrade, 10000)).toBe(100);
    });

    it('works with different initial capitals', () => {
        expect(calculateTradePnlEur(targetTrade, 50000)).toBe(1000);
    });
});

// --- Aggregate Statistics ---
describe('calculateWinRate', () => {
    it('returns correct win rate excluding non_fillato', () => {
        // 2 wins (target + parziale) out of 4 stat trades (target, stop, parziale, breakeven)
        const trades = [targetTrade, stopLossTrade, parzialeTrade, breakevenTrade, nonFillatoTrade];
        const winRate = calculateWinRate(trades);
        expect(winRate).toBeCloseTo(50, 1); // 2/4 = 50%
    });

    it('returns 0 for empty trades', () => {
        expect(calculateWinRate([])).toBe(0);
    });
});

describe('calculateProfitFactor', () => {
    it('computes gross wins / gross losses', () => {
        // Wins: target(+2%) + parziale(+1%) = 3%
        // Losses: stop_loss(1%) = 1%
        // PF = 3 / 1 = 3
        const trades = [targetTrade, stopLossTrade, parzialeTrade];
        expect(calculateProfitFactor(trades)).toBe(3);
    });

    it('returns Infinity if no losses', () => {
        expect(calculateProfitFactor([targetTrade])).toBe(Infinity);
    });

    it('returns 0 if no trades', () => {
        expect(calculateProfitFactor([])).toBe(0);
    });
});

describe('calculateTotalEquity', () => {
    it('accumulates P&L from all trades', () => {
        // +200 (target 2%) - 100 (stop 1%) + 100 (parziale 1%) = +200
        const trades = [targetTrade, stopLossTrade, parzialeTrade];
        expect(calculateTotalEquity(trades, 10000)).toBe(10200);
    });
});

// --- Average Metrics ---
describe('calculateAvgWinPercent', () => {
    it('returns average of winning trade P&L%', () => {
        // target: +2%, parziale: +1%, avg = 1.5%
        const trades = [targetTrade, parzialeTrade, stopLossTrade];
        expect(calculateAvgWinPercent(trades)).toBe(1.5);
    });

    it('returns 0 if no wins', () => {
        expect(calculateAvgWinPercent([stopLossTrade])).toBe(0);
    });
});

describe('calculateAvgLossPercent', () => {
    it('returns positive average of losing trade P&L%', () => {
        // stop_loss: -1%, avg = 1%
        const trades = [targetTrade, stopLossTrade];
        expect(calculateAvgLossPercent(trades)).toBe(1);
    });

    it('returns 0 if no losses', () => {
        expect(calculateAvgLossPercent([targetTrade])).toBe(0);
    });
});

// --- Date Utilities ---
describe('calculateDateRange', () => {
    it('calculates weeks and months from trade dates', () => {
        const trades = [
            makeTrade({ date: '2026-01-01' }),
            makeTrade({ date: '2026-01-15' }),
            makeTrade({ date: '2026-02-01' }),
        ];
        const range = calculateDateRange(trades);
        expect(range.days).toBeGreaterThanOrEqual(32);
        expect(range.weeks).toBeGreaterThanOrEqual(4);
        expect(range.months).toBeGreaterThanOrEqual(1);
    });

    it('returns minimum 1 for single trade', () => {
        const range = calculateDateRange([makeTrade({ date: '2026-03-01' })]);
        expect(range.days).toBe(1);
        expect(range.weeks).toBe(1);
        expect(range.months).toBe(1);
    });

    it('returns 0s for empty array', () => {
        const range = calculateDateRange([]);
        expect(range.days).toBe(0);
        expect(range.weeks).toBe(0);
    });
});

describe('getTradeDayOfWeek', () => {
    it('returns correct day for known date (2026-03-04 is Wednesday)', () => {
        const trade = makeTrade({ date: '2026-03-04' });
        expect(getTradeDayOfWeek(trade)).toBe(3); // Wed = 3
    });

    it('handles invalid date gracefully', () => {
        const trade = makeTrade({ date: 'not-a-date' });
        expect(getTradeDayOfWeek(trade)).toBe(-1);
    });
});

describe('parseTradeDateSafe', () => {
    it('returns valid timestamp for proper date', () => {
        const trade = makeTrade({ date: '2026-03-01', time: '10:30' });
        const ts = parseTradeDateSafe(trade);
        expect(ts).toBeGreaterThan(0);
    });

    it('returns 0 for invalid date', () => {
        const trade = makeTrade({ date: 'invalid' });
        expect(parseTradeDateSafe(trade)).toBe(0);
    });
});

// --- Equity Curve ---
describe('calculateEquityCurve', () => {
    it('starts with initialCapital and accumulates P&L', () => {
        const trades = [targetTrade, stopLossTrade];
        const curve = calculateEquityCurve(trades, 10000);
        expect(curve[0]).toEqual({ date: 'Start', equity: 10000 });
        expect(curve).toHaveLength(3);
        // Final: 10000 + 200 - 100 = 10100
        expect(curve[curve.length - 1].equity).toBe(10100);
    });
});
