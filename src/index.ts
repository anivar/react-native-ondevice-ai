/**
 * mobile-ai-toolkit
 *
 * Thin TurboModule wrapper over real on-device AI APIs:
 *  - iOS:     Vision, NaturalLanguage, Speech, UITextChecker
 *  - Android: ML Kit (text, vision, translate, smart reply, entity extraction)
 *             + ML Kit GenAI (summarize/rewrite/proofread, AICore devices only)
 *
 * Not every feature exists on both platforms, and that is not a bug to be
 * papered over: `embedText` is iOS-only, `describeImage` / `smartReplies` /
 * `translateText` are Android-only. A method that the platform cannot do
 * rejects with an `AIError` whose `code` is `FEATURE_UNAVAILABLE` and whose
 * `reason` says why — `no-platform-api` for the list above, `os-too-old` or
 * `hardware-ineligible` for a device that will never support it,
 * `model-not-ready` for one that will once a download finishes.
 *
 * Importing this module never throws. If the native side is not linked (Expo
 * Go, react-native-web, the old architecture) the calls reject with
 * `MODULE_NOT_LINKED` rather than taking the bundle down at import time.
 */

import { call, callSync } from './call';

export {
  AIError,
  type ErrorCode,
  ErrorCodes,
  isAIError,
  isTransient,
  type UnavailableReason,
} from './errors';
export type * from './specs/NativeAIToolkitSpec';

import type {
  Barcode,
  ChatMessage,
  DeviceCapabilities,
  Entity,
  GenerationOptions,
  ImageAnalysis,
  ImageAnalysisOptions,
  ImageLabel,
  PersonSegmentationResult,
  ProofreadResult,
  SmartReplyMessage,
  TextAnalysis,
  TextAnalysisOptions,
  Transcript,
  TranscriptionOptions,
} from './specs/NativeAIToolkitSpec';

export function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  return call('getDeviceCapabilities', (n) => n.getDeviceCapabilities());
}

export function analyzeText(
  text: string,
  options: TextAnalysisOptions = {}
): Promise<TextAnalysis> {
  return call('analyzeText', (n) => n.analyzeText(text, options));
}

export function extractEntities(text: string): Promise<Entity[]> {
  return call('extractEntities', (n) => n.extractEntities(text));
}

export function identifyLanguage(text: string): Promise<string> {
  return call('identifyLanguage', (n) => n.identifyLanguage(text));
}

export function embedText(text: string): Promise<number[]> {
  return call('embedText', (n) => n.embedText(text));
}

export function analyzeImage(
  imageBase64: string,
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysis> {
  return call('analyzeImage', (n) => n.analyzeImage(imageBase64, options));
}

export function scanBarcodes(imageBase64: string): Promise<Barcode[]> {
  return call('scanBarcodes', (n) => n.scanBarcodes(imageBase64));
}

export function labelImage(imageBase64: string): Promise<ImageLabel[]> {
  return call('labelImage', (n) => n.labelImage(imageBase64));
}

export function describeImage(imageBase64: string): Promise<string> {
  return call('describeImage', (n) => n.describeImage(imageBase64));
}

export function segmentPerson(imageBase64: string): Promise<PersonSegmentationResult> {
  return call('segmentPerson', (n) => n.segmentPerson(imageBase64));
}

export function proofreadText(text: string): Promise<ProofreadResult> {
  return call('proofreadText', (n) => n.proofreadText(text));
}

export type SummaryFormat = 'one-bullet' | 'bullets' | 'headline';

export function summarizeText(text: string, format: SummaryFormat = 'bullets'): Promise<string> {
  return call('summarizeText', (n) => n.summarizeText(text, format));
}

export type RewriteStyle =
  | 'rephrase'
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'concise'
  | 'creative'
  | 'elaborate';

export function rewriteText(text: string, style: RewriteStyle): Promise<string> {
  return call('rewriteText', (n) => n.rewriteText(text, style));
}

export function generateText(prompt: string, options: GenerationOptions = {}): Promise<string> {
  return call('generateText', (n) => n.generateText(prompt, options));
}

export function chat(messages: ChatMessage[], options: GenerationOptions = {}): Promise<string> {
  return call('chat', (n) => n.chat(messages, options));
}

export function smartReplies(messages: SmartReplyMessage[]): Promise<string[]> {
  return call('smartReplies', (n) => n.smartReplies(messages));
}

export function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  return call('translateText', (n) => n.translateText(text, sourceLang, targetLang));
}

export function transcribeAudioFile(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<Transcript> {
  return call('transcribeAudioFile', (n) => n.transcribeAudioFile(filePath, options));
}

/**
 * These two are synchronous in the spec, so an unlinked module throws here
 * rather than rejecting. Nothing else in the API behaves this way.
 */
export function enablePrivateMode(enabled: boolean): void {
  callSync('enablePrivateMode', (n) => n.enablePrivateMode(enabled));
}

export function isPrivateModeEnabled(): boolean {
  return callSync('isPrivateModeEnabled', (n) => n.isPrivateModeEnabled());
}

export { requireNative } from './call';
