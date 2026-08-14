/**
 * Format a timestamp to HH:MM.
 */
export function formatHHMM(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format a duration in hours to a human-readable string.
 * e.g. 2.5 → "2h 30m", 0.25 → "15m"
 */
export function formatDuration(hours) {
  if (hours <= 0) return '0m';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format session duration from first drink timestamp to now.
 */
export function formatSessionDuration(firstDrinkTimestamp) {
  if (!firstDrinkTimestamp) return '0m';
  const hours = (Date.now() - firstDrinkTimestamp) / 3_600_000;
  return formatDuration(hours);
}
