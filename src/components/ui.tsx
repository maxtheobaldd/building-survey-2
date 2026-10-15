import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, R, S, SHADOW, TONE } from '@/theme/tokens';
import type { Tone } from '@/survey/types';

export const tap = () => Haptics.selectionAsync().catch(() => {});

// ─── Text ───────────────────────────────────────────────────────────────────

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label' | 'eyebrow' | 'mono';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: F.display, fontSize: 32, lineHeight: 36, color: C.ink, letterSpacing: -0.5 },
  title: { fontFamily: F.display, fontSize: 24, lineHeight: 29, color: C.ink, letterSpacing: -0.3 },
  heading: { fontFamily: F.semibold, fontSize: 16, lineHeight: 21, color: C.ink },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink2 },
  small: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.muted },
  label: { fontFamily: F.semibold, fontSize: 13, lineHeight: 17, color: C.ink2 },
  eyebrow: {
    fontFamily: F.bold,
    fontSize: 11,
    lineHeight: 14,
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mono: { fontFamily: 'Menlo', fontSize: 12, lineHeight: 16, color: C.muted },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[variants[v], style]} />;
}

// ─── Icon ───────────────────────────────────────────────────────────────────

export function Icon({
  name,
  size = 20,
  color = C.ink,
  weight = 'medium',
}: {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
}) {
  return (
    <SymbolView
      name={name as SymbolViewProps['name']}
      size={size}
      tintColor={color}
      weight={weight}
      style={{ width: size, height: size }}
    />
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  scrollEnabled = true,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  scrollEnabled?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      {header}
      {scroll ? (
        <ScrollView
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.content,
            { paddingBottom: footer ? S.xl : 40 + insets.bottom },
            contentStyle,
          ]}>
          <View style={styles.maxWidth}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>
          <View style={styles.maxWidth}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function Header({
  eyebrow,
  title,
  back = true,
  right,
  modal,
  children,
}: {
  eyebrow?: string;
  title: string;
  back?: boolean;
  right?: ReactNode;
  /** Inside a sheet: no status-bar inset, close (×) instead of back. */
  modal?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: modal ? S.lg : insets.top + S.sm }]}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={modal ? 'Close' : 'Back'}
              hitSlop={12}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.backBtn}>
              <Icon name={modal ? 'xmark' : 'chevron.left'} size={modal ? 15 : 18} color={C.ink} weight="semibold" />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }} />
          {right}
        </View>
        {eyebrow ? (
          <T v="eyebrow" style={{ marginTop: S.md }} numberOfLines={1}>
            {eyebrow}
          </T>
        ) : null}
        <T v="title" style={{ marginTop: 2 }}>
          {title}
        </T>
        {children}
      </View>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          tap();
          onPress();
        }}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, gap = S.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <Row style={{ marginTop: S.xl, marginBottom: S.sm, justifyContent: 'space-between' }}>
      <T v="eyebrow">{children}</T>
      {right}
    </Row>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: C.ink, fg: C.white },
    secondary: { bg: C.card, fg: C.ink, border: C.lineStrong },
    ghost: { bg: 'transparent', fg: C.brand },
    danger: { bg: C.card, fg: C.danger, border: '#EBC4C1' },
    ai: { bg: C.ai, fg: C.white },
  };
  const p = palette[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'ghost' && { paddingHorizontal: S.sm },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : icon ? (
        <Icon name={icon} size={small ? 14 : 16} color={p.fg} weight="semibold" />
      ) : null}
      <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: p.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  label,
  color = C.ink,
  bg = C.card,
}: {
  name: string;
  onPress: () => void;
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={name} size={17} color={color} weight="semibold" />
    </Pressable>
  );
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  style,
  multiline,
  ...input
}: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={[{ marginBottom: S.md }, style as StyleProp<ViewStyle>]}>
      {label ? <T v="label" style={{ marginBottom: 6 }}>{label}</T> : null}
      <TextInput
        placeholderTextColor={C.faint}
        multiline={multiline}
        clearButtonMode={multiline ? 'never' : 'while-editing'}
        {...input}
        style={[styles.input, multiline && { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' }]}
      />
      {hint ? <T v="small" style={{ marginTop: 4 }}>{hint}</T> : null}
    </View>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  style,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  unit?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flex: 1 }, style]}>
      {label ? <T v="label" style={{ marginBottom: 6 }}>{label}</T> : null}
      <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
        <TextInput
          keyboardType="decimal-pad"
          placeholder={placeholder ?? '0.0'}
          placeholderTextColor={C.faint}
          defaultValue={value === undefined ? '' : String(value)}
          onChangeText={(t) => {
            const n = parseFloat(t.replace(',', '.'));
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          style={{ flex: 1, fontFamily: F.medium, fontSize: 16, color: C.ink, paddingVertical: 12 }}
        />
        {unit ? <T v="small">{unit}</T> : null}
      </View>
    </View>
  );
}

// ─── Chips & pills ──────────────────────────────────────────────────────────

export function Chip({
  label,
  selected,
  onPress,
  tone,
  ai,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: Tone;
  ai?: boolean;
}) {
  const t = tone && tone !== 'neutral' ? TONE[tone] : undefined;
  const bg = selected ? (t ? t.bg : C.ink) : C.card;
  const fg = selected ? (t ? t.fg : C.white) : C.ink2;
  const border = selected ? (t ? t.dot : C.ink) : C.line;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 }]}>
      {selected && t ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
      {ai && selected ? <Icon name="sparkles" size={12} color={t ? t.fg : C.white} /> : null}
    </Pressable>
  );
}

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: string }) {
  const t = TONE[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={11} color={t.fg} weight="bold" /> : <View style={[styles.dot, { backgroundColor: t.dot }]} />}
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: C.lineStrong }, style]} />;
}

export function Empty({ icon, title, body, action }: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={26} color={C.brand} />
      </View>
      <T v="heading" style={{ textAlign: 'center' }}>{title}</T>
      <T v="small" style={{ textAlign: 'center', marginTop: 4, maxWidth: 300 }}>{body}</T>
      {action ? <View style={{ marginTop: S.lg }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: S.lg, paddingTop: S.lg },
  maxWidth: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: {
    backgroundColor: C.paper,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.lineStrong,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36, gap: S.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.lineStrong,
  },
  footer: {
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    backgroundColor: C.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.lineStrong,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    ...SHADOW,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    minHeight: 50,
    paddingHorizontal: S.xl,
    borderRadius: R.md,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: S.md, borderRadius: R.sm },
  buttonText: { fontFamily: F.semibold, fontSize: 15.5 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.lineStrong,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.medium,
    fontSize: 16,
    color: C.ink,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: R.pill,
    borderWidth: 1,
  },
  chipText: { fontFamily: F.semibold, fontSize: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  pillText: { fontFamily: F.semibold, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: S.xxl, paddingHorizontal: S.lg },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
});
