"use client";

const VIDEOS = [
  { rank: 1, title: "The Disappearance of Lana Purcell: Police Ignored?", score: 92, views: "231.4K", viewsChange: "24.5%", watchTime: "18.7K", watchChange: "28.1%", avgDuration: "15:32", durationChange: "16.3%", ctr: "7.6%", ctrChange: "18.4%", retention: "52.1%", retentionChange: "9.8%", likes: "9.1K", comments: "1.2K", published: "Jun 2, 2026" },
  { rank: 2, title: "Natalie Hemming: The Evidence They Missed", score: 89, views: "174.8K", viewsChange: "17.9%", watchTime: "13.2K", watchChange: "21.6%", avgDuration: "14:08", durationChange: "13.2%", ctr: "6.9%", ctrChange: "15.7%", retention: "48.3%", retentionChange: "8.1%", likes: "7.4K", comments: "931", published: "May 26, 2026" },
  { rank: 3, title: "The Mysterious Case of Andrew Gosden", score: 87, views: "142.3K", viewsChange: "16.2%", watchTime: "10.1K", watchChange: "19.4%", avgDuration: "13:24", durationChange: "11.8%", ctr: "6.2%", ctrChange: "14.1%", retention: "45.7%", retentionChange: "7.2%", likes: "6.3K", comments: "812", published: "May 18, 2026" },
  { rank: 4, title: "Georgina Gharsallah: Life, Lies & Deception", score: 85, views: "118.6K", viewsChange: "11.3%", watchTime: "8.6K", watchChange: "14.6%", avgDuration: "12:51", durationChange: "9.7%", ctr: "5.8%", ctrChange: "11.3%", retention: "43.2%", retentionChange: "6.3%", likes: "5.2K", comments: "623", published: "May 10, 2026" },
  { rank: 5, title: "When Police Get It Wrong: 5 True Cases", score: 82, views: "97.3K", viewsChange: "9.8%", watchTime: "7.1K", watchChange: "12.3%", avgDuration: "11:46", durationChange: "8.9%", ctr: "5.1%", ctrChange: "10.5%", retention: "41.6%", retentionChange: "5.9%", likes: "4.7K", comments: "541", published: "May 3, 2026" },
];

export function TopPerformingVideos() {
  return (
    <div className="glass-card col-span-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Top Performing Videos</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All Videos</button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="grid grid-cols-[24px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-2 pb-2 text-[10px] font-medium uppercase text-slate-500">
          <span>#</span><span>Video</span><span className="text-right">Views</span><span className="text-right">Watch Time (Hours)</span>
          <span className="text-right">Avg. View Duration</span><span className="text-right">CTR</span><span className="text-right">Retention</span>
          <span className="text-right">Likes</span><span className="text-right">Comments</span><span className="text-right">Published</span>
        </div>

        {VIDEOS.map((v) => (
          <div key={v.rank} className="grid grid-cols-[24px_2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 rounded-lg px-2 py-2.5 hover:bg-slate-800/40">
            <span className="text-xs text-slate-500">{v.rank}</span>
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-slate-800" />
              <span className="truncate text-[13px] font-medium text-white">{v.title}</span>
              <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">{v.score}</span>
            </span>
            <Cell value={v.views} change={v.viewsChange} />
            <Cell value={v.watchTime} change={v.watchChange} />
            <Cell value={v.avgDuration} change={v.durationChange} />
            <Cell value={v.ctr} change={v.ctrChange} />
            <Cell value={v.retention} change={v.retentionChange} />
            <span className="text-right text-xs text-slate-300">{v.likes}</span>
            <span className="text-right text-xs text-slate-300">{v.comments}</span>
            <span className="text-right text-[11px] text-slate-500">{v.published}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 text-center">
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300">
          View Full Analytics Dashboard →
        </button>
      </div>
    </div>
  );
}

function Cell({ value, change }: { value: string; change: string }) {
  return (
    <span className="text-right">
      <span className="block text-xs text-slate-300">{value}</span>
      <span className="block text-[10px] text-emerald-400">↑ {change}</span>
    </span>
  );
}