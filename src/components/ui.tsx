import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextInput, TextInputProps, TextProps, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function AppText({
  size = 16,
  weight = '400',
  muted,
  color,
  style,
  ...rest
}: TextProps & { size?: number; weight?: '400' | '600' | '700'; muted?: boolean; color?: string }) {
  const { colors, scale } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: size * scale,
          lineHeight: size * scale * 1.35,
          fontWeight: weight,
          color: color ?? (muted ? colors.muted : colors.text),
        },
        style,
      ]}
    />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  hint,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primary : 'transparent';
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
  const border = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[
        {
          minHeight: 52,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: bg,
          borderWidth: 2,
          borderColor: border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={22} color={fg} /> : null}
      <AppText weight="600" color={fg}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        minHeight: 48,
        minWidth: 48,
        paddingHorizontal: 14,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : 'transparent',
      }}
    >
      {selected ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} /> : icon ? <Ionicons name={icon} size={18} color={colors.text} /> : null}
      <AppText weight="600" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ErrorBox({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.danger,
        backgroundColor: colors.dangerBg,
      }}
    >
      <Ionicons name="alert-circle" size={22} color={colors.danger} />
      <AppText style={{ flex: 1 }} color={colors.danger}>
        {message}
      </AppText>
    </View>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  const { colors, scale } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText weight="600">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...input}
        style={{
          minHeight: 52,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          color: colors.text,
          fontSize: 16 * scale,
        }}
      />
    </View>
  );
}
