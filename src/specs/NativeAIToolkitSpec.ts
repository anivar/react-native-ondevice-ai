import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface DeviceCapabilities {
  platform: 'ios' | 'android';
  osVersion: string;
  hasNeuralEngine: boolean;
  hasAppleIntelligence: boolean;
  hasGeminiNano: boolean;
  hasMLKitGenAI: boolean;
  hasOnDeviceSpeech: boolean;
  supportedLanguages: string[];
  features: {
    analyzeText: boolean;
    analyzeImage: boolean;
    proofread: boolean;
    summarize: boolean;
    rewrite: boolean;
    generate: boolean;
    chat: boolean;
    smartReplies: boolean;
    extractEntities: boolean;
    embedText: boolean;
    translate: boolean;
    transcribe: boolean;
    scanBarcodes: boolean;
    labelImage: boolean;
    describeImage: boolean;
    segmentPerson: boolean;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TextAnalysisOptions {
  includeSentiment?: boolean;
  includeEntities?: boolean;
  language?: string;
}

export interface Entity {
  text: string;
  type:
    | 'person'
    | 'place'
    | 'organization'
    | 'email'
    | 'phone'
    | 'address'
    | 'url'
    | 'date'
    | 'money'
    | 'other';
  confidence: number;
  range: [number, number];
}

export interface TextAnalysis {
  language: string;
  sentiment?: number;
  /**
   * Absent — not empty — when entity extraction was requested and failed.
   * An empty array means the text genuinely had no entities; those two are
   * different answers and used to be indistinguishable.
   */
  entities?: Entity[];
  confidence: number;
  /** True when part of the analysis failed and its field was omitted. */
  degraded?: boolean;
}

export interface ImageAnalysisOptions {
  detectObjects?: boolean;
  detectFaces?: boolean;
  extractText?: boolean;
}

export interface ImageAnalysis {
  text: string;
  objects: Array<{
    label: string;
    confidence: number;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
  faces: Array<{
    bounds: { x: number; y: number; width: number; height: number };
  }>;
  /**
   * True when one of the requested sub-analyses (text, objects, faces) failed.
   * Its field is then empty for want of a result, not because the image had
   * nothing in it.
   */
  degraded?: boolean;
}

export interface ProofreadResult {
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'grammar';
    position: [number, number];
  }>;
}

export interface TranscriptionOptions {
  locale?: string;
  enablePunctuation?: boolean;
}

export interface Transcript {
  text: string;
  confidence: number;
  locale: string;
}

export interface SmartReplyMessage {
  text: string;
  fromUser: boolean;
  timestampMs: number;
}

export interface GenerationOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export interface ImageLabel {
  label: string;
  confidence: number;
}

export interface Barcode {
  rawValue: string;
  format: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface PersonSegmentationResult {
  /** Base64-encoded grayscale PNG mask. White = person, black = background. */
  maskBase64: string;
  width: number;
  height: number;
}

export interface Spec extends TurboModule {
  getDeviceCapabilities(): Promise<DeviceCapabilities>;

  // Text understanding
  analyzeText(text: string, options: TextAnalysisOptions): Promise<TextAnalysis>;
  extractEntities(text: string): Promise<Entity[]>;
  identifyLanguage(text: string): Promise<string>;
  embedText(text: string): Promise<number[]>;

  // Image understanding
  analyzeImage(imageBase64: string, options: ImageAnalysisOptions): Promise<ImageAnalysis>;
  scanBarcodes(imageBase64: string): Promise<Barcode[]>;
  labelImage(imageBase64: string): Promise<ImageLabel[]>;
  describeImage(imageBase64: string): Promise<string>;
  segmentPerson(imageBase64: string): Promise<PersonSegmentationResult>;

  // Generative
  proofreadText(text: string): Promise<ProofreadResult>;
  summarizeText(text: string, format: string): Promise<string>;
  rewriteText(text: string, style: string): Promise<string>;
  generateText(prompt: string, options: GenerationOptions): Promise<string>;
  chat(messages: ChatMessage[], options: GenerationOptions): Promise<string>;
  smartReplies(messages: SmartReplyMessage[]): Promise<string[]>;
  translateText(text: string, sourceLang: string, targetLang: string): Promise<string>;

  // Speech
  transcribeAudioFile(filePath: string, options: TranscriptionOptions): Promise<Transcript>;

  // Privacy hint
  enablePrivateMode(enabled: boolean): void;
  isPrivateModeEnabled(): boolean;
}

/**
 * `get`, not `getEnforcing`: the enforcing variant throws while this module is
 * being imported, so on Expo Go, react-native-web or the old architecture the
 * bundle dies rather than the feature. The null is handled once in `call.ts`,
 * which raises MODULE_NOT_LINKED at call time instead.
 */
export default TurboModuleRegistry.get<Spec>('AIToolkitTurboModule');
