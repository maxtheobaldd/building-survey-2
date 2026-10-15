import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, Header, Icon, Row, Screen, SectionTitle, T, tap } from '@/components/ui';
import { ASSESSMENT, EXTERNAL, INTERNAL, ROOF, ROOM_QUESTIONS } from '@/survey/schema';
import type { Group, Question } from '@/survey/types';
import { C, F, R, S, TONE } from '@/theme/tokens';

const ROOM_GROUP: Group = { id: 'room', title: 'Every room (Gold)', subject: 'room', icon: 'square.split.bottomrightquarter', questions: ROOM_QUESTIONS };

const SETS: { id: string; label: string; groups: Group[] }[] = [
  { id: 'roof', label: 'Bronze roof', groups: [ROOF] },
  { id: 'external', label: 'Silver external', groups: EXTERNAL },
  { id: 'internal', label: 'Gold internal', groups: [ROOM_GROUP, ...INTERNAL] },
  { id: 'assessment', label: 'Assessment', groups: [ASSESSMENT] },
];

/** Read-only browser of the wording behind every answer — for the client to review and replace. */
export default function Library() {
  const [set, setSet] = useState('roof');
  const [open, setOpen] = useState<string | null>(null);
  const groups = SETS.find((s) => s.id === set)!.groups;

  return (
    <Screen header={<Header eyebrow="Settings" title="Wording library" />}>
      <T v="small">
        The jargon behind every Yes / No / condition answer. Edit in <Text style={{ fontFamily: 'Menlo' }}>src/survey/schema.ts</Text>.
      </T>
      <Row gap={6} style={{ flexWrap: 'wrap', marginTop: S.md }}>
        {SETS.map((s) => (
          <Chip key={s.id} label={s.label} selected={set === s.id} onPress={() => setSet(s.id)} />
        ))}
      </Row>
      {groups.map((g) => (
        <View key={g.id}>
          <SectionTitle>{g.title}</SectionTitle>
          {g.elementWording ? <Text style={styles.element}>{g.elementWording}</Text> : null}
          {g.questions.map((q) => (
            <QuestionWording
              key={q.id}
              q={q}
              subject={g.subject}
              open={open === `${g.id}.${q.id}`}
              onToggle={() => setOpen(open === `${g.id}.${q.id}` ? null : `${g.id}.${q.id}`)}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function QuestionWording({ q, subject, open, onToggle }: { q: Question; subject: string; open: boolean; onToggle: () => void }) {
  const opts = (q.options ?? []).filter((o) => o.wording || o.phrase || o.finding);
  return (
    <Pressable
      onPress={() => {
        tap();
        onToggle();
      }}
      style={styles.q}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="heading" style={{ flex: 1 }}>{q.prompt ?? q.label}</T>
        <Icon name={open ? 'chevron.up' : 'chevron.down'} size={12} color={C.faint} />
      </Row>
      {open
        ? opts.map((o) => {
            const t = TONE[o.tone ?? 'neutral'];
            return (
              <View key={o.id} style={[styles.opt, { borderLeftColor: t.dot }]}>
                <Text style={[styles.optLabel, { color: t.fg }]}>{o.label}</Text>
                {o.phrase ? <Text style={styles.text}>“…{o.phrase}…”</Text> : null}
                {o.wording ? <Text style={styles.text}>{o.wording.replaceAll('{subject}', subject)}</Text> : null}
                {o.finding ? (
                  <Text style={styles.finding}>
                    Schedule (priority {o.finding.priority}{o.finding.storm ? ', storm' : ''}): {o.finding.text}
                  </Text>
                ) : null}
              </View>
            );
          })
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  element: { fontFamily: F.displayItalic, fontSize: 13.5, lineHeight: 19, color: C.ink2, marginBottom: S.sm },
  q: {
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  opt: { marginTop: S.sm, paddingLeft: S.sm, borderLeftWidth: 3 },
  optLabel: { fontFamily: F.bold, fontSize: 12.5 },
  text: { fontFamily: F.displayItalic, fontSize: 13.5, lineHeight: 19, color: C.ink, marginTop: 2 },
  finding: { fontFamily: F.medium, fontSize: 12, color: C.muted, marginTop: 3 },
});
