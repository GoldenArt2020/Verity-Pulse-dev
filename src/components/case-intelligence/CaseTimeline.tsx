"use client";

const EVENTS = [
  { date: "17 Jan 2011", title: "Last Seen", desc: "Lana was last seen near Wellesley Road, London at 9:15am.", color: "bg-blue-500" },
  { date: "18 Jan 2011", title: "Reported Missing", desc: "Family reported Lana missing to Met Police.", color: "bg-blue-500" },
  { date: "Oct 2012", title: "Family Campaign", desc: "Family demanded action and specialist investigation.", color: "bg-emerald-500" },
  { date: "Feb 2014", title: "Homicide Review", desc: "Met Police Homicide team begins formal review.", color: "bg-blue-500" },
  { date: "Mar 2016", title: "Searches Conducted", desc: "Police conducted searches in areas of interest.", color: "bg-purple-500" },
  { date: "Sept 2020", title: "£20k Reward", desc: "Met Police announced £20,000 reward for information.", color: "bg-amber-500" },
  { date: "Early 2021", title: "Cold Case Unit", desc: "Case moved to Operation Kagal (Cold Case Murder Team).", color: "bg-rose-500" },
];

export function CaseTimeline() {
  return (
    <div className="glass-card rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Case Timeline</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View Full Timeline ⌄</button>
      </div>

      <div className="relative mt-6 grid grid-cols-7 gap-3">
        <div className="absolute left-0 right-0 top-2 h-px bg-slate-800" />
        {EVENTS.map((e) => (
          <div key={e.title} className="relative">
            <div className={`absolute -top-[1.65rem] left-0 h-3 w-3 rounded-full ring-4 ring-slate-950 ${e.color}`} />
            <p className="text-[11px] font-medium text-slate-500">{e.date}</p>
            <p className="mt-1 text-[13px] font-semibold text-white">{e.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">{e.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}