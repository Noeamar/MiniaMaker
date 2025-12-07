export type InputMode = 'free' | 'guided' | 'assisted';

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
