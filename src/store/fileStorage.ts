import { Directory, File, Paths } from 'expo-file-system';
import { AppState } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * zustand storage backed by a JSON file in the app's Documents directory.
 * Writes are debounced (the store changes on every keystroke) and flushed when the app backgrounds.
 */
const dir = new Directory(Paths.document, 'homemot');
const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | undefined;

function fileFor(name: string) {
  return new File(dir, `${name}.json`);
}

function flush() {
  timer = undefined;
  if (!pending.size) return;
  dir.create({ intermediates: true, idempotent: true });
  for (const [name, value] of pending) {
    const tmp = new File(dir, `${name}.json.tmp`);
    tmp.write(value);
    const target = fileFor(name);
    if (target.exists) target.delete();
    tmp.moveSync(target);
  }
  pending.clear();
}

AppState.addEventListener('change', (s) => {
  if (s !== 'active') flush();
});

export const fileStorage: StateStorage = {
  getItem(name) {
    const f = fileFor(name);
    return f.exists ? f.textSync() : null;
  },
  setItem(name, value) {
    pending.set(name, value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 400);
  },
  removeItem(name) {
    pending.delete(name);
    const f = fileFor(name);
    if (f.exists) f.delete();
  },
};
