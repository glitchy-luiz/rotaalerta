import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { AppText, Button, ErrorBox, Field } from '@/components/ui';
import { friendlyAuthError } from '@/data/auth';
import { useTheme } from '@/theme/ThemeContext';

export default function Login() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) return setError('Preencha e-mail e senha.');
    setLoading(true);
    try {
      await signIn(email, password); // o redirecionamento é automático (Stack.Protected)
    } catch (e: any) {
      setError(friendlyAuthError(e));
      setLoading(false);
    }
  }

  async function forgot() {
    setError(null);
    setInfo(null);
    if (!email.trim()) return setError('Digite seu e-mail acima para receber o link de redefinição.');
    try {
      await resetPassword(email);
      setInfo('Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.');
    } catch (e: any) {
      setError(friendlyAuthError(e));
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name="navigate-circle" size={72} color={colors.primary} />
          <AppText size={30} weight="700">
            RotaAlerta
          </AppText>
          <AppText muted style={{ textAlign: 'center' }}>
            Avisamos sobre problemas na sua rota antes de você sair.
          </AppText>
        </View>

        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="voce@email.com" />
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" textContentType="password" placeholder="Sua senha" />
        <Button title={showPassword ? 'Ocultar senha' : 'Mostrar senha'} icon={showPassword ? 'eye-off' : 'eye'} variant="secondary" onPress={() => setShowPassword((v) => !v)} />

        {error && <ErrorBox message={error} />}
        {info && (
          <AppText accessibilityRole="alert" color={colors.success}>
            {info}
          </AppText>
        )}

        <Button title="Entrar" icon="log-in" onPress={submit} loading={loading} />
        <Button title="Esqueci minha senha" variant="secondary" onPress={forgot} />
        <Button title="Criar uma conta" icon="person-add" variant="secondary" onPress={() => router.push('/register')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
