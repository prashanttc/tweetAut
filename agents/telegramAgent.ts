import { MeaningfulThreadTweets, PickSpicyTopic } from "../lib/ai";
import { pickTopic, ShitPostingTweets, TechyTweets } from "../lib/ai";
import { CheckTopic } from "../lib/dbActions";
import { fetchShitpostTopics, fetchTechTopics } from "../lib/fetchTopics";

export async function GenerateTweet(type: "tech" | "shitposting") {
  let topics = [];
  if (type === "tech") {
    topics = await fetchTechTopics();
  } else {
    topics = await fetchShitpostTopics();
  }
  const allTopics = [...topics].slice(0, 20);

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
  let tweet = "";
  if (type === "tech") {
    tweet = await TechyTweets(selectedTopic);
  } else {
    tweet = await ShitPostingTweets(selectedTopic);
  }
  return { selectedTopic, tweet };
}

export async function threadBot() {
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
  return {
    tweets,
      topic: {
        rawTopic: freshTopic,
        source: "ThreadAgent",
        sourceUrl: "",
        contextSummary: "",
      },
  };
}
