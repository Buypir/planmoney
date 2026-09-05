function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getPeriodRange(period, now = new Date()) {
  const start = startOfDay(now);
  let end;
  if (period === 'today') {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  } else if (period === 'week') {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (period === 'year') {
    start.setMonth(0, 1);
    end = new Date(start.getFullYear() + 1, 0, 1);
  } else {
    start.setDate(1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  return { start, end };
}

export function getPreviousPeriodRange(period, now = new Date()) {
  const { start } = getPeriodRange(period, now);
  const anchor = new Date(start);
  if (period === 'today') anchor.setDate(anchor.getDate() - 1);
  else if (period === 'week') anchor.setDate(anchor.getDate() - 7);
  else if (period === 'year') anchor.setFullYear(anchor.getFullYear() - 1);
  else anchor.setMonth(anchor.getMonth() - 1);
  return getPeriodRange(period, anchor);
}

export function inRange(date, range) {
  const d = new Date(date);
  return d >= range.start && d < range.end;
}

export function pctChange(cur, prev) {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / Math.abs(prev)) * 100);
}

export function fmtChange(pct) {
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

// Останні 7 днів сум по днях — для спарклайнів (незалежно від обраного періоду)
export function last7DaysTrend(transactions, type) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return transactions
      .filter((tx) => tx.type === type && inRange(tx.date, { start: day, end: next }))
      .reduce((s, tx) => s + tx.amount, 0);
  });
}
