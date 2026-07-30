export const CURRENT_USAGE = [
  { label: "Opportunity Searches", value: 248, max: null, pct: 62 },
  { label: "AI Insights", value: 142, max: null, pct: 45 },
  { label: "Storage", value: "12.4 GB", max: "100 GB", pct: 12 },
  { label: "Team Members", value: 8, max: 10, pct: 80 },
];

export const PLANS = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for getting started",
    features: ["Up to 5 opportunity searches", "Basic AI insights", "1 project", "1 GB storage", "Community support"],
    cta: "Current Plan",
    popular: false,
  },
  {
    name: "VerityPulse Pro",
    price: "$49/month",
    desc: "For serious creators & small teams",
    features: ["Unlimited opportunity searches", "Advanced AI insights", "10 projects", "Up to 10 team members", "100 GB storage", "Premium integrations", "Priority support"],
    cta: "Current Plan (Monthly)",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199/month",
    desc: "For large teams & organizations",
    features: ["Everything in Pro", "Unlimited team members", "Custom integrations", "200 GB+ storage", "Dedicated customer success", "API access", "SLA guarantee"],
    cta: "Contact Sales",
    popular: false,
  },
];

export const BILLING_HISTORY = [
  { date: "Jan 24, 2026", desc: "VerityPulse Pro - $49.00" },
  { date: "Dec 24, 2025", desc: "VerityPulse Pro - $49.00" },
  { date: "Nov 24, 2025", desc: "VerityPulse Pro - $49.00" },
  { date: "Oct 24, 2025", desc: "VerityPulse Pro - $49.00" },
];

export const INVOICES = [
  { date: "Jan 24, 2026", amount: "$49.00" },
  { date: "Dec 24, 2025", amount: "$49.00" },
  { date: "Nov 24, 2025", amount: "$49.00" },
];

export const USAGE_CHART_DATA = [
  { date: "Dec 20", searches: 120, insights: 60 },
  { date: "Dec 25", searches: 160, insights: 90 },
  { date: "Dec 30", searches: 140, insights: 110 },
  { date: "Jan 4", searches: 190, insights: 130 },
  { date: "Jan 9", searches: 170, insights: 150 },
  { date: "Jan 14", searches: 210, insights: 160 },
  { date: "Jan 19", searches: 248, insights: 142 },
];

export const PAYMENT_SECURITY = ["PCI DSS Compliant", "256-bit SSL Encryption", "GDPR Compliant", "Secure Tokenization"];

export const USAGE_TIPS = [
  "Get more from VerityPulse",
  "Explore new integrations",
  "Use AI insights for faster analysis",
  "Invite your team for better results",
  "Check out Pro feature updates",
];