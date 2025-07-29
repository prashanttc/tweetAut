// fetchRedditTopics.ts
import snoowrap from "snoowrap";
import dotenv from "dotenv";
import { Topic } from "../type";

dotenv.config();

const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

export async function fetchRedditTopics(
  subreddits = ["futurology", "technology", "TwoXChromosomes"]
): Promise<Topic[]> {
  const posts: Topic[] = [];

  for (const sub of subreddits) {
    const top = await reddit.getSubreddit(sub).getNew({ limit: 3 });
    top.forEach((post) => {
      posts.push({
        rawTopic: post.title,
        source: `Reddit /r/${sub}`,
        sourceUrl: `https://reddit.com${post.permalink}`,
        contextSummary: post.selftext?.slice(0, 280) || "",
      });
    });
  }

  return posts;
}
// fetchHNTopics
export async function fetchHNTopics(): Promise<Topic[]> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?tags=story"
  );
  const data = await res.json();

  return data.hits.map((hit: any) => ({
    rawTopic: hit.title,
    source: "Hacker News",
    sourceUrl:
      hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    contextSummary: hit.story_text || "",
  }));
}
