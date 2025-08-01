import { log } from "console";
import { TechyTweets, pickTopic } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchTechTopics } from "../lib/fetchTopics";
import { PostAgent } from "./postAgent";

export async function TechPostingAgent() {
    const reddit = await fetchTechTopics();
    const allTopics = [...reddit].slice(0, 20);

  if (allTopics.length === 0) {
    throw new Error("No topics fetched.");
  }
  const list = await CheckTopic();
  const usedTopics = new Set(list.map((topic) => topic.sourceUrl));
  console.log("used",usedTopics)
  const unusedTopics = allTopics.filter(
    (topic) => !usedTopics.has(topic.sourceUrl)
  );
  console.log('unused',unusedTopics)
  const titles = [...unusedTopics.map((title) => title.rawTopic)];
  const selected = await pickTopic(titles);
  console.log("selected",selected)
  const selectedTopic = unusedTopics[selected];
  console.log("selected topic",selectedTopic)

  const tweet = await TechyTweets(selectedTopic);
  const post = await PostAgent({ content: tweet, topic: selectedTopic });
  return;
}
