/**
 * Quick manual test for youtubeProvider.getChannelVideos
 *
 * Usage:
 *   1. Copy this file into your verity-pulse project, e.g.:
 *        src/providers/youtube/test-getChannelVideos.ts
 *   2. Make sure YOUTUBE_API_KEY is available in process.env
 *      (if you use dotenv, add: import "dotenv/config"; at the very top)
 *   3. Run it with tsx or ts-node:
 *        npx tsx src/providers/youtube/test-getChannelVideos.ts <handle>
 *      e.g.
 *        npx tsx src/providers/youtube/test-getChannelVideos.ts mkbhd
 *
 *   If you don't have tsx installed: npm install -D tsx
 */

// Adjust this import path to match where you place this file relative to youtubeProvider.ts
import { youtubeProvider } from "./youtubeProvider";

async function main() {
  const handle = process.argv[2] ?? "mkbhd"; // default test channel, override via CLI arg
  const limit = Number(process.argv[3] ?? 10); // small default so you don't burn quota

  console.log(`\n[1/3] Checking config...`);
  if (!youtubeProvider.isConfigured()) {
    console.error("❌ YOUTUBE_API_KEY is not set in process.env. Aborting.");
    process.exit(1);
  }
  console.log("✅ API key detected.");

  console.log(`\n[2/3] Resolving handle "@${handle}"...`);
  const channel = await youtubeProvider.resolveHandle(handle);
  if (!channel) {
    console.error(`❌ Could not resolve channel for handle "${handle}"`);
    process.exit(1);
  }
  console.log(`✅ Resolved: ${channel.title} (${channel.channelId})`);
  console.log(`   uploadsPlaylistId: ${channel.uploadsPlaylistId}`);
  console.log(`   subscribers: ${channel.subscriberCount}, videos: ${channel.videoCount}`);

  if (!channel.uploadsPlaylistId) {
    console.error("❌ No uploadsPlaylistId returned — can't fetch videos.");
    process.exit(1);
  }

  console.log(`\n[3/3] Fetching up to ${limit} videos from uploads playlist...`);
  const videos = await youtubeProvider.getChannelVideos(channel.uploadsPlaylistId, limit);

  console.log(`✅ Got ${videos.length} videos:\n`);
  for (const v of videos) {
    console.log(
      `- ${v.title}\n  videoId: ${v.videoId} | views: ${v.viewCount} | likes: ${v.likeCount} | duration: ${v.durationSeconds}s | published: ${v.publishedAt}`
    );
  }

  console.log("\n✅ Test complete.");
}

main().catch((err) => {
  console.error("\n❌ Test failed with error:");
  console.error(err);
  process.exit(1);
});