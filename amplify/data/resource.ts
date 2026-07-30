import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * VerityPulse Database Schema
 * Source: Product Bible — Part 17 (Database Design)
 *
 * Notes on design decisions:
 * - No separate "Users" table. Cognito (amplify/auth/resource.ts) owns identity.
 *   `UserProfile` holds only app-level fields the bible lists under Users
 *   (subscription, avatar, timezone, etc.) keyed to the Cognito owner.
 * - Variable-shape blobs (channelDNA, storyStructure, relationships,
 *   competitor videos/thumbnails/statistics) are `a.json()`, not fixed
 *   relational tables, since their shape evolves with the AI/provider layer.
 * - Owner-scoped models (UserProfile, Channels, Projects, Notifications,
 *   ActivityLog): allow.owner() only.
 * - Shared intelligence data (Cases, TimelineEvents, Evidence, People,
 *   Sources, CompetitorCache): allow.authenticated() for read+write for now,
 *   since research on the same case should be shared/cached across users.
 *   Tighten to backend-function-only writes once the research pipeline
 *   (Search Router -> AI Router -> store) runs server-side.
 */

const schema = a.schema({
  // ---------------------------------------------------------------------
  // User Profile (app-level fields on top of Cognito identity)
  // ---------------------------------------------------------------------
  UserProfile: a
    .model({
      email: a.string().required(),
      name: a.string(),
      avatar: a.string(),
      subscription: a.enum(['FREE', 'PRO', 'TEAM']),
      timezone: a.string(),
      country: a.string(),
      language: a.string(),
      lastLogin: a.datetime(),
      channels: a.hasMany('Channel', 'userProfileId'),
      projects: a.hasMany('Project', 'userProfileId'),
      notifications: a.hasMany('Notification', 'userProfileId'),
      activity: a.hasMany('ActivityLog', 'userProfileId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------
  Channel: a
    .model({
      youtubeChannelId: a.string().required(),
      channelName: a.string().required(),
      subscriberCount: a.integer(),
      videoCount: a.integer(),
      viewCount: a.integer(),
      country: a.string(),
      language: a.string(),
      lastAnalyzed: a.datetime(),
      channelDNA: a.json(), // content DNA, title DNA, thumbnail DNA, upload DNA
      userProfileId: a.id(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
      projects: a.hasMany('Project', 'channelId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Projects (the production pipeline: Idea -> Published)
  // ---------------------------------------------------------------------
  Project: a
    .model({
      title: a.string().required(),
      status: a.enum([
        'IDEA',
        'RESEARCH',
        'NARRATIVE',
        'SEO',
        'THUMBNAIL',
        'RECORDING',
        'EDITING',
        'SCHEDULED',
        'PUBLISHED',
        'ARCHIVED',
      ]),
      currentStage: a.string(),
      thumbnailStatus: a.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']),
      seoStatus: a.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']),
      publishDate: a.datetime(),
      channelId: a.id(),
      channel: a.belongsTo('Channel', 'channelId'),
      caseId: a.id(),
      case: a.belongsTo('Case', 'caseId'),
      userProfileId: a.id(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
      narratives: a.hasMany('Narrative', 'projectId'),
      seoResults: a.hasMany('SEOResult', 'projectId'),
      thumbnails: a.hasMany('Thumbnail', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Cases (shared intelligence — cached research)
  // ---------------------------------------------------------------------
  Case: a
    .model({
      name: a.string().required(),
      country: a.string(),
      category: a.string(),
      status: a.enum(['SOLVED', 'UNSOLVED', 'COLD_CASE', 'MISSING', 'CONVICTED', 'TRIAL_ONGOING']),
      summary: a.string(), // max 300 words enforced at API layer
      opportunityScore: a.integer(), // 0-100
      competitionScore: a.integer(),
      coverageScore: a.integer(),
      lastUpdated: a.datetime(),
      cacheExpires: a.datetime(), // 7-day research cache per bible
      projects: a.hasMany('Project', 'caseId'),
      timelineEvents: a.hasMany('TimelineEvent', 'caseId'),
      evidence: a.hasMany('Evidence', 'caseId'),
      people: a.hasMany('Person', 'caseId'),
      sources: a.hasMany('Source', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // Timeline Events
  // ---------------------------------------------------------------------
  TimelineEvent: a
    .model({
      date: a.datetime().required(),
      title: a.string().required(),
      description: a.string(),
      source: a.string(),
      caseId: a.id().required(),
      case: a.belongsTo('Case', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // Evidence Vault
  // ---------------------------------------------------------------------
  Evidence: a
    .model({
      type: a.enum([
        'CCTV',
        'DNA',
        'PHONE_RECORDS',
        'WITNESS_STATEMENT',
        'BODYCAM',
        'COURT_EXHIBIT',
        'AUDIO_RECORDING',
        'OTHER',
      ]),
      title: a.string().required(),
      description: a.string(),
      reliability: a.enum(['HIGH', 'MEDIUM', 'LOW']),
      source: a.string(),
      mediaUrl: a.string(),
      caseId: a.id().required(),
      case: a.belongsTo('Case', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // People (victims, suspects, witnesses, etc.)
  // ---------------------------------------------------------------------
  Person: a
    .model({
      name: a.string().required(),
      role: a.enum(['VICTIM', 'SUSPECT', 'WITNESS', 'DETECTIVE', 'JUDGE', 'FAMILY', 'FRIEND', 'OTHER']),
      bio: a.string(),
      status: a.string(),
      image: a.string(),
      relationships: a.json(), // network graph edges for relationship map
      caseId: a.id().required(),
      case: a.belongsTo('Case', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // Sources
  // ---------------------------------------------------------------------
  Source: a
    .model({
      publisher: a.string().required(),
      url: a.string().required(),
      date: a.datetime(),
      reliability: a.enum(['HIGH', 'MEDIUM', 'LOW']),
      type: a.string(),
      caseId: a.id().required(),
      case: a.belongsTo('Case', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // Narratives (Narrative Intelligence output)
  // ---------------------------------------------------------------------
  Narrative: a
    .model({
      title: a.string().required(),
      opportunityScore: a.integer(),
      confidence: a.enum(['HIGH', 'MEDIUM', 'LOW']),
      gapAnalysis: a.string(),
      hook: a.string(),
      storyStructure: a.json(), // cold open, act 1-4, ending
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // SEO Results
  // ---------------------------------------------------------------------
  SEOResult: a
    .model({
      title: a.string().required(),
      score: a.integer(),
      description: a.string(),
      tags: a.string().array(),
      category: a.string(),
      uploadTime: a.datetime(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Thumbnails
  // ---------------------------------------------------------------------
  Thumbnail: a
    .model({
      concept: a.string(),
      ctrPrediction: a.integer(), // percentage
      emotionScore: a.integer(),
      contrastScore: a.integer(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Competitor Cache (24hr TTL per bible cache strategy)
  // ---------------------------------------------------------------------
  CompetitorCache: a
    .model({
      keyword: a.string().required(),
      videos: a.json(),
      thumbnails: a.json(),
      statistics: a.json(),
      expiresAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  Notification: a
    .model({
      type: a.enum(['RESEARCH_COMPLETE', 'TRENDING_CASE', 'COMPETITOR_UPLOAD', 'PUBLISHING_REMINDER']),
      title: a.string().required(),
      body: a.string(),
      read: a.boolean().default(false),
      userProfileId: a.id().required(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
    })
    .authorization((allow) => [allow.owner()]),

  // ---------------------------------------------------------------------
  // Activity Log
  // ---------------------------------------------------------------------
  ActivityLog: a
    .model({
      action: a.string().required(),
      page: a.string(),
      metadata: a.json(),
      userProfileId: a.id().required(),
      userProfile: a.belongsTo('UserProfile', 'userProfileId'),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});