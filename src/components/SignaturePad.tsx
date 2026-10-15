/* eslint-disable react-hooks/refs -- PanResponder handlers read refs only inside touch events, never during render. */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C, R } from '@/theme/tokens';
import { Button, T } from './ui';

/** Signature captured as SVG path data in a fixed 300×120 coordinate box (scaled to the pad width). */
export const SIG_W = 300;
export const SIG_H = 120;

export function SignaturePad({
  value,
  onChange,
  onActive,
}: {
  value?: string;
  onChange: (path: string | undefined) => void;
  /** Called with true while the finger is down so the parent can stop scrolling. */
  onActive?: (active: boolean) => void;
}) {
  const [path, setPath] = useState(value ?? '');
  const width = useRef(SIG_W);
  const current = useRef(path);
  const callbacks = useRef({ onChange, onActive });

  useEffect(() => {
    callbacks.current = { onChange, onActive };
  }, [onChange, onActive]);

  // Created once; handlers only touch refs inside events, never during render.
  const [responder] = useState(() => {
    const point = (x: number, y: number) => {
      const k = SIG_W / width.current;
      return `${(x * k).toFixed(1)} ${(y * k).toFixed(1)}`;
    };
    const append = (cmd: 'M' | 'L', x: number, y: number) => {
      current.current = `${current.current} ${cmd} ${point(x, y)}`;
      setPath(current.current);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        callbacks.current.onActive?.(true);
        append('M', e.nativeEvent.locationX, e.nativeEvent.locationY);
      },
      onPanResponderMove: (e) => append('L', e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderRelease: () => {
        callbacks.current.onActive?.(false);
        callbacks.current.onChange(current.current.trim() || undefined);
      },
      onPanResponderTerminate: () => callbacks.current.onActive?.(false),
    });
  });

  const onLayout = (e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width;
  };

  return (
    <View>
      <View style={styles.pad} onLayout={onLayout} {...responder.panHandlers}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${SIG_W} ${SIG_H}`} pointerEvents="none">
          <Path d={path || 'M 0 0'} stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        {!path ? (
          <View style={styles.hint} pointerEvents="none">
            <T v="small">Sign here</T>
          </View>
        ) : null}
        <View style={styles.line} pointerEvents="none" />
      </View>
      {path ? (
        <Button
          title="Clear signature"
          kind="ghost"
          small
          style={{ alignSelf: 'flex-start' }}
          onPress={() => {
            current.current = '';
            setPath('');
            onChange(undefined);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    aspectRatio: SIG_W / SIG_H,
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.lineStrong,
    overflow: 'hidden',
  },
  hint: { position: 'absolute', left: 14, top: 10 },
  line: { position: 'absolute', left: 20, right: 20, bottom: 28, height: 1, backgroundColor: C.line },
});
