"use client";

import { motion } from "framer-motion";
import { UNTAPPED_ANGLES } from "@/constants/coverageIntelligence";

export function UntappedAngles({ caseId }: { caseId?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#FAFAFA]">Untapped Angles</h2>

      <div className="mt-5 space-y-4">
        {UNTAPPED_ANGLES.map((angle, i) => (
          <motion.div
            key={angle.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="rounded-[18px] border border-white/[0.06] bg-[#111114] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-[#FAFAFA]">{angle.title}</h3>
              <div className="flex shrink-0 gap-4 text-right">
                <div>
                  <p className="text-xs text-[#71717A]">Opportunity</p>
                  <p className="text-sm font-bold text-emerald-400">{angle.opportunityScore}</p>
                </div>
                <div>
                  <p className="text-xs text-[#71717A]">Coverage</p>
                  <p className="text-sm font-bold text-[#FAFAFA]">{angle.coverage}%</p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-[#71717A]">Why this angle matters</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">{angle.why}</p>

            <p className="mt-4 text-xs font-medium text-[#71717A]">Potential documentary questions</p>
            <ul className="mt-1.5 space-y-1">
              {angle.questions.map((q) => (
                <li key={q} className="text-sm text-[#A1A1AA]">· {q}</li>
              ))}
            </ul>

            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4 text-sm">
              <div>
                <p className="text-xs text-[#71717A]">Originality</p>
                <p className="font-semibold text-[#FAFAFA]">{angle.originality}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A]">Evidence Strength</p>
                <p className="font-semibold text-[#FAFAFA]">{angle.evidenceStrength}</p>
              </div>
              <div>
                <p className="text-xs text-[#71717A]">Audience Match</p>
                <p className="font-semibold text-[#FAFAFA]">{angle.audienceMatch}%</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}