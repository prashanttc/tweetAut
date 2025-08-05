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
  content: string | string[];
  topic: Topic;
}): Promise<void> {
  try {
    const isThread = Array.isArray(content);
    const tweetBodies = isThread ? content : [content];
    let previousTweetId: string | undefined;
    let firstTweetUrl: string | null = null;

    const topicId = await saveTopic(topic);
    for (let i = 0; i < tweetBodies.length; i++) {
      const tweet = await client.v2.tweet({
        text: tweetBodies[i],
        reply: previousTweetId
          ? { in_reply_to_tweet_id: previousTweetId }
          : undefined,
      });

      const url = `https://twitter.com/i/web/status/${tweet.data.id}`;

      if (i === 0) {
        firstTweetUrl = url;
        await saveTweet({ tweet: tweet.data.text, url: url, id: topicId });
      }


      previousTweetId = tweet.data.id;

      if (i < tweetBodies.length - 1) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    await sendEmailNotification(
      isThread ? "Thread posted successfully" : tweetBodies[0],
      "posted"
    );
    console.log("✅ Thread posted.");
  } catch (err) {
    console.error("❌ Failed to post tweet/thread:", err);
    await sendEmailNotification("failed to post tweet/thread", "failed");
  }
}

