
import { Incident, IncidentType, RouteOption } from '../types';
import { distanceToPolylineM } from './geo';
import { formatDuration, formatTime } from './format';

export const INCIDENT_META: Record<IncidentType, { title: string; icon: string; label: string }> = {
  accident: { title: 'Acidente de carros', icon: 'car-sport', label: 'Acidente' },
  roadwork: { title: 'Obras na pista', icon: 'construct', label: 'Obras' },
  flood: { title: 'Alagamento', icon: 'water', label: 'Alagamento' },
  closure: { title: 'Via interditada', icon: 'ban', label: 'Interdição' },
  metro: { title: 'Linha de metrô parada (mais carros nas vias)', icon: 'subway', label: 'Metrô parado' },
};

export type AlternativeInfo = {
  index: number;
  route: RouteOption;
  durationMin: number;
  delayMin: number;
  arrival: Date;
  savingMin: number;
  viaStreet: string;
};

export type Analysis = {
  status: 'clear' | 'delayed';
  departure: Date;
  baseDurationMin: number;
  baseArrival: Date;
  incidents: Incident[];
  mainIncident?: Incident;
  delayMin: number;
  delayedArrival: Date;
  alternative?: AlternativeInfo;
  message: string;
};

const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

export function incidentsOnRoute(route: RouteOption, incidents: Incident[]): Incident[] {
  return incidents.filter((i) => i.active && distanceToPolylineM(i, route.coords) <= i.radiusM);
}

const sumDelay = (list: Incident[]) => list.reduce((s, i) => s + i.delayMinutes, 0);

export function analyzeRoutine(routes: RouteOption[], incidents: Incident[], departure: Date): Analysis {
  const base = routes[0];
  const baseDurationMin = base.durationS / 60;
  const baseArrival = addMin(departure, baseDurationMin);
  const onBase = incidentsOnRoute(base, incidents);

  if (onBase.length === 0) {
    return {
      status: 'clear',
      departure,
      baseDurationMin,
      baseArrival,
      incidents: [],
      delayMin: 0,
      delayedArrival: baseArrival,
      message: `Tudo certo na sua rota. Saindo às ${formatTime(departure)}, você chega às ${formatTime(baseArrival)} (${formatDuration(baseDurationMin)}).`,
    };
  }

  const delayMin = sumDelay(onBase);
  const mainIncident = onBase.reduce((a, b) => (b.delayMinutes > a.delayMinutes ? b : a));
  const delayedArrival = addMin(baseArrival, delayMin);

  let best: AlternativeInfo | undefined;
  routes.slice(1).forEach((route, i) => {
    const d = sumDelay(incidentsOnRoute(route, incidents));
    const durationMin = route.durationS / 60 + d;
    const arrival = addMin(departure, durationMin);
    if (!best || arrival < best.arrival) {
      const viaStreet =
        route.mainStreets.find((s) => !base.mainStreets.includes(s)) ?? route.mainStreets[0] ?? 'outro caminho';
      best = {
        index: i + 1,
        route,
        durationMin,
        delayMin: d,
        arrival,
        savingMin: (delayedArrival.getTime() - arrival.getTime()) / 60000,
        viaStreet,
      };
    }
  });

  const alternative = best && best.savingMin >= 1 ? best : undefined;

  let message =
    `${mainIncident.title} (${mainIncident.street}): atraso médio de ${formatDuration(delayMin)} ` +
    `(chegada às ${formatTime(delayedArrival)}).`;
  if (alternative) {
    message +=
      ` Rota alternativa pela ${alternative.viaStreet}: tempo total de ${formatDuration(alternative.durationMin)} ` +
      `(chegada às ${formatTime(alternative.arrival)}).`;
  } else {
    message += ` Não há alternativa melhor. Saia ${formatDuration(delayMin)} mais cedo para chegar às ${formatTime(baseArrival)}.`;
  }

  return {
    status: 'delayed',
    departure,
    baseDurationMin,
    baseArrival,
    incidents: onBase,
    mainIncident,
    delayMin,
    delayedArrival,
    alternative,
    message,
  };
}

function streetAtIndex(route: RouteOption, idx: number): string {
  const named = route.steps.filter((s) => s.name && s.name !== '-');
  if (named.length === 0) return 'via da rota';
  const inside = named.find((s) => idx >= s.startIdx && idx <= s.endIdx);
  if (inside) return inside.name;
  const dist = (s: { startIdx: number; endIdx: number }) =>
    idx < s.startIdx ? s.startIdx - idx : idx - s.endIdx;
  return named.reduce((a, b) => (dist(b) < dist(a) ? b : a)).name;
}

/**
 * Cria um incidente SIMULADO em cima da rota principal, num ponto o mais distante possível
 * das rotas alternativas (para que a alternativa realmente desvie do problema).
 */
export function buildSimulatedIncident(
  routes: RouteOption[],
  type: IncidentType,
  delayMinutes: number,
): Omit<Incident, 'id'> {
  const base = routes[0];
  const alts = routes.slice(1);
  const n = base.coords.length;
  const from = Math.floor(n * 0.2);
  const to = Math.max(from, Math.floor(n * 0.8));
  const step = Math.max(1, Math.floor((to - from) / 120));

  let bestIdx = Math.floor(n / 2);
  let bestScore = -1;
  for (let i = from; i <= to; i += step) {
    const p = base.coords[i];
    const score = alts.length ? Math.min(...alts.map((a) => distanceToPolylineM(p, a.coords))) : 1000;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  const point = base.coords[bestIdx];
  const radiusM = alts.length ? Math.max(40, Math.min(150, bestScore * 0.7)) : 150;

  return {
    type,
    title: INCIDENT_META[type].title,
    street: streetAtIndex(base, bestIdx),
    latitude: point.latitude,
    longitude: point.longitude,
    radiusM,
    delayMinutes,
    active: true,
    createdAt: Date.now(),
  };
}
