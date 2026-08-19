export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface TranscriptFetchResult {
  status: "available" | "unavailable";
  language: string | null;
  segments: TranscriptSegment[];
  rawText: string;
  retrievedVia: string;
}

export interface TranscriptProvider {
  name: string;
  fetchTranscript(videoId: string): Promise<TranscriptFetchResult>;
}