import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertRecord, Incident, Routine } from '../types';
import { Repository } from './repository';

/** Fallback offline (AsyncStorage) usado quando o Firebase não está configurado. */
export function createLocalRepository(uid: string): Repository {
  const key = (n: string) => `@rotaalerta:${uid}:${n}`;
  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  async function read<T>(name: string): Promise<T[]> {
    const raw = await AsyncStorage.getItem(key(name));
    return raw ? (JSON.parse(raw) as T[]) : [];
  }
  const write = <T,>(name: string, items: T[]) => AsyncStorage.setItem(key(name), JSON.stringify(items));

  async function add<T extends { id: string }>(name: string, data: Omit<T, 'id'>): Promise<T> {
    const item = { ...(data as object), id: newId() } as T;
    const items = await read<T>(name);
    items.push(item);
    await write(name, items);
    return item;
  }

  return {
    listRoutines: () => read<Routine>('routines'),
    saveRoutine: (r) => add<Routine>('routines', r),
    deleteRoutine: async (id) => {
      const items = await read<Routine>('routines');
      await write('routines', items.filter((x) => x.id !== id));
    },

    listIncidents: () => read<Incident>('incidents'),
    addIncident: (i) => add<Incident>('incidents', i),
    clearIncidents: () => write('incidents', []),

    listAlerts: async () => (await read<AlertRecord>('alerts')).sort((a, b) => b.createdAt - a.createdAt),
    addAlert: (a) => add<AlertRecord>('alerts', a),
  };
}
