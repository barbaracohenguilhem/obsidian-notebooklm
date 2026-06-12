export interface NotebookSettings {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export interface SourceNote {
  path: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PodcastTranscriptItem {
  speaker: string;
  dialogue: string;
}

export interface PodcastTranscript {
  title: string;
  transcript: PodcastTranscriptItem[];
}
