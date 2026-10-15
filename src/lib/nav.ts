import { router, type Href } from 'expo-router';

import { tap } from '@/components/ui';

/** Push a screen within an inspection, e.g. go(id, 'group/roof'). */
export function go(id: string, path: string) {
  tap();
  router.push(`/inspection/${id}/${path}` as Href);
}
