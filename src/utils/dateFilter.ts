export type DateFilterPreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface DateFilterState {
  preset: DateFilterPreset;
  selectedDate: string; // 'YYYY-MM-DD'
  startDate?: string;   // 'YYYY-MM-DD' for range
  endDate?: string;     // 'YYYY-MM-DD' for range
}

/** Formats a Date object to YYYY-MM-DD in local time */
export function formatToLocalYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get today's date string YYYY-MM-DD in local time */
export function getTodayYMD(): string {
  return formatToLocalYMD(new Date());
}

/** Get yesterday's date string YYYY-MM-DD in local time */
export function getYesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatToLocalYMD(d);
}

/** Extract YYYY-MM-DD from an ISO string, timestamp or date string */
export function extractYMD(dateInput: string | null | undefined): string | null {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatToLocalYMD(parsed);
  }
  return null;
}

/**
 * Checks whether a given record date matches the current DateFilterState.
 * @param dateInput The date string from the record (e.g. registrationDate, dateSubmitted, incidentDate)
 * @param filter The DateFilterState
 */
export function isDateMatchingFilter(
  dateInput: string | null | undefined,
  filter: DateFilterState
): boolean {
  if (filter.preset === 'all') return true;

  const targetYMD = extractYMD(dateInput);
  if (!targetYMD) return false;

  const today = getTodayYMD();

  if (filter.preset === 'today') {
    return targetYMD === today;
  }

  if (filter.preset === 'yesterday') {
    return targetYMD === getYesterdayYMD();
  }

  if (filter.preset === 'week') {
    // Within last 7 days inclusive of today
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    const startYMD = formatToLocalYMD(sevenDaysAgo);
    return targetYMD >= startYMD && targetYMD <= today;
  }

  if (filter.preset === 'month') {
    // Current month and year
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return targetYMD.startsWith(yearMonth);
  }

  if (filter.preset === 'custom') {
    if (filter.startDate && filter.endDate) {
      return targetYMD >= filter.startDate && targetYMD <= filter.endDate;
    }
    if (filter.selectedDate) {
      return targetYMD === filter.selectedDate;
    }
  }

  return true;
}

/** Formats date into a user-friendly format e.g. "Nov 11, 2026" */
export function formatFriendlyDate(dateInput: string | null | undefined): string {
  const ymd = extractYMD(dateInput);
  if (!ymd) return '—';
  try {
    const [year, month, day] = ymd.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return ymd;
  }
}

/** Returns a clean descriptive label for the active filter */
export function getFilterDisplayLabel(filter: DateFilterState): string {
  if (filter.preset === 'all') return 'All Time';
  if (filter.preset === 'today') return `Today (${formatFriendlyDate(getTodayYMD())})`;
  if (filter.preset === 'yesterday') return `Yesterday (${formatFriendlyDate(getYesterdayYMD())})`;
  if (filter.preset === 'week') return 'Last 7 Days';
  if (filter.preset === 'month') {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (filter.preset === 'custom') {
    if (filter.startDate && filter.endDate) {
      return `${formatFriendlyDate(filter.startDate)} - ${formatFriendlyDate(filter.endDate)}`;
    }
    if (filter.selectedDate) {
      return `Day: ${formatFriendlyDate(filter.selectedDate)}`;
    }
  }
  return 'Filtered';
}
