import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Photos are copied into the app's Documents directory and referenced by a path relative to it,
 * because iOS changes the absolute container path between installs and updates.
 */
const root = new Directory(Paths.document, 'homemot', 'photos');

export interface StoredPhoto {
  id: string;
  file: string;
  reportFile: string;
  width: number;
  height: number;
}

export function photoUri(rel: string): string {
  return new File(root, rel).uri;
}

async function save(uri: string, maxEdge: number, compress: number, dest: File) {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: maxEdge, height: null }).renderAsync();
  // Keep portrait images within maxEdge on their long side too.
  const scaled =
    ref.height > ref.width && ref.height > maxEdge
      ? await ImageManipulator.manipulate(uri)
          .resize({ width: null, height: maxEdge })
          .renderAsync()
      : ref;
  const out = await scaled.saveAsync({ format: SaveFormat.JPEG, compress });
  const tmp = new File(out.uri);
  tmp.moveSync(dest, { overwrite: true });
  return { width: out.width, height: out.height };
}

export async function storePhoto(inspectionId: string, sourceUri: string, width?: number): Promise<StoredPhoto> {
  const id = randomUUID();
  const dir = new Directory(root, inspectionId);
  dir.create({ intermediates: true, idempotent: true });
  const full = new File(dir, `${id}.jpg`);
  const report = new File(dir, `${id}_r.jpg`);
  const big = Math.min(1600, width ?? 1600);
  const dims = await save(sourceUri, big, 0.75, full);
  await save(full.uri, Math.min(900, big), 0.62, report);
  return { id, file: `${inspectionId}/${id}.jpg`, reportFile: `${inspectionId}/${id}_r.jpg`, ...dims };
}

export function deletePhotoFiles(p: { file: string; reportFile: string }) {
  for (const rel of [p.file, p.reportFile]) {
    const f = new File(root, rel);
    if (f.exists) f.delete();
  }
}

export function deleteInspectionPhotos(inspectionId: string) {
  const d = new Directory(root, inspectionId);
  if (d.exists) d.delete();
}

export function photoBase64(rel: string): string | null {
  const f = new File(root, rel);
  return f.exists ? f.base64Sync() : null;
}

/** ~1024 px JPEG for the AI scan, as base64. */
export async function scanImage(rel: string): Promise<string> {
  const ref = await ImageManipulator.manipulate(photoUri(rel)).resize({ width: 1024, height: null }).renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  const tmp = new File(out.uri);
  if (tmp.exists) tmp.delete();
  return out.base64 ?? '';
}

export type PhotoSource = 'camera' | 'library';

/** Opens the camera or photo library; returns picked asset URIs (empty if cancelled). */
export async function pickImages(source: PhotoSource, multiple = true): Promise<{ uri: string; width: number }[]> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera access needed', 'Allow camera access in Settings to take survey photos.');
        return [];
      }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, exif: false });
      return res.canceled ? [] : res.assets.map((a) => ({ uri: a.uri, width: a.width }));
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 12 : 1,
      quality: 0.9,
      exif: false,
      orderedSelection: true,
    });
    return res.canceled ? [] : res.assets.map((a) => ({ uri: a.uri, width: a.width }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    Alert.alert(
      source === 'camera' ? 'Camera unavailable' : 'Could not open photos',
      source === 'camera' ? 'This device has no camera available (e.g. the simulator). Use the photo library instead.' : msg,
    );
    return [];
  }
}
