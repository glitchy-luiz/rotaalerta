import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { INCIDENT_META, Analysis } from '../core/analysis';
import { formatDuration, formatTime } from '../core/format';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from './ui';

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ marginTop: 8 }}>
      <AppText size={13} muted weight="600">
        {label}
      </AppText>
      <AppText weight="600" color={color}>
        {value}
      </AppText>
    </View>
  );
}

/** Alerta principal. Usa ícone + texto (não depende só de cor) e tem rótulo completo para leitores de tela. */
export function AlertCard({ analysis }: { analysis: Analysis }) {
  const { colors } = useTheme();

  if (analysis.status === 'clear') {
    return (
      <View
        accessible
        accessibilityLabel={analysis.message}
        style={{ borderWidth: 2, borderColor: colors.success, backgroundColor: colors.successBg, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12 }}
      >
        <Ionicons name="checkmark-circle" size={30} color={colors.success} />
        <View style={{ flex: 1 }}>
          <AppText weight="700" color={colors.success}>
            Rota livre
          </AppText>
          <AppText>{analysis.message}</AppText>
        </View>
      </View>
    );
  }

  const inc = analysis.mainIncident!;
  const alt = analysis.alternative;
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Atenção. ${analysis.message}`}
      style={{ borderWidth: 2, borderColor: colors.danger, backgroundColor: colors.dangerBg, borderRadius: 16, padding: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="warning" size={30} color={colors.danger} />
        <AppText size={18} weight="700" color={colors.danger}>
          Problema na sua rota
        </AppText>
      </View>

      <Row label="PROBLEMA" value={`${inc.title} — ${inc.street}`} />
      <Row label="ATRASO ESTIMADO" value={`+ ${formatDuration(analysis.delayMin)}`} color={colors.danger} />
      <Row
        label="SE SAIR NO HORÁRIO PADRÃO"
        value={`Saída ${formatTime(analysis.departure)} → chegada ${formatTime(analysis.delayedArrival)}`}
      />

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

      {alt ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="git-branch" size={22} color={colors.success} />
            <AppText weight="700" color={colors.success}>
              Rota alternativa sugerida
            </AppText>
          </View>
          <Row label="CAMINHO" value={`Pela ${alt.viaStreet}`} />
          <Row label="TEMPO TOTAL" value={formatDuration(alt.durationMin)} />
          <Row
            label="CHEGADA"
            value={`${formatTime(alt.arrival)} (economiza ${formatDuration(alt.savingMin)})`}
            color={colors.success}
          />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Ionicons name="time" size={22} color={colors.text} />
          <AppText style={{ flex: 1 }}>
            Sem alternativa melhor. Saia {formatDuration(analysis.delayMin)} mais cedo (às{' '}
            {formatTime(new Date(analysis.departure.getTime() - analysis.delayMin * 60000))}) para chegar às{' '}
            {formatTime(analysis.baseArrival)}.
          </AppText>
        </View>
      )}
      <AppText size={12} muted style={{ marginTop: 10 }}>
        Tipo: {INCIDENT_META[inc.type].label} · incidente simulado
      </AppText>
    </View>
  );
}
