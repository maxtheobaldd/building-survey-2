import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { optionsFor, questionWording } from '@/survey/engine';
import type { Answer, Question, Sector } from '@/survey/types';
import { C, F, R, S, TONE } from '@/theme/tokens';
import { Chip, Icon, NumberField, T, tap } from './ui';

export function QuestionCard({
  question: q,
  answer,
  onChange,
  subject,
  sector,
  suggestion,
  hideWording,
}: {
  question: Question;
  answer: Answer | undefined;
  onChange: (patch: Partial<Answer> | null) => void;
  subject: string;
  sector: Sector;
  /** Engine suggestion shown as a one-tap chip (e.g. derived from other answers). */
  suggestion?: { optionId: string; why: string };
  hideWording?: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(!!answer?.note);
  const options = optionsFor(q, sector);
  const value = answer?.value ?? null;
  const wording = questionWording(q, answer, subject);
  const ai = answer?.ai;

  const setValue = (v: Answer['value']) => onChange({ value: v, ai: undefined });

  const isSelected = (id: string) => (Array.isArray(value) ? value.includes(id) : value === id);

  const toggle = (id: string) => {
    if (q.type === 'multi') {
      const arr = Array.isArray(value) ? value : [];
      setValue(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    } else {
      setValue(value === id ? null : id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <T v="eyebrow" style={{ color: C.brand }}>{q.label}</T>
          {q.prompt ? <T v="heading" style={{ marginTop: 3 }}>{q.prompt}</T> : null}
        </View>
        <Pressable
          hitSlop={10}
          accessibilityLabel={noteOpen ? 'Hide note' : 'Add note'}
          onPress={() => {
            tap();
            setNoteOpen((o) => !o);
          }}
          style={[styles.noteBtn, (noteOpen || answer?.note) && { backgroundColor: C.brandTint }]}>
          <Icon name={answer?.note ? 'note.text' : 'square.and.pencil'} size={15} color={C.brand} />
        </Pressable>
      </View>
      {q.help ? <T v="small" style={{ marginTop: 4 }}>{q.help}</T> : null}

      <View style={{ marginTop: q.prompt || q.help ? S.md : 2 }}>
        {q.type === 'yesno' ? (
          <View style={styles.segment}>
            {options.map((o) => {
              const sel = isSelected(o.id);
              const tone = sel ? TONE[o.tone && o.tone !== 'neutral' ? o.tone : 'neutral'] : undefined;
              return (
                <Pressable
                  key={o.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  onPress={() => {
                    tap();
                    toggle(o.id);
                  }}
                  style={[
                    styles.segBtn,
                    sel && { backgroundColor: o.tone && o.tone !== 'neutral' ? tone!.bg : C.ink, borderColor: o.tone && o.tone !== 'neutral' ? tone!.dot : C.ink },
                  ]}>
                  <Text
                    style={[
                      styles.segText,
                      sel && { color: o.tone && o.tone !== 'neutral' ? tone!.fg : C.white },
                    ]}>
                    {o.label}
                  </Text>
                  {sel && ai ? <Icon name="sparkles" size={12} color={o.tone && o.tone !== 'neutral' ? tone!.fg : C.white} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : q.type === 'number' ? (
          <View style={{ flexDirection: 'row' }}>
            <NumberField
              label=""
              value={typeof value === 'number' ? value : undefined}
              unit={q.unit}
              placeholder={q.placeholder}
              onChange={(n) => setValue(n ?? null)}
              style={{ maxWidth: 200 }}
            />
          </View>
        ) : q.type === 'text' ? (
          <TextInput
            defaultValue={typeof value === 'string' ? value : ''}
            onChangeText={(t) => setValue(t)}
            placeholder={q.placeholder}
            placeholderTextColor={C.faint}
            style={styles.input}
          />
        ) : (
          <View style={styles.chips}>
            {options.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                tone={q.type === 'condition' || q.id === 'condition' ? o.tone : undefined}
                selected={isSelected(o.id)}
                ai={!!ai}
                onPress={() => toggle(o.id)}
              />
            ))}
          </View>
        )}
      </View>

      {suggestion && value === null ? (
        <Pressable
          onPress={() => {
            tap();
            setValue(suggestion.optionId);
          }}
          style={styles.suggest}>
          <Icon name="wand.and.stars" size={14} color={C.brand} />
          <T v="small" style={{ color: C.brand, flex: 1 }}>
            Suggested: <Text style={{ fontFamily: F.semibold }}>{options.find((o) => o.id === suggestion.optionId)?.label}</Text> — {suggestion.why}
          </T>
        </Pressable>
      ) : null}

      {ai ? (
        <View style={styles.aiBox}>
          <Icon name="sparkles" size={13} color={C.ai} />
          <T v="small" style={{ color: C.ai, flex: 1 }}>
            <Text style={{ fontFamily: F.semibold }}>AI suggested · {ai.confidence} confidence.</Text> {ai.reason}
          </T>
        </View>
      ) : null}

      {wording && !hideWording ? (
        <View style={styles.wording}>
          <T v="eyebrow" style={{ fontSize: 9.5, color: C.brandDeep }}>Report wording</T>
          <Text style={styles.wordingText}>{wording}</Text>
        </View>
      ) : null}

      {noteOpen ? (
        <TextInput
          defaultValue={answer?.note ?? ''}
          onChangeText={(t) => onChange({ note: t })}
          placeholder="Inspector note (added to the report)"
          placeholderTextColor={C.faint}
          multiline
          style={[styles.input, { marginTop: S.md, minHeight: 64 }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md },
  noteBtn: {
    width: 30,
    height: 30,
    marginTop: -6,
    marginRight: -6,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', gap: S.sm },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: { fontFamily: F.semibold, fontSize: 16, color: C.ink2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  input: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: F.body,
    fontSize: 15,
    color: C.ink,
  },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: S.md,
    padding: S.sm,
    borderRadius: R.sm,
    backgroundColor: C.brandTint,
  },
  aiBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: S.md,
    padding: S.sm,
    borderRadius: R.sm,
    backgroundColor: C.aiTint,
  },
  wording: {
    marginTop: S.md,
    paddingLeft: S.md,
    paddingVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
  },
  wordingText: {
    fontFamily: F.displayItalic,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink2,
    marginTop: 3,
  },
});
