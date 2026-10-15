import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { parseInstruction } from '@/lib/parseInstruction';
import type { Instruction } from '@/survey/types';
import { C, F, R, S } from '@/theme/tokens';
import { Button, Field, Icon, Row, SectionTitle, T } from './ui';

/** Claim/policy/policyholder/address fields, shared by "New inspection" and the details screen. */
export function InstructionForm({
  value,
  onChange,
  showPaste = true,
}: {
  value: Instruction;
  onChange: (patch: Partial<Instruction>) => void;
  showPaste?: boolean;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [found, setFound] = useState<number | null>(null);
  // Remount inputs after a paste-extract so defaultValue picks up the new values.
  const [rev, setRev] = useState(0);

  const f = (k: keyof Instruction, label: string, extra: object = {}) => (
    <Field
      key={`${k}-${rev}`}
      label={label}
      defaultValue={value[k]}
      onChangeText={(t) => onChange({ [k]: t })}
      {...extra}
    />
  );

  return (
    <View>
      {showPaste ? (
        <View style={styles.paste}>
          <Row>
            <Icon name="doc.on.clipboard" size={16} color={C.brand} />
            <T v="heading" style={{ flex: 1 }}>Pre-fill from instruction</T>
            <Button
              title={pasteOpen ? 'Hide' : 'Paste'}
              kind="ghost"
              small
              onPress={() => setPasteOpen((o) => !o)}
            />
          </Row>
          <T v="small" style={{ marginTop: 2 }}>
            Paste the insurer or office instruction email — the claim number, policy number, address and contact are picked out for you.
          </T>
          {pasteOpen ? (
            <>
              <TextInput
                value={pasted}
                onChangeText={setPasted}
                multiline
                placeholder={'Claim No: CLM-48213\nPolicy No: HP-99812\nPolicyholder: Jane Smith\nAddress: 12 Acacia Avenue, Leeds, LS6 2AB\nTel: 07700 900123'}
                placeholderTextColor={C.faint}
                style={styles.pasteBox}
              />
              <Button
                title="Extract details"
                icon="text.viewfinder"
                small
                disabled={!pasted.trim()}
                style={{ marginTop: S.sm, alignSelf: 'flex-start' }}
                onPress={() => {
                  const parsed = parseInstruction(pasted);
                  const n = Object.values(parsed).filter(Boolean).length;
                  setFound(n);
                  if (n) {
                    onChange(parsed);
                    setRev((r) => r + 1);
                  }
                }}
              />
              {found !== null ? (
                <T v="small" style={{ marginTop: 6, color: found ? '#1E6B40' : '#A1421A' }}>
                  {found ? `Filled ${found} field${found === 1 ? '' : 's'} — check them below.` : 'No details recognised.'}
                </T>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      <SectionTitle>Claim & policy</SectionTitle>
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>{f('claimNumber', 'Claim number', { autoCapitalize: 'characters', autoCorrect: false })}</View>
        <View style={{ flex: 1 }}>{f('policyNumber', 'Policy number', { autoCapitalize: 'characters', autoCorrect: false })}</View>
      </Row>
      {f('client', 'Insurer / instructing client')}

      <SectionTitle>Policyholder</SectionTitle>
      {f('policyholderName', 'Name', { textContentType: 'name', autoCapitalize: 'words' })}
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>{f('policyholderPhone', 'Phone', { keyboardType: 'phone-pad' })}</View>
        <View style={{ flex: 1.4 }}>
          {f('policyholderEmail', 'Email', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
        </View>
      </Row>

      <SectionTitle>Property address</SectionTitle>
      {f('addressLine1', 'Address line 1', { autoCapitalize: 'words' })}
      {f('addressLine2', 'Address line 2')}
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1.4 }}>{f('town', 'Town / city', { autoCapitalize: 'words' })}</View>
        <View style={{ flex: 1 }}>{f('postcode', 'Postcode', { autoCapitalize: 'characters', autoCorrect: false })}</View>
      </Row>

      <SectionTitle>Inspection</SectionTitle>
      <Row gap={S.md} style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          {f('inspectionDate', 'Date', { placeholder: 'YYYY-MM-DD', keyboardType: 'numbers-and-punctuation' })}
        </View>
        <View style={{ flex: 1.4 }}>{f('inspector', 'Inspector', { autoCapitalize: 'words' })}</View>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  paste: {
    backgroundColor: C.brandTint,
    borderRadius: R.lg,
    padding: S.lg,
    borderWidth: 1,
    borderColor: '#BCD6EE',
  },
  pasteBox: {
    marginTop: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: 12,
    minHeight: 110,
    fontFamily: F.body,
    fontSize: 14,
    color: C.ink,
    textAlignVertical: 'top',
  },
});
