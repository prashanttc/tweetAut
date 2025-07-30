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

export async function fetchTechTopics(
  subreddits = ["futurology", "technology", "webdev", "programming", "MachineLearning", "coding"]
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


export async function fetchShitpostTopics(
  subreddits = ["ProgrammerHumor", "techsupportgore", "ITcareerquestions", "girlsgonewired", "technicallythetruth", "facepalm"]
): Promise<Topic[]> {
  const posts: Topic[] = [];

  for (const sub of subreddits) {
    const top = await reddit.getSubreddit(sub).getHot({ limit: 3 });
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
