// NOTE: CREATOR_DNA mock data removed — CreatorDNACard.tsx now reads real
// data via useChannelDNA() -> Channel.channelDNA (see src/services/creatorDNA.ts).
//
// RECOMMENDED_FOR_YOU is still mock data. Wiring it to real recommendations
// requires a recommendation engine that scores existing Cases against the
// creator's ChannelDNA — that engine and real Case data don't exist yet.
// See the note in src/components/discover/RecommendedForYou.tsx.

export const RECOMMENDED_FOR_YOU = [
  {
    title: "Ashley Dale",
    audienceMatch: 96,
    reason: "Your audience consistently responds to institutional failure documentaries with investigative storytelling.",
  },
  {
    title: "The Disappearance of Corrie McKeague",
    audienceMatch: 91,
    reason: "Similar viewing patterns to your best-performing long-form investigations.",
  },
  {
    title: "The Rotherham Abuse Scandal",
    audienceMatch: 88,
    reason: "Matches your audience's strong engagement with institutional accountability stories.",
  },
];