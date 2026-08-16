export const SOURCE_CATEGORIES = [
  "NEWS",
  "DOCUMENTARY",
  "INTERVIEW",
  "COURT",
  "POLICE",
  "PRESS_CONFERENCE",
  "ANALYSIS",
  "COMMENTARY",
  "PODCAST",
  "ARCHIVE",
  "OTHER",
] as const;

export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

const NEWS_CHANNEL_MARKERS = [
  "news",
  "wbrc",
  "khou",
  "abc",
  "nbc",
  "cbs",
  "fox",
  "cnn",
  "bbc",
  "sky news",
  "itv",
];

/**
 * Deliberately heuristic, not AI-classified — this runs over every
 * discovered candidate before relevance filtering even happens, so it
 * needs to be free and instant. Good enough for a first-pass label; the
 * category is informational, not load-bearing for anything downstream.
 */
export function categorizeVideo(title: string, description: string, channelName: string): SourceCategory {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const c = channelName.toLowerCase();
  const text = `${t} ${d}`;

  if (/press conference|full press conference|news conference/.test(text)) return "PRESS_CONFERENCE";
  if (/court|trial|hearing|verdict|sentencing|arraignment/.test(text)) return "COURT";
  if (/police (bodycam|body cam|dispatch|interview room)|pd press|sheriff's office/.test(text)) return "POLICE";
  if (/^interview with|full interview|exclusive interview|sits down with/.test(text)) return "INTERVIEW";
  if (/documentary|full episode|the untold story|deep dive/.test(text)) return "DOCUMENTARY";
  if (/podcast|episode \d+/.test(text) || /podcast/.test(c)) return "PODCAST";
  if (NEWS_CHANNEL_MARKERS.some((m) => c.includes(m))) return "NEWS";
  if (/archive|throwback|old footage|original broadcast/.test(text)) return "ARCHIVE";
  if (/reacts|reaction|my thoughts|breaking down|analysis of/.test(text)) return "ANALYSIS";
  if (/commentary|opinion|let's talk about/.test(text)) return "COMMENTARY";
  return "OTHER";
}