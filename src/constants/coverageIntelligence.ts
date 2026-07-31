// TODO: replace with real Groq + YouTube transcript analysis pipeline output
export const COVERAGE_MAP = [
  { angle: "Timeline Reconstruction", coverage: 89 },
  { angle: "Police Investigation", coverage: 72 },
  { angle: "Family Perspective", coverage: 45 },
  { angle: "Court Trial", coverage: 38 },
  { angle: "Witness Analysis", coverage: 17 },
  { angle: "Institutional Failures", coverage: 8 },
  { angle: "Psychological Analysis", coverage: 5 },
];

export const ANGLE_SATURATION = [
  { angle: "Institutional Failures", coverage: 8, opportunity: 96 },
  { angle: "Witness Contradictions", coverage: 6, opportunity: 94 },
  { angle: "Timeline Reconstruction", coverage: 89, opportunity: 52 },
  { angle: "Police Investigation", coverage: 72, opportunity: 60 },
];

export const UNTAPPED_ANGLES = [
  {
    title: "Institutional Failures",
    opportunityScore: 96,
    coverage: 8,
    why: "Most YouTube creators focused almost entirely on the disappearance itself. Very few investigated whether institutional decisions contributed to the outcome. Exploring documented actions taken by schools, police, transport authorities, or other organizations provides a fresh documentary perspective while remaining evidence-based.",
    questions: [
      "Could intervention have changed the outcome?",
      "Were warning signs overlooked?",
      "What changed because of this case?",
    ],
    evidence: ["Court documents", "BBC reporting", "Police statements", "Official investigations"],
    originality: "Very High",
    evidenceStrength: "High",
    audienceMatch: 96,
  },
  {
    title: "Witness Contradictions",
    opportunityScore: 94,
    coverage: 6,
    why: "Multiple witness statements contain unexplored inconsistencies that no creator has examined side by side. A comparative analysis could reveal overlooked details.",
    questions: [
      "Do the witness accounts align with the official timeline?",
      "What explains the discrepancies?",
    ],
    evidence: ["Court transcripts", "News archive interviews"],
    originality: "High",
    evidenceStrength: "Medium",
    audienceMatch: 89,
  },
];

export const EDITORIAL_FEEDBACK = {
  videosAnalyzed: 127,
  points: [
    "89% focused on reconstructing the timeline.",
    "72% covered the police investigation.",
    "Only 8% explored institutional accountability.",
  ],
  conclusion:
    "No major creator produced a documentary dedicated to institutional accountability. This represents the strongest opportunity for a distinctive long-form documentary while remaining grounded in documented evidence.",
};