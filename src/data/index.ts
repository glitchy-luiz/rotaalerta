import { firebaseConfigured } from './firebase';
import { createFirestoreRepository } from './firestoreRepository';
import { getUserId } from './identity';
import { createLocalRepository } from './localRepository';
import { Repository } from './repository';

export const backendName = firebaseConfigured ? 'Firebase Firestore' : 'Armazenamento local (Firebase não configurado)';

// Um repositório por usuário: ao trocar de conta, os dados não se misturam.
const cache = new Map<string, Repository>();

export async function getRepository(): Promise<Repository> {
  const uid = await getUserId();
  let repo = cache.get(uid);
  if (!repo) {
    repo = firebaseConfigured ? createFirestoreRepository(uid) : createLocalRepository(uid);
    cache.set(uid, repo);
  }
  return repo;
}

export { getUserId };
