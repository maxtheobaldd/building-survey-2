import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { Button, Card, Field, Header, Icon, Pill, Row, Screen, SectionTitle, T } from '@/components/ui';
import { aiConfigured, aiHealth } from '@/lib/ai';
import { sampleInspection } from '@/survey/sample';
import { useStore } from '@/store/inspections';
import { C, S } from '@/theme/tokens';

export default function Settings() {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const aiEnabled = useStore((s) => s.aiEnabled);
  const setAiEnabled = useStore((s) => s.setAiEnabled);
  const importInspection = useStore((s) => s.importInspection);
  const counter = useStore((s) => s.counter);
  const [health, setHealth] = useState<'checking' | 'ok' | 'down'>(aiConfigured ? 'checking' : 'down');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (!aiConfigured) return;
    aiHealth().then((h) => {
      setHealth(h?.ok ? 'ok' : 'down');
      setModel(h?.model ?? '');
    });
  }, []);

  const addSample = () => {
    const id = randomUUID();
    const d = new Date();
    const ref = `HM-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${String(counter + 1).padStart(4, '0')}`;
    importInspection(sampleInspection(id, ref, profile.name || 'Sample Inspector'));
    router.dismissTo({ pathname: '/inspection/[id]', params: { id } });
  };

  return (
    <Screen header={<Header eyebrow="Settings" title="Inspector & app" />}>
      <SectionTitle>Inspector profile</SectionTitle>
      <T v="small" style={{ marginBottom: S.md }}>Pre-fills new inspections and the report sign-off.</T>
      <Field label="Name" defaultValue={profile.name} onChangeText={(t) => updateProfile({ name: t })} autoCapitalize="words" />
      <Field
        label="Qualifications"
        defaultValue={profile.qualifications}
        onChangeText={(t) => updateProfile({ qualifications: t })}
        placeholder="e.g. MRICS, MCIOB"
      />
      <Field label="Company" defaultValue={profile.company} onChangeText={(t) => updateProfile({ company: t })} />
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Field label="Phone" defaultValue={profile.phone} onChangeText={(t) => updateProfile({ phone: t })} keyboardType="phone-pad" />
        </View>
        <View style={{ flex: 1.4 }}>
          <Field
            label="Email"
            defaultValue={profile.email}
            onChangeText={(t) => updateProfile({ email: t })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </Row>

      <SectionTitle>AI photo scan</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T v="heading">Scan photos with AI</T>
            <T v="small">Describes rooms and elements from photos and pre-fills answers for you to confirm.</T>
          </View>
          <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ true: C.ai }} />
        </Row>
        <Row style={{ marginTop: S.md }} gap={S.sm}>
          {health === 'checking' ? (
            <Pill label="Checking connection…" />
          ) : health === 'ok' ? (
            <Pill label="Connected" tone="good" icon="checkmark" />
          ) : (
            <Pill label={aiConfigured ? 'Unreachable — offline?' : 'Not configured'} tone="poor" />
          )}
          {model ? <T v="mono">{model}</T> : null}
        </Row>
      </Card>

      <SectionTitle>Wording</SectionTitle>
      <Card onPress={() => router.push('/library')}>
        <Row gap={S.md}>
          <Icon name="text.book.closed" size={20} color={C.brand} />
          <View style={{ flex: 1 }}>
            <T v="heading">Wording library</T>
            <T v="small">Every question and the report wording behind each answer.</T>
          </View>
          <Icon name="chevron.right" size={13} color={C.faint} />
        </Row>
      </Card>

      <SectionTitle>Demo</SectionTitle>
      <Button title="Add a sample Gold inspection" icon="wand.and.stars" kind="secondary" onPress={addSample} />
      <T v="small" style={{ marginTop: S.sm }}>
        A part-completed semi-detached house in Leeds with rooms, findings and an outbuilding — useful to see the report.
      </T>
    </Screen>
  );
}
