import React from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { AppText, Button, Card } from '@/components/ui';
import { backendName } from '@/data';
import { useTheme } from '@/theme/ThemeContext';

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
      <View style={{ flex: 1 }}>
        <AppText weight="700">{label}</AppText>
        <AppText size={14} muted>
          {desc}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}

export default function SettingsTab() {
  const { settings, update } = useTheme();
  const { user, requiresLogin, signOut } = useAuth();

  function confirmSignOut() {
    Alert.alert('Sair da conta', 'Deseja sair? Suas rotas continuam salvas na sua conta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Card style={{ gap: 6 }}>
        <AppText size={18} weight="700">
          Conta
        </AppText>
        {requiresLogin && user ? (
          <>
            {user.name ? <AppText weight="600">{user.name}</AppText> : null}
            <AppText muted>{user.email}</AppText>
            <Button title="Sair da conta" icon="log-out" variant="danger" style={{ marginTop: 8 }} onPress={confirmSignOut} />
          </>
        ) : (
          <AppText muted>Modo local: sem login (Firebase não configurado).</AppText>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <AppText size={18} weight="700">
          Acessibilidade
        </AppText>
        <Toggle label="Alto contraste" desc="Fundo preto e cores fortes" value={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
        <Toggle label="Texto grande" desc="Aumenta o tamanho das letras" value={settings.largeText} onChange={(v) => update({ largeText: v })} />
      </Card>

      <Card style={{ gap: 6 }}>
        <AppText size={18} weight="700">
          Sobre os dados
        </AppText>
        <AppText>• Mapa, endereços e rotas: reais (OpenRouteService).</AppText>
        <AppText>• Incidentes de trânsito: simulados para demonstração.</AppText>
        <AppText>• Rotas salvas e alertas: {backendName}.</AppText>
      </Card>
    </ScrollView>
  );
}
