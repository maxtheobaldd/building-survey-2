import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { ConvexError } from 'convex/values';

import { scanImage } from '@/lib/photos';
import { optionsFor } from '@/survey/engine';
import type { Question, Sector } from '@/survey/types';

/**
 * Client for the Convex `scan:analyse` action (photos → observations, suggested answers, defects).
 * Survey data never leaves the device except the photos and question list sent for a scan.
 */
export interface ScanAnswer {
  questionId: string;
  optionIds: string[];
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ScanResult {
  observations: string;
  answers: ScanAnswer[];
  defects: { description: string; location: string; severity: 'minor' | 'moderate' | 'significant' }[];
  imageWarning: string | null;
}

type ScanArgs = {
  deviceId: string;
  kind: 'room' | 'element';
  subject: string;
  context: string;
  images: { base64: string; mediaType: string }[];
  questions: { id: string; text: string; multi: boolean; options: { id: string; label: string }[] }[];
};

const analyse = makeFunctionReference<'action', ScanArgs, ScanResult>('scan:analyse');
const health = makeFunctionReference<'action', Record<string, never>, { ok: boolean; model: string }>('scan:health');

const url = process.env.EXPO_PUBLIC_CONVEX_URL;
let client: ConvexHttpClient | null = null;
function getClient() {
  if (!url) throw new Error('AI scanning is not configured (EXPO_PUBLIC_CONVEX_URL is missing).');
  client ??= new ConvexHttpClient(url);
  return client;
}

export const aiConfigured = !!url;

export async function aiHealth(): Promise<{ ok: boolean; model: string } | null> {
  try {
    return await getClient().action(health, {});
  } catch {
    return null;
  }
}

export const MAX_SCAN_PHOTOS = 4;

export async function runScan(input: {
  deviceId: string;
  kind: 'room' | 'element';
  subject: string;
  context: string;
  photoFiles: string[];
  questions: Question[];
  sector: Sector;
}): Promise<ScanResult> {
  const files = input.photoFiles.slice(-MAX_SCAN_PHOTOS);
  const images = await Promise.all(
    files.map(async (f) => ({ base64: await scanImage(f), mediaType: 'image/jpeg' })),
  );
  const questions = input.questions
    .filter((q) => q.ai && q.options?.length)
    .map((q) => ({
      id: q.id,
      text: q.prompt ?? q.label,
      multi: q.type === 'multi',
      options: optionsFor(q, input.sector).map((o) => ({ id: o.id, label: o.label })),
    }));
  try {
    return await getClient().action(analyse, {
      deviceId: input.deviceId,
      kind: input.kind,
      subject: input.subject,
      context: input.context,
      images,
      questions,
    });
  } catch (e) {
    if (e instanceof ConvexError) throw new Error(String(e.data));
    const msg = e instanceof Error ? e.message : String(e);
    if (/network|fetch|connection|offline/i.test(msg)) {
      throw new Error('No connection. The AI scan needs signal — you can answer the questions manually and scan later.');
    }
    throw new Error('The AI scan could not be completed. Please try again or answer manually.');
  }
}
