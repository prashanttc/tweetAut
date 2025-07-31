import dotenv from "dotenv";
import { Topic } from "../type";
import OpenAI from "openai";

dotenv.config();

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise((res) => setTimeout(res, delay * attempt));
    }
  }
}

export async function pickTopic(titles: string[]): Promise<number> {
  const client = new OpenAI({
    baseURL: "https://api.studio.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY!,
  });

  const index = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      messages: [
        { role: "system", content: "You are a Twitter growth hacker assistant." },
        { role: "user", content: `
Pick the most tweetable title from this list. Consider virality, emotion, novelty, and curiosity.

Titles:
${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

**Return only the number** corresponding to the best title (for example, "3"), with no extra text.
        ` },
      ],
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || '';
    const idx = parseInt(raw, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= titles.length) {
      throw new Error(`Invalid index returned by model: \"${raw}\"`);
    }
    return idx;
  });

  return index;
}

export async function TechyTweets(topic: Topic): Promise<string> {
  const client = new OpenAI({
    baseURL: "https://api.studio.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY!,
  });
console.log("topic",topic.rawTopic)
const prompt = `
You are Tanishka — a final-year computer science student in India, focused on your final project and interview prep. You analyze tech trends seriously, with a clear eye on how they’ll impact you and others entering the workforce.

Your task is to write a serious, single-tweet reacting to the ${topic.rawTopic}. This tweet must include:
- One clear insight or critique
- use easy to understand words.
- No humor, fluff, or generic statements

Use a mature, analytical, and professional tone. Avoid hashtags ,dashes(-), emojis, or casual phrases. Keep it under 280 characters. Speak like someone who cares deeply about learning and building a career in tech.

Topic: "${topic.rawTopic}"

Avoid copying prior examples. Focus on original, well-informed perspective.
`;


  const tweet = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      messages: [
        { role: "system", content: "You are a gen z , viral and smart final-year female CS student who tweets." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Nebius AI returned an empty tweet.");
    return text;
  });

  return tweet;
}

export async function ShitPostingTweets(topic: Topic): Promise<string> {
  const client = new OpenAI({
    baseURL: "https://api.studio.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY!,
  });

  const prompt = `
You are Zara — a bubbly, unapologetically girly Gen Z girl who tweets about life’s little dramas, relationships, self‑care wins, and girl‑code moments. You speak like you’re texting your bestie: full of 🤍 energy, 1–2 emojis, and zero filter.

Your task: write **one** tweet (under 280 chars) reacting to this general topic. The tweet should:
1. Feel like Zara sharing her honest reaction with a friend.
2. Include a girly detail or emotion (“my eyeliner is crying,” “treat‑yoself vibes,” “ugh the feels”).
3. Be relatable and a tiny bit over‑the‑top.

--- CONTEXT ---
Topic: "${topic.rawTopic}"

--- SAMPLE EXAMPLES ---
• Topic: "When you get friend‑zoned but they still text you every day"  
  Tweet: "So he says he ‘values our friendship’ but texts me memes at 3 AM—am I in the friend‑zone or a meme‑zone? 🤔💔"

• Topic: "Trying to cook dinner after a long day of work"  
  Tweet: "Tried following that ‘easy recipe’ tutorial and now my kitchen looks like a crime scene—send takeout and nap blankets. 🍕🛌"

• Topic: "Period cramps hitting right before a night out"  
  Tweet: "POV: period cramps start 10 mins before I leave for brunch—my Ibuprofen is my new BFF. 🩸😩"

• Topic: "Seeing your ex’s new relationship on social media"  
  Tweet: "Watching my ex glow up with someone else is like seeing a movie trailer of your heartbreak—skip to next season, please. 🎬💔"

• Topic: "Finally nailing your winged eyeliner"  
  Tweet: "When your wings match on the first try, you feel like you can conquer the world—lashes up, confidence up. 💁🏼‍♀️✨"
`;

  const tweet = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      messages: [
        { role: "system", content: "You are a Gen Z, viral and authentic tweet‑writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Nebius AI returned an empty tweet.");
    return text;
  });

  return tweet;
}
