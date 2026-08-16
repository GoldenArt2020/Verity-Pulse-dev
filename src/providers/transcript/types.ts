export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export type TranscriptStatus = "available" | "unavailable";

export interface TranscriptFetchResult {
  status: TranscriptStatus;
  language: string | null;
  segments: TranscriptSegment[];
  rawText: string;
  retrievedVia: string;
}

export interface TranscriptProvider {
  name: string;
  fetchTranscript(videoId: string): Promise<TranscriptFetchResult>;
}