export type InputMode = 'free' | 'guided' | 'assisted';

export type AIModel = 'google/gemini-2.5-flash-lite' | 'google/gemini-2.5-flash-image-preview' | 'google/gemini-3-pro-image-preview';

export type ThumbnailRatio = '16:9' | '1:1' | '9:16' | 'custom';
export type ThumbnailResolution = '720p' | '1080p' | '4K';

export interface TemplateData {
  id?: string;
  name: string;
  videoContext: string;
  objective: string;
  mainSubject: string;
  emotion: string;
  shortText: string;
  visualStyle: string;
  createdAt?: Date;
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file?: File;
}

export interface GeneratedThumbnail {
  id: string;
  url: string;
  prompt: string;
  createdAt: Date;
  isFavorite: boolean;
}

export interface WizardAnswers {
  goal: string;
  subject: string;
  emotion: string;
}

export interface FormatSettings {
  ratio: ThumbnailRatio;
  customRatio?: string;
  resolution: ThumbnailResolution;
  includeLogo: boolean;
  brandLogoUrl?: string;
  brandColor: string;
  fontStyle: string;
}

export interface GenerationSettings {
  model: AIModel;
  format: FormatSettings;
}

export const AI_MODELS: { value: AIModel; label: string; description: string; icon: string }[] = [
  {
    value: 'google/gemini-2.5-flash-lite',
    label: 'Nano Banana Flash',
    description: 'Rapide et économique',
    icon: '⚡'
  },
  {
    value: 'google/gemini-2.5-flash-image-preview',
    label: 'Nano Banana Pro',
    description: 'Équilibré, recommandé',
    icon: '✨'
  },
  {
    value: 'google/gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro',
    description: 'Nouvelle génération, qualité maximale',
    icon: '🚀'
  }
];

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  ratio: '16:9',
  resolution: '1080p',
  includeLogo: false,
  brandColor: '#FF0000',
  fontStyle: 'bold'
};
