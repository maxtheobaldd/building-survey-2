import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { photoUri, pickImages, storePhoto, type PhotoSource } from '@/lib/photos';
import { photoRefs, photosFor } from '@/survey/engine';
import type { Inspection, Photo, PhotoOwner } from '@/survey/types';
import { useStore } from '@/store/inspections';
import { C, F, R, S } from '@/theme/tokens';
import { Button, Icon, T, tap } from './ui';

export function PhotoStrip({
  inspection,
  owner,
  prompt,
  defaultCaption,
  minPhotos,
}: {
  inspection: Inspection;
  owner: PhotoOwner;
  prompt?: string;
  defaultCaption: string;
  minPhotos?: number;
}) {
  const addPhoto = useStore((s) => s.addPhoto);
  const [busy, setBusy] = useState(0);
  const [viewing, setViewing] = useState<string | null>(null);
  const photos = photosFor(inspection, owner);
  const refs = photoRefs(inspection);

  const add = async (source: PhotoSource) => {
    const picked = await pickImages(source);
    if (!picked.length) return;
    setBusy(picked.length);
    let n = photos.length;
    for (const p of picked) {
      try {
        const stored = await storePhoto(inspection.id, p.uri, p.width);
        n += 1;
        const photo: Photo = {
          ...stored,
          caption: `${defaultCaption}${n > 1 ? ` (${n})` : ''}`,
          owner,
          takenAt: Date.now(),
        };
        addPhoto(inspection.id, photo);
      } catch (e) {
        Alert.alert('Photo could not be saved', e instanceof Error ? e.message : String(e));
      }
      setBusy((b) => b - 1);
    }
    setBusy(0);
  };

  const chooseSource = () => {
    tap();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Take photo', 'Choose from library', 'Cancel'], cancelButtonIndex: 2 },
        (i) => {
          if (i === 0) add('camera');
          if (i === 1) add('library');
        },
      );
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Take photo', onPress: () => add('camera') },
        { text: 'Choose from library', onPress: () => add('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const short = minPhotos && photos.length < minPhotos;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Icon name="camera" size={15} color={C.brand} />
        <T v="label" style={{ flex: 1 }} numberOfLines={2}>
          {prompt ?? 'Photographs'}
        </T>
        <Text style={[styles.count, short ? { color: '#A1421A' } : null]}>
          {photos.length}
          {minPhotos ? ` / ${minPhotos}+` : ''}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo"
          onPress={chooseSource}
          style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }]}>
          <Icon name="plus" size={22} color={C.brand} weight="semibold" />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
        {photos.map((p) => (
          <Pressable key={p.id} onPress={() => setViewing(p.id)} style={styles.thumbWrap}>
            <Image source={{ uri: photoUri(p.file) }} style={styles.thumb} contentFit="cover" transition={150} />
            <View style={styles.ref}>
              <Text style={styles.refText}>{refs.get(p.id) ?? '—'}</Text>
            </View>
          </Pressable>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <View key={`busy-${i}`} style={[styles.thumb, styles.busy]}>
            <ActivityIndicator color={C.brand} />
          </View>
        ))}
      </ScrollView>
      <PhotoViewer inspection={inspection} photoId={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

function PhotoViewer({
  inspection,
  photoId,
  onClose,
}: {
  inspection: Inspection;
  photoId: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const updatePhoto = useStore((s) => s.updatePhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const photo = inspection.photos.find((p) => p.id === photoId);
  const ref = photo ? photoRefs(inspection).get(photo.id) : undefined;

  return (
    <Modal visible={!!photo} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {photo ? (
        <View style={{ flex: 1, backgroundColor: C.ink }}>
          <View style={[styles.viewerHead, { paddingTop: S.lg }]}>
            <Text style={styles.viewerRef}>{ref}</Text>
            <Pressable hitSlop={12} onPress={onClose} accessibilityLabel="Close">
              <Text style={styles.viewerDone}>Done</Text>
            </Pressable>
          </View>
          <Image
            source={{ uri: photoUri(photo.file) }}
            style={{ flex: 1 }}
            contentFit="contain"
            accessibilityLabel={photo.caption}
          />
          <View style={[styles.viewerFoot, { paddingBottom: insets.bottom + S.lg }]}>
            <T v="eyebrow" style={{ color: '#9FB2C6', marginBottom: 6 }}>Caption in report</T>
            <TextInput
              defaultValue={photo.caption}
              onChangeText={(t) => updatePhoto(inspection.id, photo.id, { caption: t })}
              style={styles.caption}
              placeholder="Describe the photo / location"
              placeholderTextColor="#6F8296"
            />
            <Button
              title="Delete photo"
              kind="danger"
              icon="trash"
              small
              style={{ marginTop: S.md, alignSelf: 'flex-start' }}
              onPress={() =>
                Alert.alert('Delete photo?', 'This removes it from the survey and report.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      onClose();
                      removePhoto(inspection.id, photo.id);
                    },
                  },
                ])
              }
            />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const THUMB = 84;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  count: { fontFamily: F.bold, fontSize: 13, color: C.muted },
  row: { gap: S.sm },
  add: {
    width: THUMB,
    height: THUMB,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.brand,
    backgroundColor: C.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontFamily: F.semibold, fontSize: 12, color: C.brand, marginTop: 2 },
  thumbWrap: { borderRadius: R.md, overflow: 'hidden' },
  thumb: { width: THUMB, height: THUMB, borderRadius: R.md, backgroundColor: C.line },
  busy: { alignItems: 'center', justifyContent: 'center' },
  ref: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    backgroundColor: 'rgba(14,34,53,0.82)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  refText: { fontFamily: F.bold, fontSize: 10.5, color: C.white },
  viewerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
  },
  viewerRef: { fontFamily: F.display, fontSize: 22, color: C.white },
  viewerDone: { fontFamily: F.semibold, fontSize: 16, color: '#9FC8F0' },
  viewerFoot: { paddingHorizontal: S.lg, paddingTop: S.lg, backgroundColor: '#13283D' },
  caption: {
    backgroundColor: '#1C3550',
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.white,
  },
});
