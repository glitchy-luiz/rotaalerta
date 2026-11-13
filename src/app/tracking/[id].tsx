import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { AppText, Button, Card, ErrorBox } from '@/components/ui';
import { cumulativeDistances, nearestIndex } from '@/core/geo';
import { formatDistance, formatDuration, formatTime } from '@/core/format';
import { getRepository } from '@/data';
import { getRoutes } from '@/services/openRouteService';
import { routeCache } from '@/services/routeCache';
import { useTheme } from '@/theme/ThemeContext';
import { Coord, RouteOption } from '@/types';

export default function Tracking() {
  const { id, routeIndex } = useLocalSearchParams<{ id: string; routeIndex?: string }>();
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const idx = Number(routeIndex ?? 0);

  const [route, setRoute] = useState<RouteOption | null>(null);
  const [pos, setPos] = useState<Coord | null>(null);
  const [simulate, setSimulate] = useState(false);
  const [simI, setSimI] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Carrega a rota (cache ou API)
  useEffect(() => {
    (async () => {
      try {
        let rts = routeCache.get(id);
        if (!rts) {
          const repo = await getRepository();
          const r = (await repo.listRoutines()).find((x) => x.id === id);
          if (!r) throw new Error('Rota não encontrada.');
          rts = await getRoutes(r.origin, r.destination);
          routeCache.set(id, rts);
        }
        setRoute(rts[idx] ?? rts[0]);
      } catch (e: any) {
        setError(e.message ?? 'Erro ao carregar a rota.');
      }
    })();
  }, [id, idx]);

  // GPS real (somente em primeiro plano)
  useEffect(() => {
    if (simulate) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada. Use "Simular deslocamento".');
        return;
      }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 2000 },
        (l) => !cancelled && setPos({ latitude: l.coords.latitude, longitude: l.coords.longitude }),
      );
      if (cancelled) s.remove();
      else sub = s;
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [simulate]);

  // Deslocamento simulado (para demonstração sem sair de casa)
  useEffect(() => {
    if (!simulate || !route) return;
    setSimI(0);
    const step = Math.max(1, Math.ceil(route.coords.length / 60));
    const t = setInterval(() => setSimI((i) => Math.min(i + step, route.coords.length - 1)), 1000);
    return () => clearInterval(t);
  }, [simulate, route]);

  const current: Coord | null = simulate && route ? route.coords[simI] : pos;
  const cum = useMemo(() => (route ? cumulativeDistances(route.coords) : []), [route]);

  const progress = useMemo(() => {
    if (!route || !current || cum.length === 0) return null;
    const i = nearestIndex(current, route.coords);
    const total = cum[cum.length - 1] || 1;
    const remaining = total - cum[i];
    const fraction = remaining / total;
    const remainingSec = route.durationS * fraction;
    return {
      remainingM: remaining * (route.distanceM / total),
      remainingMin: remainingSec / 60,
      eta: new Date(Date.now() + remainingSec * 1000),
      percent: Math.round((1 - fraction) * 100),
      arrived: remaining < 50,
    };
  }, [route, current, cum]);

  useEffect(() => {
    if (current) mapRef.current?.animateCamera({ center: current, zoom: 16 }, { duration: 500 });
  }, [current]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {error && <ErrorBox message={error} />}

      <View
        accessible
        accessibilityLabel="Mapa de rastreio com sua posição atual"
        style={{ height: 320, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}
      >
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          showsUserLocation={!simulate}
          initialRegion={
            route
              ? { ...route.coords[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }
              : { latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.2, longitudeDelta: 0.2 }
          }
        >
          {route && <Polyline coordinates={route.coords} strokeWidth={6} strokeColor="#1D4ED8" />}
          {route && <Marker coordinate={route.coords[route.coords.length - 1]} title="Destino" />}
          {simulate && current && <Marker coordinate={current} title="Você (simulado)" pinColor="green" />}
        </MapView>
      </View>

      <Card style={{ gap: 6 }}>
        {!progress ? (
          <AppText muted>{simulate ? 'Iniciando simulação…' : 'Aguardando sinal de GPS…'}</AppText>
        ) : progress.arrived ? (
          <AppText size={22} weight="700" color={colors.success} accessibilityRole="alert">
            ✓ Você chegou ao destino!
          </AppText>
        ) : (
          <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`Faltam ${formatDuration(progress.remainingMin)}, ${formatDistance(progress.remainingM)}. Chegada prevista às ${formatTime(progress.eta)}.`}>
            <AppText size={13} muted weight="600">
              TEMPO RESTANTE
            </AppText>
            <AppText size={34} weight="700">
              {formatDuration(progress.remainingMin)}
            </AppText>
            <AppText>
              {formatDistance(progress.remainingM)} · chegada prevista às {formatTime(progress.eta)}
            </AppText>
            <AppText size={13} muted>
              {progress.percent}% do trajeto concluído
            </AppText>
          </View>
        )}
      </Card>

      <Button
        title={simulate ? 'Voltar ao GPS real' : 'Simular deslocamento (demo)'}
        icon={simulate ? 'locate' : 'play-circle'}
        variant="secondary"
        onPress={() => {
          setError(null);
          setSimulate((s) => !s);
        }}
      />
      <AppText size={12} muted>
        O rastreio funciona com o app aberto. O tempo restante é estimado pela distância que falta e não considera trânsito em tempo real.
      </AppText>
    </ScrollView>
  );
}
