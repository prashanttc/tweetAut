import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

export async function PostAgent(content: string): Promise<void> {
  try {
    const tweet = await client.v2.tweet(content);
    console.log("✅ Tweet posted:", `https://twitter.com/i/web/status/${tweet.data.id}`);
  } catch (err) {
    console.error("❌ Failed to post tweet:", err);
  }
}
