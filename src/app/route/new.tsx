import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { PlaceSearch } from '@/components/PlaceSearch';
import { AppText, Button, Chip, ErrorBox } from '@/components/ui';
import { DAY_LABELS } from '@/core/format';
import { getRepository } from '@/data';
import { useTheme } from '@/theme/ThemeContext';
import { Place } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

export default function NewRoutine() {
  const router = useRouter();
  const { colors, scale } = useTheme();
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [minutes, setMinutes] = useState(6 * 60); // 06:00
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shift = (delta: number) => setMinutes((m) => (m + delta + 1440) % 1440);
  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

  async function save() {
    if (!name.trim()) return setError('Dê um nome para a rota (ex.: Trabalho).');
    if (!origin || !destination) return setError('Escolha origem e destino na lista de sugestões.');
    if (days.length === 0) return setError('Selecione pelo menos um dia da semana.');
    setSaving(true);
    setError(null);
    try {
      const repo = await getRepository();
      await repo.saveRoutine({
        name: name.trim(),
        originLabel: origin.label,
        destinationLabel: destination.label,
        origin: origin.coord,
        destination: destination.coord,
        departureTime: time,
        days: [...days].sort(),
        createdAt: Date.now(),
      });
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Não foi possível salvar.');
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 8 }}>
        <AppText weight="600">Nome da rota</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Trabalho', 'Faculdade'].map((n) => (
            <Chip key={n} label={n} selected={name === n} onPress={() => setName(n)} />
          ))}
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ou digite outro nome"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Nome da rota"
          style={{ minHeight: 52, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, color: colors.text, fontSize: 16 * scale }}
        />
      </View>

      <PlaceSearch label="De onde você sai?" value={origin} onChange={setOrigin} allowCurrentLocation />
      <PlaceSearch label="Para onde você vai?" value={destination} onChange={setDestination} />

      <View style={{ gap: 8 }}>
        <AppText weight="600">Horário de saída</AppText>
        <AppText
          size={40}
          weight="700"
          style={{ textAlign: 'center' }}
          accessibilityLabel={`Horário de saída: ${pad(Math.floor(minutes / 60))} horas e ${pad(minutes % 60)} minutos`}
        >
          {time}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="− 1 h" variant="secondary" style={{ flex: 1 }} onPress={() => shift(-60)} />
          <Button title="− 5 min" variant="secondary" style={{ flex: 1 }} onPress={() => shift(-5)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="+ 5 min" variant="secondary" style={{ flex: 1 }} onPress={() => shift(5)} />
          <Button title="+ 1 h" variant="secondary" style={{ flex: 1 }} onPress={() => shift(60)} />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <AppText weight="600">Dias da semana</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DAY_LABELS.map((l, d) => (
            <Chip key={l} label={l} selected={days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </View>
      </View>

      {error && <ErrorBox message={error} />}
      <Button title="Salvar rota" icon="save" onPress={save} loading={saving} />
    </ScrollView>
  );
}
