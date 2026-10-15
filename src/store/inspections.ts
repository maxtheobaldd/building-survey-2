import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deleteInspectionPhotos, deletePhotoFiles } from '@/lib/photos';
import type {
  ActionItem,
  Answer,
  Defect,
  FindingOverride,
  Inspection,
  Instruction,
  Outbuilding,
  Photo,
  Room,
  Sector,
  Summary,
  Tier,
} from '@/survey/types';
import { fileStorage } from './fileStorage';

export interface InspectorProfile {
  name: string;
  qualifications: string;
  company: string;
  phone: string;
  email: string;
}

interface State {
  inspections: Record<string, Inspection>;
  profile: InspectorProfile;
  deviceId: string;
  aiEnabled: boolean;
  counter: number;
  hydrated: boolean;
}

interface Actions {
  createInspection(input: { tier: Tier; sector: Sector; instruction: Partial<Instruction> }): string;
  importInspection(inspection: Inspection): void;
  deleteInspection(id: string): void;
  patch(id: string, fn: (i: Inspection) => void): void;
  updateInstruction(id: string, patch: Partial<Instruction>): void;
  setTier(id: string, tier: Tier): void;
  setAnswer(id: string, key: string, answer: Partial<Answer> | null): void;
  setGroupNote(id: string, groupId: string, note: string): void;
  setGroupObservations(id: string, groupId: string, text: string): void;
  addPhoto(id: string, photo: Photo): void;
  updatePhoto(id: string, photoId: string, patch: Partial<Photo>): void;
  removePhoto(id: string, photoId: string): void;
  addRoom(id: string, room: Pick<Room, 'name' | 'type' | 'level'>): string;
  updateRoom(id: string, roomId: string, patch: Partial<Room>): void;
  setRoomAnswer(id: string, roomId: string, questionId: string, answer: Partial<Answer> | null): void;
  removeRoom(id: string, roomId: string): void;
  addDefect(id: string, roomId: string, defect: Omit<Defect, 'id'>): void;
  updateDefect(id: string, roomId: string, defectId: string, patch: Partial<Defect>): void;
  removeDefect(id: string, roomId: string, defectId: string): void;
  addOutbuilding(id: string, type: string): string;
  updateOutbuilding(id: string, oid: string, patch: Partial<Outbuilding>): void;
  removeOutbuilding(id: string, oid: string): void;
  addAction(id: string, action: Omit<ActionItem, 'id'>): void;
  updateAction(id: string, actionId: string, patch: Partial<ActionItem>): void;
  removeAction(id: string, actionId: string): void;
  setFindingOverride(id: string, key: string, override: FindingOverride | null): void;
  updateSummary(id: string, patch: Partial<Summary>): void;
  setComplete(id: string, complete: boolean): void;
  updateProfile(patch: Partial<InspectorProfile>): void;
  setAiEnabled(on: boolean): void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const emptyInstruction = (inspector = ''): Instruction => ({
  claimNumber: '',
  policyNumber: '',
  client: '',
  policyholderName: '',
  policyholderPhone: '',
  policyholderEmail: '',
  addressLine1: '',
  addressLine2: '',
  town: '',
  postcode: '',
  inspectionDate: today(),
  inspector,
});

function makeRef(n: number) {
  const d = new Date();
  const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `HM-${yymm}-${String(n).padStart(4, '0')}`;
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (i: Inspection) => void) =>
        set((s) => {
          const current = s.inspections[id];
          if (!current) return s;
          const next: Inspection = structuredClone(current);
          fn(next);
          next.updatedAt = Date.now();
          return { inspections: { ...s.inspections, [id]: next } };
        });

      return {
        inspections: {},
        profile: { name: '', qualifications: '', company: 'Property Health Check UK', phone: '', email: '' },
        deviceId: randomUUID(),
        aiEnabled: true,
        counter: 0,
        hydrated: false,

        createInspection({ tier, sector, instruction }) {
          const id = randomUUID();
          const n = get().counter + 1;
          const now = Date.now();
          const inspection: Inspection = {
            id,
            ref: makeRef(n),
            tier,
            sector,
            status: 'in_progress',
            createdAt: now,
            updatedAt: now,
            instruction: { ...emptyInstruction(get().profile.name), ...instruction },
            answers: {},
            groupNotes: {},
            groupObservations: {},
            photos: [],
            rooms: [],
            outbuildings: [],
            actions: [],
            findingOverrides: {},
            summary: {},
          };
          set((s) => ({ counter: n, inspections: { ...s.inspections, [id]: inspection } }));
          return id;
        },

        importInspection(inspection) {
          set((s) => ({
            counter: s.counter + 1,
            inspections: { ...s.inspections, [inspection.id]: inspection },
          }));
        },

        deleteInspection(id) {
          deleteInspectionPhotos(id);
          set((s) => {
            const { [id]: _gone, ...rest } = s.inspections;
            return { inspections: rest };
          });
        },

        patch,

        updateInstruction: (id, p) => patch(id, (i) => Object.assign(i.instruction, p)),

        setTier: (id, tier) => patch(id, (i) => void (i.tier = tier)),

        setAnswer: (id, key, answer) =>
          patch(id, (i) => {
            if (answer === null) delete i.answers[key];
            else i.answers[key] = { ...(i.answers[key] ?? { value: null }), ...answer };
          }),

        setGroupNote: (id, groupId, note) => patch(id, (i) => void (i.groupNotes[groupId] = note)),

        setGroupObservations: (id, groupId, text) => patch(id, (i) => void (i.groupObservations[groupId] = text)),

        addPhoto: (id, photo) => patch(id, (i) => void i.photos.push(photo)),

        updatePhoto: (id, photoId, p) =>
          patch(id, (i) => {
            const ph = i.photos.find((x) => x.id === photoId);
            if (ph) Object.assign(ph, p);
          }),

        removePhoto: (id, photoId) =>
          patch(id, (i) => {
            const ph = i.photos.find((x) => x.id === photoId);
            if (ph) deletePhotoFiles(ph);
            i.photos = i.photos.filter((x) => x.id !== photoId);
          }),

        addRoom(id, room) {
          const roomId = randomUUID();
          patch(id, (i) =>
            i.rooms.push({ id: roomId, ...room, answers: {}, defects: [], observations: '' }),
          );
          return roomId;
        },

        updateRoom: (id, roomId, p) =>
          patch(id, (i) => {
            const r = i.rooms.find((x) => x.id === roomId);
            if (r) Object.assign(r, p);
          }),

        setRoomAnswer: (id, roomId, qid, answer) =>
          patch(id, (i) => {
            const r = i.rooms.find((x) => x.id === roomId);
            if (!r) return;
            if (answer === null) delete r.answers[qid];
            else r.answers[qid] = { ...(r.answers[qid] ?? { value: null }), ...answer };
          }),

        removeRoom: (id, roomId) =>
          patch(id, (i) => {
            i.photos
              .filter((p) => p.owner.kind === 'room' && p.owner.id === roomId)
              .forEach(deletePhotoFiles);
            i.photos = i.photos.filter((p) => !(p.owner.kind === 'room' && p.owner.id === roomId));
            i.rooms = i.rooms.filter((r) => r.id !== roomId);
          }),

        addDefect: (id, roomId, defect) =>
          patch(id, (i) => {
            i.rooms.find((r) => r.id === roomId)?.defects.push({ id: randomUUID(), ...defect });
          }),

        updateDefect: (id, roomId, defectId, p) =>
          patch(id, (i) => {
            const d = i.rooms.find((r) => r.id === roomId)?.defects.find((x) => x.id === defectId);
            if (d) Object.assign(d, p);
          }),

        removeDefect: (id, roomId, defectId) =>
          patch(id, (i) => {
            const r = i.rooms.find((x) => x.id === roomId);
            if (r) r.defects = r.defects.filter((d) => d.id !== defectId);
          }),

        addOutbuilding(id, type) {
          const oid = randomUUID();
          patch(id, (i) => {
            const n = i.outbuildings.filter((o) => o.type === type).length + 1;
            i.outbuildings.push({ id: oid, type, label: n > 1 ? `${type} ${n}` : type, description: '' });
            delete i.answers['outbuildings.none'];
          });
          return oid;
        },

        updateOutbuilding: (id, oid, p) =>
          patch(id, (i) => {
            const o = i.outbuildings.find((x) => x.id === oid);
            if (o) Object.assign(o, p);
          }),

        removeOutbuilding: (id, oid) =>
          patch(id, (i) => {
            i.photos
              .filter((p) => p.owner.kind === 'outbuilding' && p.owner.id === oid)
              .forEach(deletePhotoFiles);
            i.photos = i.photos.filter((p) => !(p.owner.kind === 'outbuilding' && p.owner.id === oid));
            i.outbuildings = i.outbuildings.filter((o) => o.id !== oid);
          }),

        addAction: (id, action) => patch(id, (i) => void i.actions.push({ id: randomUUID(), ...action })),

        updateAction: (id, actionId, p) =>
          patch(id, (i) => {
            const a = i.actions.find((x) => x.id === actionId);
            if (a) Object.assign(a, p);
          }),

        removeAction: (id, actionId) =>
          patch(id, (i) => void (i.actions = i.actions.filter((a) => a.id !== actionId))),

        setFindingOverride: (id, key, override) =>
          patch(id, (i) => {
            if (override === null) delete i.findingOverrides[key];
            else i.findingOverrides[key] = { ...i.findingOverrides[key], ...override };
          }),

        updateSummary: (id, p) => patch(id, (i) => Object.assign(i.summary, p)),

        setComplete: (id, complete) =>
          patch(id, (i) => {
            i.status = complete ? 'complete' : 'in_progress';
            i.completedAt = complete ? Date.now() : undefined;
          }),

        updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

        setAiEnabled: (on) => set({ aiEnabled: on }),
      };
    },
    {
      name: 'store',
      version: 1,
      storage: createJSONStorage(() => fileStorage),
      partialize: ({ hydrated: _h, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<State>,
      // File storage is synchronous, so this fires while `create` is still running —
      // defer until `useStore` exists.
      onRehydrateStorage: () => () => {
        setTimeout(() => useStore.setState({ hydrated: true }), 0);
      },
    },
  ),
);

export function useInspection(id: string | undefined): Inspection | undefined {
  return useStore((s) => (id ? s.inspections[id] : undefined));
}
