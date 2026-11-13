import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { AppText, Button, ErrorBox, Field } from '@/components/ui';
import { friendlyAuthError } from '@/data/auth';

export default function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError('Digite seu nome.');
    if (!email.trim()) return setError('Digite seu e-mail.');
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não são iguais.');
    setLoading(true);
    try {
      await signUp(name, email, password); // após criar a conta, o usuário já entra
    } catch (e: any) {
      setError(friendlyAuthError(e));
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <AppText muted>Crie sua conta para salvar suas rotas. Cada pessoa vê apenas as próprias rotas.</AppText>
        <Field label="Nome" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Seu nome" />
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" placeholder="voce@email.com" />
        <Field label="Senha (mínimo 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" textContentType="newPassword" placeholder="Crie uma senha" />
        <Field label="Confirmar senha" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} autoCapitalize="none" textContentType="newPassword" placeholder="Repita a senha" />
        <Button title={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'} icon={showPassword ? 'eye-off' : 'eye'} variant="secondary" onPress={() => setShowPassword((v) => !v)} />
        {error && <ErrorBox message={error} />}
        <Button title="Criar conta" icon="person-add" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
