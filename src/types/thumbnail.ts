export type InputMode = 'free' | 'guided' | 'assisted';

export type AIModel = 'google/gemini-2.0-basic-lite' | 'google/gemini-2.5-flash-image-preview' | 'google/gemini-3-pro-image-preview';

export type ThumbnailRatio = '16:9' | '1:1' | '9:16' | 'custom';
export type ThumbnailResolution = '720p' | '1080p' | '4K';

export type SubscriptionPlan = 'free' | 'basic' | 'plus' | 'pro' | 'starter' | 'unlimited';

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

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_urls: string[];
  model_used: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  credits: number;
  subscription_tier: string;
  subscription_plan: SubscriptionPlan;
  daily_generations_nano: number;
  daily_generations_gemini: number;
  last_generation_date: string;
}

export interface SubscriptionPlanInfo {
  id: string;
  name: string;
  plan_type: SubscriptionPlan;
  price_monthly: number;
  nano_daily_limit?: number | null;  // Legacy, kept for compatibility
  gemini_daily_limit?: number | null;  // Legacy, kept for compatibility
  gemini_monthly_limit?: number | null;  // New: monthly limit for MiniaMaker 2
  pro_monthly_limit?: number | null;  // New: monthly limit for Pro
  features: { description: string };
}

export const AI_MODELS: { value: AIModel; label: string; description: string; icon: string }[] = [
  {
    value: 'google/gemini-2.5-flash-image-preview',
    label: 'MiniaMaker 2',
    description: 'Équilibré, recommandé',
    icon: '✨'
  },
  {
    value: 'google/gemini-3-pro-image-preview',
    label: 'MiniaMaker Pro',
    description: 'Le plus cher, qualité maximale',
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
