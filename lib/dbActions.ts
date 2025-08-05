import { Topic } from "../type";
import { prisma } from "./prisma";

export async function CheckTopic() {
  try {
    const list = await prisma.usedTopics.findMany({
      select: {
        sourceUrl: true,
        rawTopic:true
      },
    });
    return list;
  } catch (error) {
    console.error(error.message || "internal server error");
  }
}

export async function saveTweet({
  tweet,
  url,
  id,
}: {
  tweet: string;
  url: string;
  id: string;
}) {
  try {
    const Tweet = await prisma.tweet.create({
      data: {
        content: tweet,
        postUrl: url,
        usedTopicId: id,
      },
    });
    if (!Tweet) {
      throw new Error("unable to save tweet");
    }
    return { success: true };
  } catch (error) {
    console.error(error.message || "internal server error");
  }
}

export async function saveTopic(topic: Topic) {
  try {
    const res = await prisma.usedTopics.create({
      data: {
        rawTopic: topic.rawTopic,
        source: topic.source,
        sourceUrl: topic.sourceUrl,
        contextSummary: topic.contextSummary,
      },
    });
    return res.id;
  } catch (error) {
    console.error(error.message || "internal server error");
  }
}
