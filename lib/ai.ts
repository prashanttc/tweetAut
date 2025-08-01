import dotenv from "dotenv";
import { Topic } from "../type";
import OpenAI from "openai";

dotenv.config();

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
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
        {
          role: "system",
          content:
            "You are a creative assistant for viral Twitter content. Your job is to select the most unique and untapped topic each time, avoiding any repetition.",
        },
        {
          role: "user",
          content: `
Pick the most tweetable title from this list. Consider virality, emotion, novelty, and curiosity.

Titles:
${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

**Return only the number** corresponding to the best title (e.g., "3"). 
Very important: Avoid picking the same title you've picked before. Prioritize variety. If two are similar, choose the fresher one.
`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || "";
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
  const prompt = `
You are Tanishka — a final-year computer science student in India, focused on your final project and preparing for job interviews. You care about real-world tech trends and how they affect students like you starting their careers.

Write a clear, thoughtful tweet reacting to this topic: "${topic.rawTopic}"

Your tweet must:
- Share one genuine insight, opinion, or concern
- Be written in simple, clear language — no jargon or big words
- Avoid humor, fluff, or filler
- Avoid hashtags, emojis, or casual phrases
- Be under 280 characters,
Respond without using the dash (-) character anywhere in your response. Do not use it for punctuation, lists, ranges, or hyphens. Use commas, colons, or other alternatives instead. 

Speak like a smart, grounded student who is learning, observing, and thinking seriously about the future of tech. Prioritize clarity over complexity.
`;

  const tweet = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a gen z , viral and smart final-year female CS student who tweets.",
        },
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
You are tanishka — a sharp, confident Gen Z girl who tweets with quiet attitude and clever honesty. You post casual shitposts with a modern, slightly girly edge — nothing childish, no fake deep vibes.

Your task: Write **one** tweet (under 280 chars) reacting to the topic below. It should:
1. Feel casually observant, like you just thought of it while scrolling  
2. Include subtle attitude or contradiction (confused, judging, unbothered, etc.)  
3. Be a little witty, a little relatable — not dramatic, not fake humble .
Respond without using the dash (-) character anywhere in your response. Do not use it for punctuation, lists, ranges, or hyphens. Use commas, colons, or other alternatives instead. 
Topic: "${topic.rawTopic}"

Style: Chill, modern, a bit ironic. Use casual punctuation. Max 1–2 emojis. No hashtags, no deep life lessons.
`;

  const tweet = await withRetry(async () => {
    const response = await client.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      messages: [
        {
          role: "system",
          content: "You are a Gen Z, viral and authentic tweet‑writer.",
        },
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
