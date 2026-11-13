import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { AppText, Card, ErrorBox } from '@/components/ui';
import { getRepository } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { AlertRecord } from '@/types';

export default function HistoryTab() {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const repo = await getRepository();
          setAlerts(await repo.listAlerts());
          setError(null);
        } catch (e: any) {
          setError(e.message ?? 'Erro ao carregar alertas.');
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {error && <ErrorBox message={error} />}
      {loading && <ActivityIndicator accessibilityLabel="Carregando alertas" />}
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={!loading ? <AppText muted>Nenhum alerta ainda. Verifique uma rota e simule um incidente.</AppText> : undefined}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name="warning" size={22} color={colors.danger} />
              <AppText weight="700">{item.routineName}</AppText>
            </View>
            <AppText size={13} muted>
              {new Date(item.createdAt).toLocaleString('pt-BR')} · atraso {item.delayMinutes} min ·{' '}
              {item.hadAlternative ? 'com alternativa' : 'sem alternativa'}
            </AppText>
            <AppText style={{ marginTop: 6 }}>{item.message}</AppText>
          </Card>
        )}
      />
    </View>
  );
}
