import dayjs, { Dayjs } from "dayjs";

export interface YearMonth {
  year: number;
  month: number;
}

export function formatMonth(month: number) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return monthNames[month - 1];
}

export function formatYearMonth(yearMonth: YearMonth): string {
  const month = formatMonth(yearMonth.month);
  return `${month} - ${yearMonth.year}`
}

export function dayjsToYearMonth(date: Dayjs | null): string {
  if (!date) return '';
  return date.format('YYYY-MM');
}

export function getCurrentMonth() {
  return dayjs();
};
