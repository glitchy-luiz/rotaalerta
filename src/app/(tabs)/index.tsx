import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useAuth } from '@/auth/AuthContext';
import { AppText, Button, Card, ErrorBox } from '@/components/ui';
import { describeWhen, daysLabel, nextRoutine } from '@/core/format';
import { backendName, getRepository } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { Incident, Routine } from '@/types';

const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.25, longitudeDelta: 0.25 };

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Location.requestForegroundPermissionsAsync()
        .then((r) => active && setGranted(r.status === 'granted'))
        .catch(() => {});
      (async () => {
        try {
          const repo = await getRepository();
          const [r, i] = await Promise.all([repo.listRoutines(), repo.listIncidents()]);
          if (!active) return;
          setRoutines(r);
          setIncidents(i.filter((x) => x.active));
          setError(null);
        } catch (e: any) {
          if (active) setError(e.message ?? 'Erro ao carregar dados.');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const next = useMemo(() => nextRoutine(routines, new Date()), [routines]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <AppText size={26} weight="700">
          {firstName ? `Olá, ${firstName}! 👋` : 'Olá! 👋'}
        </AppText>
        <AppText muted>Avisamos sobre problemas na sua rota antes de você sair de casa.</AppText>
      </View>

      <View
        accessible
        accessibilityLabel={`Mapa de São Paulo. ${incidents.length} incidentes ativos.`}
        style={{ borderRadius: 16, overflow: 'hidden', height: 220, borderWidth: 1, borderColor: colors.border }}
      >
        <MapView style={{ flex: 1 }} initialRegion={SAO_PAULO} showsUserLocation={granted}>
          {incidents.map((i) => (
            <React.Fragment key={i.id}>
              <Marker coordinate={i} title={i.title} description={i.street} pinColor="red" />
              <Circle center={i} radius={i.radiusM} strokeColor="#B91C1C" fillColor="rgba(185,28,28,0.2)" />
            </React.Fragment>
          ))}
        </MapView>
      </View>
      <AppText size={13} muted>
        {incidents.length === 0 ? 'Nenhum incidente ativo no momento.' : `${incidents.length} incidente(s) simulado(s) ativo(s) no mapa.`}
      </AppText>

      {error && <ErrorBox message={error} />}
      {loading && <ActivityIndicator accessibilityLabel="Carregando" />}

      {!loading && next && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="alarm" size={22} color={colors.primary} />
            <AppText weight="700" color={colors.primary}>
              Próxima rotina
            </AppText>
          </View>
          <AppText size={22} weight="700" style={{ marginTop: 6 }}>
            {next.routine.name}
          </AppText>
          <AppText muted>Saída {describeWhen(next.when, new Date())}</AppText>
          <AppText muted size={14}>
            {next.routine.originLabel} → {next.routine.destinationLabel}
          </AppText>
          <AppText muted size={14}>
            {daysLabel(next.routine.days)}
          </AppText>
          <Button
            title="Verificar problemas agora"
            icon="search"
            style={{ marginTop: 12 }}
            hint="Abre a verificação desta rota"
            onPress={() => router.push({ pathname: '/route/[id]', params: { id: next.routine.id } })}
          />
        </Card>
      )}

      {!loading && !next && (
        <Card>
          <AppText weight="700" size={18}>
            Nenhuma rota de rotina ainda
          </AppText>
          <AppText muted style={{ marginVertical: 8 }}>
            Cadastre o caminho que você faz todo dia (trabalho, faculdade…) e nós monitoramos para você.
          </AppText>
          <Button title="Cadastrar primeira rota" icon="add-circle" onPress={() => router.push('/route/new')} />
        </Card>
      )}

      <AppText size={12} muted>
        Dados salvos em: {backendName}
      </AppText>
    </ScrollView>
  );
}
