/**
 * amplify/seed.ts
 *
 * Seeds local sandbox data for VerityPulse dev/testing.
 * Matches the 13-model schema in amplify/data/resource.ts:
 * UserProfile, Channel, Project, Case, TimelineEvent, Evidence,
 * Person, Source, Narrative, SEOResult, Thumbnail, CompetitorCache,
 * Notification, ActivityLog.
 *
 * Run with: npx tsx amplify/seed.ts
 * (after `npx ampx sandbox --profile verity-pulse-dev` is up and
 * amplify_outputs.json exists in project root)
 */

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "./data/resource";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function main() {
  console.log("Seeding VerityPulse dev data...");

  // ---------------------------------------------------------------
  // 1. UserProfile
  // ---------------------------------------------------------------
  const { data: profile, errors: profileErrors } =
    await client.models.UserProfile.create({
      email: "dev@veritypulse.app",
      subscription: "PRO",
      avatar: "https://i.pravatar.cc/150?u=verity-dev",
      timezone: "Europe/London",
    });
  if (profileErrors) console.error("UserProfile errors:", profileErrors);
  console.log("Created UserProfile:", profile?.id);

  // ---------------------------------------------------------------
  // 2. Channel
  // ---------------------------------------------------------------
  const { data: channel, errors: channelErrors } =
    await client.models.Channel.create({
      youtubeChannelId: "UC_dev_sample_channel",
      channelName: "Cold Case Files UK",
      subscriberCount: 184000,
      videoCount: 212,
      viewCount: 41200000,
      country: "United Kingdom",
      language: "en",
      lastAnalyzed: new Date().toISOString(),
      channelDNA: JSON.stringify({
        systemicFailure: 42,
        policeInvestigation: 21,
        familyPerspective: 17,
        predatorCases: 11,
        missingPersons: 9,
      }),
    });
  if (channelErrors) console.error("Channel errors:", channelErrors);
  console.log("Created Channel:", channel?.id);

  // ---------------------------------------------------------------
  // 3. Case (fictional/composite — not a real reported case)
  // ---------------------------------------------------------------
  const { data: caseRecord, errors: caseErrors } =
    await client.models.Case.create({
      name: "The Ashford Estate Disappearance",
      country: "United Kingdom",
      category: "MISSING_PERSON",
      status: "COLD_CASE",
      summary:
        "A composite sample case for dev/testing: a missing-person investigation " +
        "with an alleged institutional safeguarding failure thread, used to " +
        "exercise Timeline, Evidence, People, and Narrative features.",
      opportunityScore: 92,
      competitionScore: 34,
      coverageScore: 61,
      lastUpdated: new Date().toISOString(),
      cacheExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  if (caseErrors) console.error("Case errors:", caseErrors);
  console.log("Created Case:", caseRecord?.id);

  const caseId = caseRecord!.id;

  // ---------------------------------------------------------------
  // 4. TimelineEvents
  // ---------------------------------------------------------------
  const timelineEvents = [
    {
      date: "2019-03-14",
      title: "Last confirmed sighting",
      description: "Subject last seen leaving a community center at approx. 18:40.",
      source: "Local police statement",
    },
    {
      date: "2019-03-16",
      title: "Missing person report filed",
      description: "Family formally reports disappearance after 48 hours.",
      source: "Police incident log",
    },
    {
      date: "2019-06-02",
      title: "Safeguarding review opened",
      description: "Internal review opened into prior welfare checks.",
      source: "Council safeguarding board minutes",
    },
  ];

  for (const event of timelineEvents) {
    const { errors } = await client.models.TimelineEvent.create({
      caseId,
      ...event,
    });
    if (errors) console.error("TimelineEvent errors:", errors);
  }
  console.log(`Created ${timelineEvents.length} TimelineEvents`);

  // ---------------------------------------------------------------
  // 5. Evidence
  // ---------------------------------------------------------------
  const evidenceItems = [
    {
      type: "CCTV",
      title: "Community center exit footage",
      description: "Final confirmed visual sighting, low resolution.",
      reliability: "HIGH",
      source: "Council CCTV archive",
      mediaUrl: "",
    },
    {
      type: "WITNESS_STATEMENT",
      title: "Neighbor statement",
      description: "Reports raised voices on the evening in question.",
      reliability: "MEDIUM",
      source: "Police interview transcript",
      mediaUrl: "",
    },
  ] as const;

  for (const ev of evidenceItems) {
    const { errors } = await client.models.Evidence.create({
      caseId,
      ...ev,
    });
    if (errors) console.error("Evidence errors:", errors);
  }
  console.log(`Created ${evidenceItems.length} Evidence records`);

  // ---------------------------------------------------------------
  // 6. People
  // ---------------------------------------------------------------
  const people = [
    {
      name: "Subject (Missing Person)",
      role: "VICTIM",
      bio: "22-year-old resident, last seen March 2019.",
      status: "MISSING",
      image: "",
      relationships: JSON.stringify([{ role: "Family", note: "Sibling gave statement" }]),
    },
    {
      name: "Lead Investigating Officer",
      role: "DETECTIVE",
      bio: "Assigned lead detective on the original 2019 inquiry.",
      status: "ACTIVE",
      image: "",
      relationships: JSON.stringify([]),
    },
  ] as const;

  for (const person of people) {
    const { errors } = await client.models.Person.create({
      caseId,
      ...person,
    });
    if (errors) console.error("Person errors:", errors);
  }
  console.log(`Created ${people.length} People`);

  // ---------------------------------------------------------------
  // 7. Sources
  // ---------------------------------------------------------------
  const sources = [
    {
      publisher: "Regional Press (sample)",
      url: "https://example.com/sample-article-1",
      date: "2019-03-17",
      reliability: "HIGH",
      type: "NEWS",
    },
    {
      publisher: "Council Safeguarding Board",
      url: "https://example.com/sample-review",
      date: "2019-09-01",
      reliability: "HIGH",
      type: "OFFICIAL_DOCUMENT",
    },
  ] as const;

  for (const source of sources) {
    const { errors } = await client.models.Source.create({
      caseId,
      ...source,
    });
    if (errors) console.error("Source errors:", errors);
  }
  console.log(`Created ${sources.length} Sources`);

  // ---------------------------------------------------------------
  // 8. Project (linked to Channel + Case)
  // ---------------------------------------------------------------
  const { data: project, errors: projectErrors } =
    await client.models.Project.create({
      channelId: channel!.id,
      caseId,
      title: "The Ashford Estate Disappearance — Investigation",
      status: "RESEARCH",
      currentStage: "NARRATIVE",
      thumbnailStatus: "NOT_STARTED",
      seoStatus: "NOT_STARTED",
      publishDate: null,
    });
  if (projectErrors) console.error("Project errors:", projectErrors);
  console.log("Created Project:", project?.id);

  const projectId = project!.id;

  // ---------------------------------------------------------------
  // 9. Narrative
  // ---------------------------------------------------------------
  const { errors: narrativeErrors } = await client.models.Narrative.create({
    projectId,
    title: "Institutional Failure Angle",
    opportunityScore: 96,
    confidence: "HIGH",
    gapAnalysis: JSON.stringify({
      coveredByOthersPct: 92,
      coveredTopic: "the disappearance itself",
      gapPct: 8,
      gapTopic: "prior safeguarding review failures",
    }),
    hook: "Months before she vanished, a review was already flagging the warning signs.",
    storyStructure: JSON.stringify({
      coldOpen: "The last CCTV frame.",
      act1: "Who she was.",
      act2: "The night in question.",
      act3: "The review nobody read.",
      act4: "Where the case stands now.",
      ending: "The unanswered question.",
    }),
  });
  if (narrativeErrors) console.error("Narrative errors:", narrativeErrors);
  console.log("Created Narrative");

  // ---------------------------------------------------------------
  // 10. SEOResult
  // ---------------------------------------------------------------
  const { errors: seoErrors } = await client.models.SEOResult.create({
    projectId,
    title: "The Case Everyone Missed: Ashford Estate",
    score: 91,
    description:
      "A deep dive into an overlooked missing-person case and the safeguarding " +
      "review that came too late. Full timeline, evidence, and analysis.",
    tags: ["true crime", "missing person", "cold case", "UK"],
    category: "MISSING_PERSON",
    uploadTime: "18:00",
  });
  if (seoErrors) console.error("SEOResult errors:", seoErrors);
  console.log("Created SEOResult");

  // ---------------------------------------------------------------
  // 11. Thumbnail
  // ---------------------------------------------------------------
  const { errors: thumbErrors } = await client.models.Thumbnail.create({
    projectId,
    concept: "Single face, high contrast, CCTV-still background",
    ctrPrediction: 89,
    emotionScore: 96,
    contrastScore: 91,
  });
  if (thumbErrors) console.error("Thumbnail errors:", thumbErrors);
  console.log("Created Thumbnail");

  // ---------------------------------------------------------------
  // 12. CompetitorCache
  // ---------------------------------------------------------------
  const { errors: compErrors } = await client.models.CompetitorCache.create({
    keyword: "ashford estate disappearance",
    videos: JSON.stringify([
      { title: "Sample competitor video 1", views: 412000 },
      { title: "Sample competitor video 2", views: 289000 },
    ]),
    thumbnails: JSON.stringify([]),
    statistics: JSON.stringify({ avgViews: 350000, avgLength: 1680 }),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
  if (compErrors) console.error("CompetitorCache errors:", compErrors);
  console.log("Created CompetitorCache");

  // ---------------------------------------------------------------
  // 13. Notification
  // ---------------------------------------------------------------
  const { errors: notifErrors } = await client.models.Notification.create({
    userProfileId: profile!.id,
    type: "RESEARCH_COMPLETE",
    title: "Research complete",
    body: "Your research on 'The Ashford Estate Disappearance' is ready to review.",
    read: false,
  });
  if (notifErrors) console.error("Notification errors:", notifErrors);
  console.log("Created Notification");

  // ---------------------------------------------------------------
  // 14. ActivityLog
  // ---------------------------------------------------------------
  const { errors: activityErrors } = await client.models.ActivityLog.create({
    userProfileId: profile!.id,
    action: "PROJECT_CREATED",
    page: "case-intelligence",
    metadata: JSON.stringify({ projectId, caseId }),
  });
  if (activityErrors) console.error("ActivityLog errors:", activityErrors);
  console.log("Created ActivityLog");

  console.log("✅ Seed complete.");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  throw err;
});