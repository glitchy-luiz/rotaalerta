import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthInstance } from './auth';
import { firebaseConfigured } from './firebase';

const KEY = '@rotaalerta:userId';
/// não usa login firebasew se n tiver configurado
export async function getUserId(): Promise<string> {
  if (firebaseConfigured) {
    const auth = getAuthInstance();
    await auth.authStateReady();
    if (!auth.currentUser) throw new Error('Você precisa entrar na sua conta.');
    return auth.currentUser.uid;
  }
  const saved = await AsyncStorage.getItem(KEY);
  if (saved) return saved;
  const id = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(KEY, id);
  return id;
}
