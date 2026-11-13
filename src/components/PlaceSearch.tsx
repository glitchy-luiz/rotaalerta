import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { searchPlaces } from '../services/openRouteService';
import { useTheme } from '../theme/ThemeContext';
import { Place } from '../types';
import { AppText, Button } from './ui';

export function PlaceSearch({
  label,
  value,
  onChange,
  allowCurrentLocation,
}: {
  label: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  allowCurrentLocation?: boolean;
}) {
  const { colors, scale } = useTheme();
  const [text, setText] = useState(value?.label ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onType(t: string) {
    setText(t);
    onChange(null);
    setErr(null);
    if (timer.current) clearTimeout(timer.current);
    if (t.trim().length < 3) {
      setResults([]);
      return;
    }
    // debounce: respeita limites de requisições da API
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchPlaces(t.trim()));
      } catch (e: any) {
        setErr(e.message ?? 'Erro na busca.');
      } finally {
        setLoading(false);
      }
    }, 700);
  }

  function pick(p: Place) {
    setText(p.label);
    setResults([]);
    onChange(p);
  }

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErr('Permissão de localização negada.');
      return;
    }
    const l = await Location.getCurrentPositionAsync({});
    pick({ label: 'Minha localização atual', coord: { latitude: l.coords.latitude, longitude: l.coords.longitude } });
  }

  return (
    <View style={{ gap: 8 }}>
      <AppText weight="600">{label}</AppText>
      <TextInput
        value={text}
        onChangeText={onType}
        placeholder="Digite o endereço (mín. 3 letras)"
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        accessibilityHint="Digite um endereço e escolha uma das sugestões"
        style={{
          minHeight: 52,
          borderWidth: 2,
          borderColor: value ? colors.success : colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          color: colors.text,
          fontSize: 16 * scale,
        }}
      />
      {loading && <ActivityIndicator accessibilityLabel="Buscando endereços" />}
      {err && <AppText color={colors.danger}>{err}</AppText>}
      {results.map((p, i) => (
        <Pressable
          key={`${p.label}-${i}`}
          onPress={() => pick(p)}
          accessibilityRole="button"
          accessibilityLabel={`Selecionar ${p.label}`}
          style={{ minHeight: 48, justifyContent: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
        >
          <AppText>{p.label}</AppText>
        </Pressable>
      ))}
      {value && <AppText color={colors.success}>✓ Endereço selecionado</AppText>}
      {allowCurrentLocation && <Button title="Usar minha localização" icon="locate" variant="secondary" onPress={useMyLocation} />}
    </View>
  );
}
