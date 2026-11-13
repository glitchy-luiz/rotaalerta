export type Coord = { latitude: number; longitude: number };

export type Routine = {
  id: string;
  name: string;
  originLabel: string;
  destinationLabel: string;
  origin: Coord;
  destination: Coord;
  departureTime: string; // "HH:MM"
  days: number[]; // 0 = domingo ... 6 = sábado
  createdAt: number;
};

export type IncidentType = 'accident' | 'roadwork' | 'flood' | 'closure' | 'metro';

export type Incident = {
  id: string;
  type: IncidentType;
  title: string;
  street: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  delayMinutes: number;
  active: boolean;
  createdAt: number;
};

export type AlertRecord = {
  id: string;
  routineId: string;
  routineName: string;
  message: string;
  delayMinutes: number;
  hadAlternative: boolean;
  createdAt: number;
};

export type RouteStep = { name: string; distanceM: number; startIdx: number; endIdx: number };

export type RouteOption = {
  id: string;
  distanceM: number;
  durationS: number;
  coords: Coord[];
  steps: RouteStep[];
  mainStreets: string[];
};

export type Place = { label: string; coord: Coord };
