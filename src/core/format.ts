import { Routine } from '../types';

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(totalMin: number): string {
  const t = Math.max(0, Math.round(totalMin));
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m)} m`;
}

export function parseTimeToDate(hhmm: string, base: Date = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function daysLabel(days: number[]): string {
  if (days.length === 7) return 'Todos os dias';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Seg a Sex';
  return [...days].sort().map((d) => DAY_LABELS[d]).join(', ');
}

/** Próxima rotina agendada a partir de "now". */
export function nextRoutine(routines: Routine[], now: Date): { routine: Routine; when: Date } | null {
  let best: { routine: Routine; when: Date } | null = null;
  for (const routine of routines) {
    for (let offset = 0; offset <= 7; offset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + offset);
      if (!routine.days.includes(day.getDay())) continue;
      const when = parseTimeToDate(routine.departureTime, day);
      if (when.getTime() < now.getTime()) continue;
      if (!best || when < best.when) best = { routine, when };
      break;
    }
  }
  return best;
}

export function describeWhen(when: Date, now: Date): string {
  const sameDay = when.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay) return `hoje às ${formatTime(when)}`;
  if (when.toDateString() === tomorrow.toDateString()) return `amanhã às ${formatTime(when)}`;
  return `${DAY_LABELS[when.getDay()]} às ${formatTime(when)}`;
}
