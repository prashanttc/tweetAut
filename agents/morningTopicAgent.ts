import { GenerateTweet, getGeminiTopicPick } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchHNTopics, fetchRedditTopics } from "../lib/fetchTopics";

export async function MorningAgent() {
  const [reddit, hn] = await Promise.all([
    fetchRedditTopics(),
    fetchHNTopics(),
  ]);

  const allTopics = [...reddit, ...hn].slice(0, 20);

  if (allTopics.length === 0) {
    throw new Error("No topics fetched.");
  }
  const list = await CheckTopic();

  const usedTopics = new Set(list.map((topic) => topic.rawTopic));
  const unusedTopics = allTopics.filter(
    (topic) => !usedTopics.has(topic.rawTopic)
  );
  const selected = await getGeminiTopicPick(unusedTopics);
  const tweet = await GenerateTweet(selected);
  return tweet;
}
