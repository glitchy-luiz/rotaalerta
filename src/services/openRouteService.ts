import { Place, RouteOption } from '../types';

const KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUzYWUwMzNhYThkYTQ0NjA5OGQ1Y2NiNTdjYWI4M2UxIiwiaCI6Im11cm11cjY0In0=";

const BASE = 'https://api.openrouteservice.org';

// Centro de São Paulo: usado para priorizar resultados da cidade na busca.
const SP = { lon: -46.6333, lat: -23.5505 };

function assertKey() {
  if (!KEY) {
    throw new Error('Chave do OpenRouteService não configurada. Veja o README (arquivo .env.local).');
  }
}

export async function searchPlaces(text: string): Promise<Place[]> {
  assertKey();
  const url =
    `${BASE}/geocode/search?api_key=${KEY}&text=${encodeURIComponent(text)}` +
    `&boundary.country=BR&focus.point.lon=${SP.lon}&focus.point.lat=${SP.lat}&size=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha na busca de endereços (${res.status}).`);
  const data = await res.json();
  return (data.features ?? []).map((f: any) => ({
    label: f.properties.label as string,
    coord: { latitude: f.geometry.coordinates[1] as number, longitude: f.geometry.coordinates[0] as number },
  }));
}

async function directions(body: object): Promise<any> {
  const res = await fetch(`${BASE}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: { Authorization: KEY as string, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha ao calcular rota (${res.status}). ${detail.slice(0, 160)}`);
  }
  return res.json();
}

function parse(data: any): RouteOption[] {
  const routes: RouteOption[] = (data.features ?? []).map((f: any, i: number) => {
    const coords = (f.geometry.coordinates as number[][]).map((c) => ({ latitude: c[1], longitude: c[0] }));
    const steps = ((f.properties.segments?.[0]?.steps ?? []) as any[]).map((s) => ({
      name: (s.name ?? '') as string,
      distanceM: s.distance as number,
      startIdx: s.way_points[0] as number,
      endIdx: s.way_points[1] as number,
    }));
    const byName = new Map<string, number>();
    steps.forEach((s) => {
      if (s.name && s.name !== '-') byName.set(s.name, (byName.get(s.name) ?? 0) + s.distanceM);
    });
    const mainStreets = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n);
    return {
      id: `r${i}`,
      distanceM: f.properties.summary.distance as number,
      durationS: f.properties.summary.duration as number,
      coords,
      steps,
      mainStreets,
    };
  });
  return routes.sort((a, b) => a.durationS - b.durationS); // a mais rápida vira a rota principal
}

/** Rota principal (índice 0) + até 2 alternativas. */
export async function getRoutes(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<RouteOption[]> {
  assertKey();
  const coordinates = [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude],
  ];
  const base = { coordinates, language: 'pt', instructions: true };
  let data: any;
  try {
    data = await directions({
      ...base,
      alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.6 },
    });
  } catch {
    // Alternativas têm limites (ex.: distância). Tenta só a rota principal.
    data = await directions(base);
  }
  const routes = parse(data);
  if (routes.length === 0) throw new Error('Nenhuma rota encontrada entre esses pontos.');
  return routes;
}
