import { TechyTweets, pickTopic } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchTechTopics } from "../lib/fetchTopics";
import { PostAgent } from "./postAgent";

export async function MorningAgent() {
  const reddit = await fetchTechTopics();
  const allTopics = [...reddit].slice(0, 20);

  if (allTopics.length === 0) {
    throw new Error("No topics fetched.");
  }
  const list = await CheckTopic();
  const usedTopics = new Set(list.map((topic) => topic.sourceUrl));
  const unusedTopics = allTopics.filter(
    (topic) => !usedTopics.has(topic.sourceUrl)
  );
  const titles = [...unusedTopics.map((title) => title.rawTopic)];
  const selected = await pickTopic(titles);
  const selectedTopic = unusedTopics[selected];
  const tweet = await TechyTweets(selectedTopic);
  const post = await PostAgent({ content: tweet, topic: selectedTopic });
  return;
}
