import { type Trade } from "@shared/schema";

// ─── Result normalization (mirrors client/src/lib/tradeStatsUtils.ts) ───
// DB stores: "target", "parziale", "stop_loss", "breakeven", "non_fillato"

function isWin(t: Trade): boolean {
  return t.result === "target" || t.result === "parziale";
}

function isLoss(t: Trade): boolean {
  return t.result === "stop_loss";
}

/** Filter out non_fillato trades — they never entered the market */
function getStatisticalTrades(trades: Trade[]): Trade[] {
  return trades.filter(t => t.result !== "non_fillato");
}

export interface AggregatedTradeData {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgRR: number;
  avgPnl: number;
  totalPnl: number;
  confluenceProStats: { name: string; totalTrades: number; wins: number; losses: number; winRate: number; avgPnl: number; avgRR: number }[];
  confluenceCombos: { combo: string; totalTrades: number; wins: number; losses: number; winRate: number }[];
  confluenceControInLosses: { name: string; occurrences: number; totalTradesWithThis: number }[];
  pairStats: { pair: string; totalTrades: number; wins: number; losses: number; winRate: number; avgRR: number; totalPnl: number }[];
  timeStats: { dayOfWeek: string; hourBlock: string; totalTrades: number; wins: number; losses: number; winRate: number }[];
  barrierStats: { rating: string; totalTrades: number; wins: number; losses: number; winRate: number }[] | null;
  emotionStats: { emotion: string; totalTrades: number; wins: number; losses: number; winRate: number }[];
  streakData: { longestWinStreak: number; longestLossStreak: number; avgTradesPerDay: number; performanceAfter2Losses: { wins: number; losses: number; winRate: number; sampleSize: number } };
  holdTimeData: { avgHoldTimeWinnersMinutes: number | null; avgHoldTimeLosersMinutes: number | null };
  last30Trades: { date: string; time: string | null; pair: string; direction: string; confluencesPro: string[] | null; confluencesContro: string[] | null; barrier: string[] | null; result: string; rr: number | null; pnl: number | null; emotion: string | null }[];
  strategyStats: { strategyName: string; totalTrades: number; wins: number; losses: number; winRate: number }[];
}

export function aggregateTradeData(rawTrades: Trade[], strategies?: { id: number; name: string }[]): AggregatedTradeData {
  // Exclude non_fillato — they never entered the market
  const trades = getStatisticalTrades(rawTrades);

  if (!trades.length) {
    throw new Error("No trades to aggregate");
  }

  const resultStats = trades.reduce((acc, t) => {
    if (isWin(t)) acc.wins++;
    else if (isLoss(t)) acc.losses++;
    else acc.breakevens++;
    return acc;
  }, { wins: 0, losses: 0, breakevens: 0 });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (resultStats.wins / (resultStats.wins + resultStats.losses)) * 100 || 0 : 0;

  const validRRTrades = trades.filter(t => t.rr != null);
  const avgRR = validRRTrades.length > 0 ? validRRTrades.reduce((acc, t) => acc + (t.rr || 0), 0) / validRRTrades.length : 0;

  const validPnlTrades = trades.filter(t => t.pnl != null);
  const totalPnl = validPnlTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const avgPnl = validPnlTrades.length > 0 ? totalPnl / validPnlTrades.length : 0;

  // Pro Confluences
  const proConfMap = new Map<string, { total: number, wins: number, losses: number, pnl: number, rr: number }>();
  // Combos
  const comboMap = new Map<string, { total: number, wins: number, losses: number }>();
  // Contro in losses
  const controMap = new Map<string, { total: number, losses: number }>();
  
  // Pairs
  const pairMap = new Map<string, { total: number, wins: number, losses: number, pnl: number, rr: number, rrCount: number }>();
  // Time and Days
  const timeMap = new Map<string, { total: number, wins: number, losses: number }>();
  // Barriers
  const barrierMap = new Map<string, { total: number, wins: number, losses: number }>();
  // Emotions
  const emotionMap = new Map<string, { total: number, wins: number, losses: number }>();
  
  // Strategies
  const strategyMap = new Map<number, { name: string, total: number, wins: number, losses: number }>();
  
  // Streak
  let longestWin = 0;
  let longestLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;
  let lossCount = 0;
  const afterLossesLog = { wins: 0, losses: 0 };
  
  // Hold times
  let winHoldTimes: number[] = [];
  let lossHoldTimes: number[] = [];

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { h, m };
  };
  
  const getHoldMinutes = (timeA: string, timeB: string) => {
    const a = parseTime(timeA);
    const b = parseTime(timeB);
    let diff = (b.h * 60 + b.m) - (a.h * 60 + a.m);
    if (diff < 0) diff += 24 * 60; // Just in case it crosses midnight
    return diff;
  };

  const getDayOfWeek = (dateStr: string) => {
    // Parse manually to avoid UTC midnight timezone offset bugs
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[d.getDay()];
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const da = a.date + (a.time ? ' ' + a.time : '');
    const db = b.date + (b.time ? ' ' + b.time : '');
    return da.localeCompare(db);
  });
  
  const uniqueDays = new Set<string>();

  for (let i = 0; i < sortedTrades.length; i++) {
    const t = sortedTrades[i];
    uniqueDays.add(t.date);
    
    // Streaks & Behavior
    if (lossCount >= 2) {
      if (isWin(t)) afterLossesLog.wins++;
      else if (isLoss(t)) afterLossesLog.losses++;
    }
    
    if (isWin(t)) {
      currentWin++;
      longestWin = Math.max(longestWin, currentWin);
      currentLoss = 0;
      lossCount = 0;
    } else if (isLoss(t)) {
      currentLoss++;
      longestLoss = Math.max(longestLoss, currentLoss);
      currentWin = 0;
      lossCount++;
    } else {
      currentWin = 0;
      currentLoss = 0;
      lossCount = 0;
    }
    
    // Hold time
    if (t.time && t.closeTime) {
      const mins = getHoldMinutes(t.time, t.closeTime);
      if (isWin(t)) winHoldTimes.push(mins);
      else if (isLoss(t)) lossHoldTimes.push(mins);
    }
    
    // Confluences Pro
    if (t.confluencesPro && t.confluencesPro.length > 0) {
      const combo = [...t.confluencesPro].sort().join(" + ");
      if (t.confluencesPro.length > 1) {
        const entry = comboMap.get(combo) || { total: 0, wins: 0, losses: 0 };
        entry.total++;
        if (isWin(t)) entry.wins++;
        if (isLoss(t)) entry.losses++;
        comboMap.set(combo, entry);
      }
      
      for (const conf of t.confluencesPro) {
        const entry = proConfMap.get(conf) || { total: 0, wins: 0, losses: 0, pnl: 0, rr: 0 };
        entry.total++;
        if (isWin(t)) entry.wins++;
        if (isLoss(t)) entry.losses++;
        if (t.pnl) entry.pnl += t.pnl;
        if (t.rr) entry.rr += t.rr;
        proConfMap.set(conf, entry);
      }
    }
    
    // Confluences Contro
    if (t.confluencesContro && t.confluencesContro.length > 0) {
      for (const conf of t.confluencesContro) {
        const entry = controMap.get(conf) || { total: 0, losses: 0 };
        entry.total++;
        if (isLoss(t)) entry.losses++;
        controMap.set(conf, entry);
      }
    }
    
    // Pairs
    const pEntry = pairMap.get(t.pair) || { total: 0, wins: 0, losses: 0, pnl: 0, rr: 0, rrCount: 0 };
    pEntry.total++;
    if (isWin(t)) pEntry.wins++;
    if (isLoss(t)) pEntry.losses++;
    if (t.pnl) pEntry.pnl += t.pnl;
    if (t.rr != null) { pEntry.rr += t.rr; pEntry.rrCount++; }
    pairMap.set(t.pair, pEntry);
    
    // Time & Days
    if (t.date && t.time) {
      const day = getDayOfWeek(t.date);
      const hStr = parseTime(t.time).h.toString().padStart(2, '0');
      const nextH = (parseTime(t.time).h + 1).toString().padStart(2, '0');
      const hourBlock = `${hStr}:00-${nextH}:00`;
      const k = `${day}||${hourBlock}`;
      const te = timeMap.get(k) || { total: 0, wins: 0, losses: 0 };
      te.total++;
      if (isWin(t)) te.wins++;
      if (isLoss(t)) te.losses++;
      timeMap.set(k, te);
    }
    
    // Barrier
    if (t.barrier && t.barrier.length > 0) {
      for (const b of t.barrier) {
        const be = barrierMap.get(b) || { total: 0, wins: 0, losses: 0 };
        be.total++;
        if (isWin(t)) be.wins++;
        if (isLoss(t)) be.losses++;
        barrierMap.set(b, be);
      }
    }
    
    // Emotion
    if (t.emotion) {
      const ee = emotionMap.get(t.emotion) || { total: 0, wins: 0, losses: 0 };
      ee.total++;
      if (isWin(t)) ee.wins++;
      if (isLoss(t)) ee.losses++;
      emotionMap.set(t.emotion, ee);
    }
    
    // Strategy mapping
    if (t.strategyId && strategies) {
      const strat = strategies.find(s => s.id === t.strategyId);
      if (strat) {
        const entry = strategyMap.get(t.strategyId) || { name: strat.name, total: 0, wins: 0, losses: 0 };
        entry.total++;
        if (isWin(t)) entry.wins++;
        if (isLoss(t)) entry.losses++;
        strategyMap.set(t.strategyId, entry);
      }
    }
  }

  const mapToStats = <T extends any>(m: Map<string, T>, namer: (k: string, v: T) => any) => 
    Array.from(m.entries())
      .map(([k, v]) => namer(k, v))
      .sort((a,b) => b.totalTrades - a.totalTrades);

  const avgHoldMin = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

  return {
    totalTrades,
    wins: resultStats.wins,
    losses: resultStats.losses,
    breakevens: resultStats.breakevens,
    winRate,
    avgRR,
    avgPnl,
    totalPnl,
    confluenceProStats: mapToStats(proConfMap, (k, v) => ({
      name: k,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0,
      avgPnl: v.total > 0 ? v.pnl / v.total : 0,
      avgRR: v.total > 0 ? v.rr / v.total : 0
    })),
    confluenceCombos: mapToStats(comboMap, (k, v) => ({
      combo: k,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0,
    })).slice(0, 10),
    confluenceControInLosses: Array.from(controMap.entries())
      .map(([k, v]) => ({
        name: k,
        occurrences: v.losses,
        totalTradesWithThis: v.total
      }))
      .filter(x => x.occurrences > 0)
      .sort((a,b) => b.occurrences - a.occurrences),
    pairStats: mapToStats(pairMap, (k, v) => ({
      pair: k,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0,
      totalPnl: v.pnl,
      avgRR: v.rrCount > 0 ? v.rr / v.rrCount : 0
    })),
    timeStats: Array.from(timeMap.entries()).map(([k, v]) => {
      const [dayOfWeek, hourBlock] = k.split('||');
      return {
        dayOfWeek,
        hourBlock,
        totalTrades: v.total,
        wins: v.wins,
        losses: v.losses,
        winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0
      };
    }),
    barrierStats: barrierMap.size > 0 ? mapToStats(barrierMap, (k, v) => ({
      rating: k,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0
    })) : null,
    emotionStats: mapToStats(emotionMap, (k, v) => ({
      emotion: k,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0
    })),
    streakData: {
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      avgTradesPerDay: uniqueDays.size > 0 ? totalTrades / uniqueDays.size : 0,
      performanceAfter2Losses: {
        wins: afterLossesLog.wins,
        losses: afterLossesLog.losses,
        winRate: (afterLossesLog.wins + afterLossesLog.losses) > 0 ? (afterLossesLog.wins / (afterLossesLog.wins + afterLossesLog.losses)) * 100 : 0,
        sampleSize: afterLossesLog.wins + afterLossesLog.losses
      }
    },
    holdTimeData: {
      avgHoldTimeWinnersMinutes: avgHoldMin(winHoldTimes),
      avgHoldTimeLosersMinutes: avgHoldMin(lossHoldTimes)
    },
    last30Trades: sortedTrades.slice(-30).map(t => ({
      date: t.date,
      time: t.time || null,
      pair: t.pair,
      direction: t.direction,
      confluencesPro: t.confluencesPro || null,
      confluencesContro: t.confluencesContro || null,
      barrier: t.barrier || null,
      result: t.result,
      rr: t.rr || null,
      pnl: t.pnl || null,
      emotion: t.emotion || null
    })),
    strategyStats: Array.from(strategyMap.values()).map(v => ({
      strategyName: v.name,
      totalTrades: v.total,
      wins: v.wins,
      losses: v.losses,
      winRate: v.total > 0 ? (v.wins / (v.wins + v.losses)) * 100 || 0 : 0
    })).sort((a,b) => b.totalTrades - a.totalTrades),
  };
}
