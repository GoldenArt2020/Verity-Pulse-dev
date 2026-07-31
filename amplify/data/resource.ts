import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      name: a.string(),
      avatarUrl: a.string(),
      subscriptionTier: a.enum(["FREE", "PRO", "TEAM"]),
      lastLogin: a.datetime(),
      channels: a.hasMany("Channel", "userId"),
      projects: a.hasMany("Project", "userId"),
    })
    .authorization((allow) => [allow.owner()]),

  Channel: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      youtubeChannelId: a.string().required(),
      channelName: a.string().required(),
      subscriberCount: a.integer(),
      videoCount: a.integer(),
      viewCount: a.integer(),
      country: a.string(),
      language: a.string(),
      channelDNA: a.json(),
      lastAnalyzed: a.datetime(),
      projects: a.hasMany("Project", "channelId"),
    })
    .authorization((allow) => [allow.owner()]),

  Case: a
    .model({
      name: a.string().required(),
      country: a.string(),
      category: a.string(),
      tags: a.string().array(),
      status: a.enum(["SOLVED", "UNSOLVED", "COLD_CASE", "MISSING", "CONVICTED", "TRIAL_ONGOING"]),
      summary: a.string(),
      opportunityScore: a.integer(),
      competitionScore: a.integer(),
      coverageScore: a.integer(),
      coverageIntelligence: a.json(),
      lastUpdated: a.datetime(),
      cacheExpires: a.datetime(),
      projects: a.hasMany("Project", "caseId"),
      timelineEvents: a.hasMany("TimelineEvent", "caseId"),
      evidence: a.hasMany("Evidence", "caseId"),
      people: a.hasMany("Person", "caseId"),
      sources: a.hasMany("Source", "caseId"),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Project: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      channelId: a.id(),
      channel: a.belongsTo("Channel", "channelId"),
      caseId: a.id(),
      case: a.belongsTo("Case", "caseId"),
      title: a.string().required(),
      status: a.enum([
        "IDEA",
        "RESEARCH",
        "NARRATIVE",
        "SEO",
        "THUMBNAIL",
        "RECORDING",
        "EDITING",
        "SCHEDULED",
        "PUBLISHED",
      ]),
      currentStage: a.string(),
      thumbnailStatus: a.string(),
      seoStatus: a.string(),
      publishDate: a.datetime(),
      narratives: a.hasMany("Narrative", "projectId"),
      seo: a.hasMany("Seo", "projectId"),
      thumbnails: a.hasMany("Thumbnail", "projectId"),
    })
    .authorization((allow) => [allow.owner()]),

  TimelineEvent: a
    .model({
      caseId: a.id().required(),
      case: a.belongsTo("Case", "caseId"),
      date: a.datetime().required(),
      title: a.string().required(),
      description: a.string(),
      source: a.string(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Evidence: a
    .model({
      caseId: a.id().required(),
      case: a.belongsTo("Case", "caseId"),
      type: a.enum([
        "CCTV",
        "DNA",
        "PHONE_RECORDS",
        "WITNESS_STATEMENT",
        "BODYCAM",
        "COURT_EXHIBIT",
        "AUDIO_RECORDING",
      ]),
      title: a.string().required(),
      description: a.string(),
      reliability: a.integer(),
      source: a.string(),
      mediaUrl: a.string(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Person: a
    .model({
      caseId: a.id().required(),
      case: a.belongsTo("Case", "caseId"),
      name: a.string().required(),
      role: a.enum(["VICTIM", "SUSPECT", "WITNESS", "DETECTIVE", "JUDGE", "FAMILY", "FRIEND"]),
      bio: a.string(),
      status: a.string(),
      image: a.string(),
      relationships: a.json(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Source: a
    .model({
      caseId: a.id().required(),
      case: a.belongsTo("Case", "caseId"),
      publisher: a.string(),
      url: a.string(),
      date: a.datetime(),
      reliability: a.integer(),
      type: a.string(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Narrative: a
    .model({
      projectId: a.id().required(),
      project: a.belongsTo("Project", "projectId"),
      title: a.string().required(),
      opportunityScore: a.integer(),
      confidence: a.enum(["HIGH", "MEDIUM", "LOW"]),
      gapAnalysis: a.json(),
      hook: a.string(),
      storyStructure: a.json(),
    })
    .authorization((allow) => [allow.owner()]),

  Seo: a
    .model({
      projectId: a.id().required(),
      project: a.belongsTo("Project", "projectId"),
      title: a.string(),
      score: a.integer(),
      description: a.string(),
      tags: a.string().array(),
      category: a.string(),
      uploadTime: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Thumbnail: a
    .model({
      projectId: a.id().required(),
      project: a.belongsTo("Project", "projectId"),
      concept: a.string(),
      ctrPrediction: a.float(),
      emotionScore: a.integer(),
      contrastScore: a.integer(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});