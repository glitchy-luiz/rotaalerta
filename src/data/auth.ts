import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
// getReactNativePersistence existe no build React Native do Firebase (Metro resolve com a condição
// "react-native"), mas os tipos padrão de 'firebase/auth' não a declaram. Por isso o ts-expect-error.
// @ts-expect-error tipos de 'firebase/auth' não incluem a versão React Native
import { getReactNativePersistence } from 'firebase/auth';
import { getFirebaseApp } from './firebase';

let auth: Auth | null = null;

/** Auth com persistência em AsyncStorage: o usuário continua logado ao reabrir o app. */
export function getAuthInstance(): Auth {
  if (auth) return auth;
  const app = getFirebaseApp();
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast Refresh: já foi inicializado.
    auth = getAuth(app);
  }
  return auth;
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  return cred.user;
}

export const logout = () => fbSignOut(getAuthInstance());

export const sendReset = (email: string) => sendPasswordResetEmail(getAuthInstance(), email.trim());

/** Traduz códigos de erro do Firebase para mensagens simples em português. */
export function friendlyAuthError(e: any): string {
  switch (e?.code) {
    case 'auth/invalid-email':
      return 'E-mail inválido. Confira se digitou corretamente.';
    case 'auth/missing-password':
      return 'Digite sua senha.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail. Tente entrar.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail e senha não está ativado no Firebase (Authentication → Método de login).';
    default:
      return e?.message ?? 'Não foi possível concluir. Tente novamente.';
  }
}
