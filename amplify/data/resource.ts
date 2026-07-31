// ---------------------------------------------------------------------
  // Cases (shared intelligence — cached research)
  // ---------------------------------------------------------------------
  Case: a
    .model({
      name: a.string().required(),
      country: a.string(),
      category: a.string(),
      tags: a.string().array(),
      status: a.enum(['SOLVED', 'UNSOLVED', 'COLD_CASE', 'MISSING', 'CONVICTED', 'TRIAL_ONGOING']),
      summary: a.string(), // max 300 words enforced at API layer
      opportunityScore: a.integer(), // 0-100
      competitionScore: a.integer(),
      coverageScore: a.integer(),
      coverageIntelligence: a.json(), // coverage map, angle saturation, untapped angles, editorial feedback
      lastUpdated: a.datetime(),
      cacheExpires: a.datetime(), // 7-day research cache per bible
      projects: a.hasMany('Project', 'caseId'),
      timelineEvents: a.hasMany('TimelineEvent', 'caseId'),
      evidence: a.hasMany('Evidence', 'caseId'),
      people: a.hasMany('Person', 'caseId'),
      sources: a.hasMany('Source', 'caseId'),
    })
    .authorization((allow) => [allow.authenticated()]),