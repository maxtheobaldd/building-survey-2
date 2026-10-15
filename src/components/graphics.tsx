import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { TIERS } from '@/survey/schema';
import type { Tier } from '@/survey/types';
import { C, F } from '@/theme/tokens';

/** Metallic tier medallion: gradient disc, tick ring like an MOT gauge, roof glyph, initial. */
export function TierMedallion({ tier, size = 56 }: { tier: Tier; size?: number }) {
  const [hi, mid, lo] = TIERS[tier].colors;
  const ticks = Array.from({ length: 24 }, (_, i) => i);
  const id = `m-${tier}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`${id}-face`} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={hi} />
            <Stop offset="0.55" stopColor={mid} />
            <Stop offset="1" stopColor={lo} />
          </LinearGradient>
          <LinearGradient id={`${id}-rim`} x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={hi} />
            <Stop offset="1" stopColor={lo} />
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="48" fill={`url(#${id}-rim)`} />
        <Circle cx="50" cy="50" r="41" fill={`url(#${id}-face)`} />
        <G>
          {ticks.map((i) => {
            const a = (i / 24) * Math.PI * 2;
            const r1 = 44;
            const r2 = i % 2 ? 46 : 47.2;
            return (
              <Line
                key={i}
                x1={50 + Math.cos(a) * r1}
                y1={50 + Math.sin(a) * r1}
                x2={50 + Math.cos(a) * r2}
                y2={50 + Math.sin(a) * r2}
                stroke={lo}
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
        </G>
        <Path
          d="M30 52 L50 34 L70 52"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="50" cy="50" r="41" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: size * 0.52,
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontFamily: F.displayBold,
            fontSize: size * 0.24,
            lineHeight: size * 0.28,
            color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.25)',
            textShadowRadius: 2,
            textShadowOffset: { width: 0, height: 1 },
          }}>
          {TIERS[tier].name[0]}
        </Text>
      </View>
    </View>
  );
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  color = C.brand,
  track = C.line,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={v >= 1 ? '#2F8F57' : color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - v)}
          strokeLinecap="round"
        />
      </Svg>
      {label !== undefined ? (
        <Text style={{ fontFamily: F.bold, fontSize: size * 0.26, color: C.ink }}>{label}</Text>
      ) : null}
    </View>
  );
}

/** Thin segmented bar used on cards. */
export function ProgressBar({ value, color = C.brand }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: C.line, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: v >= 1 ? '#2F8F57' : color }} />
    </View>
  );
}
