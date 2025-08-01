import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";
import { saveTopic, saveTweet } from "../lib/dbActions";
import { Topic } from "../type";
import { sendEmailNotification } from "../lib/email";

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

export async function PostAgent({
  content,
  topic,
}: {
  content: string;
  topic: Topic;
}): Promise<void> {
  try {
    const tweet = await client.v2.tweet(content);
    console.log(
      "✅ Tweet posted:",
      `https://twitter.com/i/web/status/${tweet.data.id}`
    );
    const url = `https://twitter.com/i/web/status/${tweet.data.id}`;
    const topicId = await saveTopic(topic);
    await saveTweet({ tweet: tweet.data.text, url: url, id: topicId });
    sendEmailNotification(tweet.data.text, "posted");
  } catch (err) {
    console.error("❌ Failed to post tweet:", err);
    sendEmailNotification("failed to post tweer", "failed");
  }
}
