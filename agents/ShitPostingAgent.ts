import { pickTopic, ShitPostingTweets } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchShitpostTopics } from "../lib/fetchTopics";
import { PostAgent } from "./postAgent";

export async function ShitPostingAgent() {
  const reddit = await fetchShitpostTopics();
  const allTopics = [...reddit].slice(0, 20);
  const list = await CheckTopic();
  const usedTopics = new Set(list.map((topic) => topic.sourceUrl));
  const unusedTopics = allTopics.filter(
    (topic) => !usedTopics.has(topic.sourceUrl)
  );
  const titles = [...unusedTopics.map((title) => title.rawTopic)];
  const selected = await pickTopic(titles);
  const selectedTopic = unusedTopics[selected];
  const tweet = await ShitPostingTweets(selectedTopic);
  const post = await PostAgent({ content: tweet, topic: selectedTopic });
  return;
}
