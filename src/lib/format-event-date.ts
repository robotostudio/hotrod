const TIME_ZONE = 'America/New_York';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

const dayKey = (date: Date) =>
  date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

export function formatEventDay(start: Date, end?: Date): string {
  if (!end || dayKey(start) === dayKey(end)) return dayFormatter.format(start);
  return `${dayFormatter.format(start)} to ${dayFormatter.format(end)}`;
}

export function formatEventTime(start: Date, end?: Date): string {
  if (!end || dayKey(start) !== dayKey(end)) return `${timeFormatter.format(start)} ET`;
  return `${timeFormatter.format(start)} to ${timeFormatter.format(end)} ET`;
}
