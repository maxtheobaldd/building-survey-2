import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { aiConfigured, MAX_SCAN_PHOTOS, runScan, type ScanResult } from '@/lib/ai';
import { isAnswered, photosFor, propertyDescription } from '@/survey/engine';
import type { Answer, Answers, Inspection, PhotoOwner, Question } from '@/survey/types';
import { useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';
import { Button, Icon, T } from './ui';

/**
 * "Scan with AI": sends the latest photos plus the question list to the Convex action, fills any
 * unanswered (or previously AI-filled) questions, and hands defects/observations to the caller.
 * Answers the surveyor set by hand are never overwritten.
 */
export function ScanPanel({
  inspection,
  kind,
  subject,
  owner,
  questions,
  answers,
  setAnswer,
  observations,
  onObservations,
  onResult,
  scannedAt,
  warning,
}: {
  inspection: Inspection;
  kind: 'room' | 'element';
  subject: string;
  owner: PhotoOwner;
  questions: Question[];
  answers: Answers;
  setAnswer: (questionId: string, patch: Partial<Answer>) => void;
  observations: string;
  onObservations: (text: string) => void;
  onResult?: (r: ScanResult) => void;
  scannedAt?: number;
  warning?: string | null;
}) {
  const deviceId = useStore((s) => s.deviceId);
  const aiEnabled = useStore((s) => s.aiEnabled);
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle');
  const [error, setError] = useState('');
  const [filled, setFilled] = useState<number | null>(null);
  const photos = photosFor(inspection, owner);

  if (!aiEnabled || !aiConfigured) {
    return observations ? <Observations text={observations} onChange={onObservations} /> : null;
  }

  const scan = async () => {
    setState('running');
    setError('');
    setFilled(null);
    try {
      const context = [
        `${inspection.sector === 'commercial' ? 'Commercial' : 'Domestic'} property.`,
        propertyDescription(inspection),
      ]
        .filter(Boolean)
        .join(' ');
      const result = await runScan({
        deviceId,
        kind,
        subject,
        context,
        photoFiles: photos.map((p) => p.file),
        questions,
        sector: inspection.sector,
      });
      let n = 0;
      for (const a of result.answers) {
        const q = questions.find((x) => x.id === a.questionId);
        if (!q || !a.optionIds.length) continue;
        const existing = answers[q.id];
        if (isAnswered(existing) && !existing?.ai) continue;
        setAnswer(q.id, {
          value: q.type === 'multi' ? a.optionIds : a.optionIds[0],
          ai: { confidence: a.confidence, reason: a.reason },
        });
        n += 1;
      }
      setFilled(n);
      onObservations(result.observations);
      onResult?.(result);
      setState('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Icon name="sparkles" size={15} color={C.white} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="heading">AI photo scan</T>
          <T v="small">
            {photos.length
              ? `Describes ${kind === 'room' ? 'ceiling, walls, floor, features and defects' : 'the element and its condition'} from the latest ${Math.min(photos.length, MAX_SCAN_PHOTOS)} photo${photos.length === 1 ? '' : 's'} and pre-fills answers for you to confirm.`
              : 'Add photos above, then scan to pre-fill the answers below.'}
          </T>
        </View>
      </View>
      <Button
        title={state === 'running' ? 'Scanning photos…' : scannedAt ? 'Scan again' : 'Scan photos'}
        icon="sparkles"
        kind="ai"
        loading={state === 'running'}
        disabled={!photos.length}
        onPress={scan}
        style={{ marginTop: S.md }}
      />
      {state === 'error' ? (
        <View style={[styles.msg, { backgroundColor: '#FBE6DB' }]}>
          <Icon name="exclamationmark.triangle" size={14} color="#A1421A" />
          <T v="small" style={{ color: '#A1421A', flex: 1 }}>{error}</T>
        </View>
      ) : null}
      {warning ? (
        <View style={[styles.msg, { backgroundColor: '#FBF0D9' }]}>
          <Icon name="eye.trianglebadge.exclamationmark" size={14} color="#8A5A00" />
          <T v="small" style={{ color: '#8A5A00', flex: 1 }}>{warning}</T>
        </View>
      ) : null}
      {filled !== null ? (
        <T v="small" style={{ marginTop: S.sm, color: C.ai }}>
          {filled
            ? `Pre-filled ${filled} answer${filled === 1 ? '' : 's'} — check each one marked ✦ below.`
            : 'No answers could be pre-filled from these photos.'}
        </T>
      ) : null}
      {observations ? <Observations text={observations} onChange={onObservations} /> : null}
    </View>
  );
}

function Observations({ text, onChange }: { text: string; onChange: (t: string) => void }) {
  return (
    <View style={{ marginTop: S.md }}>
      <T v="eyebrow" style={{ marginBottom: 6 }}>Observations (editable, goes in the report)</T>
      <TextInput
        key={text.slice(0, 40)}
        defaultValue={text}
        onChangeText={onChange}
        multiline
        style={styles.obs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.aiTint,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: '#D8D0F6',
  },
  head: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msg: { flexDirection: 'row', gap: 6, marginTop: S.md, padding: S.sm, borderRadius: R.sm },
  obs: {
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: 12,
    minHeight: 90,
    fontFamily: F.body,
    fontSize: 14.5,
    lineHeight: 20,
    color: C.ink,
    textAlignVertical: 'top',
  },
});

