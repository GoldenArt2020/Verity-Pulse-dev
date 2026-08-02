export type SceneKey =
  | "missing-person-street"
  | "missing-person-forest"
  | "court-case-courtroom"
  | "unsolved-murder-urban"
  | "cold-case-archive"
  | "general-city";

import type { ReactElement } from "react";

export const SCENES: Record<SceneKey, () => ReactElement> = {
  "missing-person-street": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky1)" />
      {/* street perspective lines */}
      <polygon points="0,300 160,180 240,180 400,300" fill="#111827" opacity="0.6" />
      <line x1="180" y1="300" x2="195" y2="185" stroke="#334155" strokeWidth="1" opacity="0.4" />
      <line x1="220" y1="300" x2="205" y2="185" stroke="#334155" strokeWidth="1" opacity="0.4" />
      {/* silhouette walking away, backpack */}
      <g transform="translate(200,150)">
        <circle cx="0" cy="0" r="8" fill="#475569" />
        <rect x="-6" y="8" width="12" height="24" rx="3" fill="#475569" />
        <rect x="-5" y="10" width="10" height="14" rx="2" fill="#334155" />
        <rect x="-6" y="32" width="5" height="16" fill="#475569" />
        <rect x="1" y="32" width="5" height="16" fill="#475569" />
      </g>
      {/* faint streetlamp glow */}
      <circle cx="80" cy="120" r="40" fill="#fbbf24" opacity="0.04" />
      <circle cx="320" cy="140" r="40" fill="#fbbf24" opacity="0.04" />
    </svg>
  ),

  "missing-person-forest": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky2)" />
      {[40, 100, 300, 360].map((x, i) => (
        <polygon key={i} points={`${x},300 ${x - 20},180 ${x + 20},180`} fill="#1e293b" opacity="0.7" />
      ))}
      {[70, 150, 250, 330].map((x, i) => (
        <polygon key={i} points={`${x},300 ${x - 30},150 ${x + 30},150`} fill="#111827" opacity="0.5" />
      ))}
      <g transform="translate(200,190)">
        <circle cx="0" cy="0" r="7" fill="#64748b" />
        <rect x="-5" y="7" width="10" height="20" rx="3" fill="#64748b" />
      </g>
    </svg>
  ),

  "court-case-courtroom": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#0f172a" />
      {/* columns */}
      {[60, 340].map((x, i) => (
        <rect key={i} x={x - 8} y="60" width="16" height="200" fill="#1e293b" />
      ))}
      {/* pediment */}
      <polygon points="40,60 360,60 200,20" fill="#1e293b" />
      {/* scale of justice, centered */}
      <g transform="translate(200,130)" stroke="#475569" strokeWidth="3" fill="none">
        <line x1="0" y1="0" x2="0" y2="60" />
        <line x1="-50" y1="10" x2="50" y2="10" />
        <line x1="-50" y1="10" x2="-50" y2="35" />
        <line x1="50" y1="10" x2="50" y2="35" />
        <path d="M -65,35 A 15,15 0 0 0 -35,35" />
        <path d="M 35,35 A 15,15 0 0 0 65,35" />
        <rect x="-25" y="60" width="50" height="8" fill="#475569" stroke="none" />
      </g>
    </svg>
  ),

  "unsolved-murder-urban": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e0f0f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky3)" />
      {/* city skyline silhouette */}
      {[[20,180,40],[70,140,50],[130,200,35],[175,120,60],[245,170,45],[300,150,55],[355,190,30]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height={300 - y} fill="#111827" opacity="0.8" />
      ))}
      {/* police tape line motif, abstracted */}
      <line x1="0" y1="220" x2="400" y2="205" stroke="#dc2626" strokeWidth="6" opacity="0.25" strokeDasharray="18 10" />
    </svg>
  ),

  "cold-case-archive": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#111827" />
      {/* stacked file boxes */}
      {[[60,190,70,60],[150,210,80,50],[250,185,65,65],[330,200,50,55]].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      ))}
      <circle cx="200" cy="90" r="30" fill="#334155" opacity="0.3" />
    </svg>
  ),

  "general-city": () => (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#0f172a" />
      {[[30,190,35],[80,150,45],[140,210,30],[190,130,55],[260,175,40],[315,160,50],[370,195,25]].map(([x,y,w],i) => (
        <rect key={i} x={x} y={y} width={w} height={300 - y} fill="#1e293b" opacity="0.7" />
      ))}
    </svg>
  ),
};