import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { AppText, Button, Card, ErrorBox } from '@/components/ui';
import { daysLabel } from '@/core/format';
import { getRepository } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { Routine } from '@/types';

export default function RoutesTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const repo = await getRepository();
      setRoutines(await repo.listRoutines());
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar rotas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmDelete(r: Routine) {
    Alert.alert('Excluir rota', `Deseja excluir "${r.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const repo = await getRepository();
          await repo.deleteRoutine(r.id);
          load();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Button title="Nova rota de rotina" icon="add" onPress={() => router.push('/route/new')} />
      {error && <ErrorBox message={error} />}
      {loading && <ActivityIndicator accessibilityLabel="Carregando rotas" />}
      <FlatList
        data={routines}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={!loading ? <AppText muted>Você ainda não salvou nenhuma rota.</AppText> : undefined}
        renderItem={({ item }) => (
          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, saída às ${item.departureTime}, ${daysLabel(item.days)}. Toque para verificar problemas.`}
              onPress={() => router.push({ pathname: '/route/[id]', params: { id: item.id } })}
              style={{ minHeight: 48 }}
            >
              <AppText size={20} weight="700">
                {item.name}
              </AppText>
              <AppText muted>
                {item.departureTime} · {daysLabel(item.days)}
              </AppText>
              <AppText muted size={14}>
                {item.originLabel} → {item.destinationLabel}
              </AppText>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                title="Verificar"
                icon="search"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/route/[id]', params: { id: item.id } })}
              />
              <Pressable
                onPress={() => confirmDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Excluir rota ${item.name}`}
                style={{ width: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2, borderColor: colors.danger }}
              >
                <Ionicons name="trash" size={22} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
