import { getLocalTimeZone, today } from '@internationalized/date';

// Find out if two dates are the same, w/o regard to hours, minutes or smaller units.
export const sameDate = (d1: Date, d2: Date) =>
  d1 instanceof Date && d2 instanceof Date
  && d1.getFullYear() === d2.getFullYear()
  && d1.getMonth() === d2.getMonth()
  && d1.getDate() === d2.getDate();

// Given a Date object, return a new Date object set 24 hours later.
export const plusDay = (d: Date) => new Date(d.valueOf() + 24 * 60 * 60 * 1000);

// Given a starting Date object and an ending Date object, return an array of
// Date objects spanning that date range, including the start and end dates.
export function createDateSequence(start: Date, end: Date, prevSeq = [] as Date[]) {
  if (start.valueOf() >= end.valueOf()) return [...prevSeq, end];
  const nextSeq = [...prevSeq, start];
  const nextStart = plusDay(start);
  if (nextStart.valueOf() >= end.valueOf()) return [...nextSeq, end];
  return createDateSequence(nextStart, end, nextSeq);
}

export const defaultSeason = {
  start: { month: 3, day: 1 },
  end: { month: 11, day: 30 },
};
export const fallbackRange = (season: typeof defaultSeason) => {
  const tz = getLocalTimeZone()
  const current = today(tz);
  const index = current.month > season.end.month 
    ? current.cycle('year', 1).set(season.start)
    : current;
  const start = index.set(season.start);
  const end = current.set(season.end);
  return [start.toDate(tz), end.toDate(tz)] as [Date, Date];
};
