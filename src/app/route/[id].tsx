import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import { AlertCard } from '@/components/AlertCard';
import { AppText, Button, Card, Chip, ErrorBox } from '@/components/ui';
import { INCIDENT_META, analyzeRoutine, buildSimulatedIncident } from '@/core/analysis';
import { daysLabel, formatDistance, formatDuration, formatTime, parseTimeToDate } from '@/core/format';
import { getRepository } from '@/data';
import { getRoutes } from '@/services/openRouteService';
import { routeCache } from '@/services/routeCache';
import { useTheme } from '@/theme/ThemeContext';
import { Incident, IncidentType, RouteOption, Routine } from '@/types';

export default function RouteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const savedMessage = useRef<string | null>(null);

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routes, setRoutes] = useState<RouteOption[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simOpen, setSimOpen] = useState(false);
  const [simType, setSimType] = useState<IncidentType>('accident');
  const [simDelay, setSimDelay] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repo = await getRepository();
      const r = (await repo.listRoutines()).find((x) => x.id === id);
      if (!r) throw new Error('Rota não encontrada.');
      setRoutine(r);
      setIncidents((await repo.listIncidents()).filter((i) => i.active));
      const rts = await getRoutes(r.origin, r.destination);
      routeCache.set(r.id, rts);
      setRoutes(rts);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao verificar a rota.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Núcleo: recalcula localmente sempre que rotas ou incidentes mudam (não gasta cota da API).
  const analysis = useMemo(
    () => (routine && routes ? analyzeRoutine(routes, incidents, parseTimeToDate(routine.departureTime)) : null),
    [routine, routes, incidents],
  );

  // Registra o alerta no histórico (uma vez por mensagem distinta).
  useEffect(() => {
    if (!analysis || !routine || analysis.status !== 'delayed') return;
    if (savedMessage.current === analysis.message) return;
    savedMessage.current = analysis.message;
    getRepository()
      .then((repo) =>
        repo.addAlert({
          routineId: routine.id,
          routineName: routine.name,
          message: analysis.message,
          delayMinutes: Math.round(analysis.delayMin),
          hadAlternative: !!analysis.alternative,
          createdAt: Date.now(),
        }),
      )
      .catch(() => {});
  }, [analysis, routine]);

  // Ajusta o zoom para mostrar todas as rotas.
  useEffect(() => {
    if (!routes) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(routes.flatMap((r) => r.coords), {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [routes]);

  async function simulate() {
    if (!routes) return;
    try {
      const repo = await getRepository();
      const saved = await repo.addIncident(buildSimulatedIncident(routes, simType, simDelay));
      setIncidents((prev) => [...prev, saved]);
      setSimOpen(false);
    } catch (e: any) {
      setError(e.message ?? 'Não foi possível criar o incidente.');
    }
  }

  async function clearIncidents() {
    const repo = await getRepository();
    await repo.clearIncidents();
    setIncidents([]);
    savedMessage.current = null;
  }

  const alt = analysis?.alternative;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {routine && (
        <View>
          <AppText size={24} weight="700">
            {routine.name}
          </AppText>
          <AppText muted>
            Saída {routine.departureTime} · {daysLabel(routine.days)}
          </AppText>
          <AppText muted size={14}>
            {routine.originLabel} → {routine.destinationLabel}
          </AppText>
        </View>
      )}

      {loading && (
        <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
          <ActivityIndicator size="large" accessibilityLabel="Verificando rota" />
          <AppText muted>Verificando problemas na rota…</AppText>
        </View>
      )}
      {error && <ErrorBox message={error} />}

      {analysis && <AlertCard analysis={analysis} />}

      {routes && (
        <>
          <View
            accessible
            accessibilityLabel={`Mapa com a rota principal e ${routes.length - 1} alternativas. As mesmas informações estão listadas abaixo em texto.`}
            style={{ height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
          >
            <MapView ref={mapRef} style={{ flex: 1 }}>
              {routes.slice(1).map((r, i) => (
                <Polyline
                  key={r.id}
                  coordinates={r.coords}
                  strokeWidth={alt && alt.index === i + 1 ? 6 : 3}
                  strokeColor={alt && alt.index === i + 1 ? '#15803D' : '#94A3B8'}
                  lineDashPattern={[10, 8]}
                />
              ))}
              <Polyline coordinates={routes[0].coords} strokeWidth={6} strokeColor="#1D4ED8" />
              {routine && <Marker coordinate={routine.origin} title="Saída" pinColor="green" />}
              {routine && <Marker coordinate={routine.destination} title="Destino" />}
              {incidents.map((i) => (
                <React.Fragment key={i.id}>
                  <Marker coordinate={i} title={i.title} description={i.street} pinColor="red" />
                  <Circle center={i} radius={i.radiusM} strokeColor="#B91C1C" fillColor="rgba(185,28,28,0.25)" />
                </React.Fragment>
              ))}
            </MapView>
          </View>

          <Card style={{ gap: 8 }}>
            <AppText weight="700">Rotas encontradas (sem trânsito em tempo real)</AppText>
            {routes.map((r, i) => (
              <AppText key={r.id} size={14}>
                {i === 0 ? '🔵 Principal' : alt && alt.index === i ? '🟢 Alternativa sugerida' : '⚪ Alternativa'}: pela{' '}
                {r.mainStreets[0] ?? 'via local'} · {formatDuration(r.durationS / 60)} · {formatDistance(r.distanceM)}
              </AppText>
            ))}
            {routine && (
              <AppText size={13} muted>
                Chegada normal (sem problemas): {formatTime(new Date(parseTimeToDate(routine.departureTime).getTime() + routes[0].durationS * 1000))}
              </AppText>
            )}
          </Card>

          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flask" size={22} color={colors.primary} />
              <AppText weight="700">Modo demonstração</AppText>
            </View>
            <AppText size={14} muted>
              Os incidentes são simulados. Crie um problema na sua rota para ver o alerta funcionando.
            </AppText>
            {!simOpen ? (
              <Button title="Simular incidente" icon="warning" variant="secondary" onPress={() => setSimOpen(true)} />
            ) : (
              <View style={{ gap: 12 }}>
                <AppText weight="600">Tipo de problema</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(Object.keys(INCIDENT_META) as IncidentType[]).map((t) => (
                    <Chip key={t} label={INCIDENT_META[t].label} selected={simType === t} onPress={() => setSimType(t)} />
                  ))}
                </View>
                <AppText weight="600">Atraso causado</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[15, 30, 45, 60].map((m) => (
                    <Chip key={m} label={`${m} min`} selected={simDelay === m} onPress={() => setSimDelay(m)} />
                  ))}
                </View>
                <Button title="Criar incidente na minha rota" icon="add-circle" onPress={simulate} />
                <Button title="Cancelar" variant="secondary" onPress={() => setSimOpen(false)} />
              </View>
            )}
            {incidents.length > 0 && <Button title="Limpar incidentes" icon="trash" variant="danger" onPress={clearIncidents} />}
          </Card>

          <View style={{ gap: 10 }}>
            <Button
              title="Iniciar rastreio (rota principal)"
              icon="play"
              onPress={() => routine && router.push({ pathname: '/tracking/[id]', params: { id: routine.id, routeIndex: '0' } })}
            />
            {alt && (
              <Button
                title="Seguir rota alternativa"
                icon="git-branch"
                variant="secondary"
                onPress={() =>
                  routine && router.push({ pathname: '/tracking/[id]', params: { id: routine.id, routeIndex: String(alt.index) } })
                }
              />
            )}
            <Button title="Verificar novamente" icon="refresh" variant="secondary" onPress={load} />
          </View>
        </>
      )}
    </ScrollView>
  );
}
