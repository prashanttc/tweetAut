import { GenerateShitpostTweet, getGeminiTopicPick } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchShitpostTopics } from "../lib/fetchTopics";
import { PostAgent } from "./postAgent";

export async function ShitPostingAgent(){
    const reddit = await fetchShitpostTopics();
    const allTopics = [...reddit].slice(0,20);
      if (allTopics.length === 0) {
        throw new Error("No topics fetched.");
      }
      const list = await CheckTopic();
    
      const usedTopics = new Set(list.map((topic) => topic.sourceUrl));
      const unusedTopics = allTopics.filter(
        (topic) => !usedTopics.has(topic.sourceUrl)
      );
      const selected = await getGeminiTopicPick(unusedTopics);
      const tweet = await GenerateShitpostTweet(selected);
      const post = await PostAgent({ content: tweet, topic: selected });
      return;
}