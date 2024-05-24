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
export function createDateRange(start: Date, end: Date, prevRange = [] as Date[]) {
  if (start.valueOf() >= end.valueOf()) return [...prevRange, end];
  const nextRange = [...prevRange, start];
  const nextStart = plusDay(start);
  if (nextStart.valueOf() >= end.valueOf()) return [...nextRange, end];
  return createDateRange(nextStart, end, nextRange);
}
