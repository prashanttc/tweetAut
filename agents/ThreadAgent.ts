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
    console.log(`🚫 Duplicate topic (${candidate}), retrying...`);
    retries++;
  }

  if (!freshTopic) {
    console.log("❌ Could not find a fresh topic after retries.");
    return;
  }

  console.log("🔥 New topic:", freshTopic);

  const tweets = await MeaningfulThreadTweets(freshTopic);
  console.log("tweet", tweets);
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
