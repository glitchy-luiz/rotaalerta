import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { AlertRecord, Incident, Routine } from '../types';
import { getDb } from './firebase';
import { Repository } from './repository';

/** Estrutura: users/{uid}/routines | incidents | alerts */
export function createFirestoreRepository(uid: string): Repository {
  const col = (name: string) => collection(getDb(), 'users', uid, name);

  async function list<T>(name: string, order: 'asc' | 'desc', max?: number): Promise<T[]> {
    const q = max
      ? query(col(name), orderBy('createdAt', order), limit(max))
      : query(col(name), orderBy('createdAt', order));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T);
  }

  async function add<T extends { id: string }>(name: string, data: Omit<T, 'id'>): Promise<T> {
    const ref = await addDoc(col(name), data as object);
    return { ...(data as object), id: ref.id } as T;
  }

  return {
    listRoutines: () => list<Routine>('routines', 'asc'),
    saveRoutine: (r) => add<Routine>('routines', r),
    deleteRoutine: async (id) => {
      await deleteDoc(doc(getDb(), 'users', uid, 'routines', id));
    },

    listIncidents: () => list<Incident>('incidents', 'asc'),
    addIncident: (i) => add<Incident>('incidents', i),
    clearIncidents: async () => {
      const snap = await getDocs(col('incidents'));
      const batch = writeBatch(getDb());
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    },

    listAlerts: () => list<AlertRecord>('alerts', 'desc', 50),
    addAlert: (a) => add<AlertRecord>('alerts', a),
  };
}
