import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { ja } from "date-fns/locale";

export function toDateOnly(value: string | Date) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function jpDate(date: Date) {
  return format(date, "M/d(E)", { locale: ja });
}

export function monthLabel(month: string) {
  return format(new Date(`${month}-01T00:00:00`), "yyyy年M月", { locale: ja });
}

export function daysInMonth(month: string) {
  const start = startOfMonth(new Date(`${month}-01T00:00:00`));
  const end = endOfMonth(start);
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}

export function currentMonth() {
  return format(new Date(), "yyyy-MM");
}
