import { AlertRecord, Incident, Routine } from '../types';

/** Contrato único de acesso a dados. A UI só conhece esta interface. */
export interface Repository {
  listRoutines(): Promise<Routine[]>;
  saveRoutine(r: Omit<Routine, 'id'>): Promise<Routine>;
  deleteRoutine(id: string): Promise<void>;

  listIncidents(): Promise<Incident[]>;
  addIncident(i: Omit<Incident, 'id'>): Promise<Incident>;
  clearIncidents(): Promise<void>;

  listAlerts(): Promise<AlertRecord[]>;
  addAlert(a: Omit<AlertRecord, 'id'>): Promise<AlertRecord>;
}
