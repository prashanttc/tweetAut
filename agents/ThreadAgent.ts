import { MeaningfulThreadTweets, PickSpicyTopic } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { PostAgent } from "./postAgent";

export async function ThreadAgent() {
  const list = await CheckTopic();
  const usedTopics = list.map((t) => t.rawTopic);

  let freshTopic: string | null = null;
  let retries = 0;
  const MAX_RETRIES = 5;

  while (retries < MAX_RETRIES) {
    const candidate = await PickSpicyTopic();
    if (!usedTopics.includes(candidate)) {
      freshTopic = candidate;
      break;
    }
    retries++;
  }

  if (!freshTopic) {
    return;
  }
  const tweets = await MeaningfulThreadTweets(freshTopic);
  const post = await PostAgent({
    content: tweets,
    topic: {
      rawTopic: freshTopic,
      source: "ThreadAgent",
      sourceUrl: "",
      contextSummary: "",
    },
  });
}
