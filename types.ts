
export interface Timestamp {
  time: string;
  topic: string;
  visualCue: string;
}

export interface RecapData {
  summary: string;
  timestamps: Timestamp[];
  linkedinPost: string;
  twitterThread: string[];
  blogPost: string;
  visualInsights: string[];
}

export type TabType = 'overview' | 'linkedin' | 'twitter' | 'blog' | 'timestamps';

export type AppView = 'home' | 'pricing' | 'features' | 'case-studies' | 'login';

export type BrandTone = 'professional' | 'humorous' | 'enthusiastic' | 'minimalist' | 'educational';

export interface User {
  email: string;
  isPro: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
