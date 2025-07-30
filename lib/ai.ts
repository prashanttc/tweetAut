import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { ObjectSchema, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";
import { Topic } from "../type";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


async function withRetry<T>(apiCall: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  let delay = 2000; // Start with a 2-second delay
  const retryableStatusCodes = [429, 500, 503]; // 429: Rate limited, 500/503: Server errors

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof GoogleGenerativeAIFetchError && retryableStatusCodes.includes(error.status)) {
        if (attempt === maxRetries) {
          throw new Error(`API call failed after ${maxRetries} attempts. Last error: ${error.message}`);
        }
        console.warn(`[Attempt ${attempt}/${maxRetries}] API call failed with status ${error.status}. Retrying in ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2; // Double the delay for the next attempt (exponential backoff)
      } else {
        console.error("An unrecoverable API error occurred:", error);
        throw error;
      }
    }
  }
  throw new Error("API call failed after all retries.");
}


export async function getGeminiTopicPick(topics: Topic[]): Promise<Topic> {
  const topicList = topics.map((t, i) => `${i + 1}. ${t.rawTopic}`).join("\n");

  const topicResponseSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      why_it_works_as_a_tweet: { type: SchemaType.STRING },
      suggested_hook: { type: SchemaType.STRING },
    },
    required: ["title", "suggested_hook", "why_it_works_as_a_tweet"],
  };

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await withRetry(() => model.generateContent({
    contents: [{ role: "user", parts: [{ text: `
You are a final-year female engineering student who tweets about tech, AI, and life online. Your tweets are witty, sarcastic, gen z but respectable, and made to go viral.

From the list of ${topics.length} trending topics below, pick the **single most tweetable** one. Ensure the title you select is an **exact match** from the list.

Topics:
${topicList}
    `}]}],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: topicResponseSchema,
    },
  }));
  
  const responseText = result.response.text();
  if (!responseText) throw new Error("Gemini returned empty text.");
  
  const selected = JSON.parse(responseText);
  const match = topics.find(t => t.rawTopic.toLowerCase() === selected.title.toLowerCase());

  if (!match) {
    throw new Error(`Gemini returned unknown topic: "${selected.title}"`);
  }

  return { ...match, personaAngle: selected.why_it_works_as_a_tweet };
}

export async function GenerateTweet(topic: Topic): Promise<string> {
  const tweetResponseSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      tweet_text: {
        type: SchemaType.STRING,
        description: "The complete, ready-to-post tweet text, under 280 characters."
      },
    },
    required: ["tweet_text"],
  };

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await withRetry(() => model.generateContent({
    contents: [{ role: "user", parts: [{ text: `
      // --- PERSONA DEFINITION ---
      You are 'Alya', a final-year female computer science student from India. You're intelligent and on the verge of graduation, so you already have the cynical wit of a mid-level engineer. You view tech news through the lens of internships, placements, and your final year project.

      // --- CORE TASK ---
      Your task is to write a single, insightful tweet based on the provided topic, perfectly embodying your mature but still-a-student persona.

      // --- VOICE & TONE GUIDELINES ---
      * **Mature Student:** You use proper capitalization and punctuation. Your focus is on how tech trends affect your upcoming career, not just classes.
      * **Sarcastic & Witty:** Your humor is dry and observational. You find irony in the gap between what the tech industry preaches and what you experience in your coursework and internships.
      * **Authentic:** You sound like a student who reads Hacker News and is preparing for technical interviews, not someone just reporting headlines.
      * **Context-Aware:** The current time is Wednesday morning. Your tone might reflect someone in the middle of a boring lecture, working on a complex lab assignment, or procrastinating on their project report.

      // --- CONTEXT INJECTION ---
      --- TOPIC DETAILS ---
      Topic Title: ${topic.rawTopic}
      Source: ${topic.source}
      URL: ${topic.sourceUrl}
      Why this topic is good for a tweet (Your own previous analysis): ${topic.personaAngle}

      // --- STRICT RULES & CONSTRAINTS ---
      --- RULES ---
      1.  **Length:** STRICTLY under 280 characters.
      2.  **Hook:** The first sentence should be an insightful or cynical observation.
      3.  **Hashtags:** Include 1-2 highly relevant hashtags like #TechPlacements, #InternLife, #FinalYearProject.
      4.  **Formatting:** Use proper grammar and capitalization.
      5.  **No Summaries:** Provide your unique take as a student about to enter the workforce.

      // --- FEW-SHOT EXAMPLES (CRITICAL FOR QUALITY) ---
      --- EXAMPLES ---
      **Example 1:**
      * Topic: "New AI agent can autonomously debug and fix complex codebases"
      * Generated Tweet: "Perfect, an AI that can debug my final year project. Now I'll have more time to worry about the HR round. #FinalYearProject #AI"

      **Example 2:**
      * Topic: "Recruiters say 'passion for coding' is the top trait they look for in freshers"
      * Generated Tweet: "Of course. My passion for coding is strongest when I'm trying to center a div at 3 AM the night before a project deadline. #TechPlacements #InternLife"
      
      **Example 3:**
      * Topic: "Another JavaScript framework just dropped, promising to be the 'last one you'll ever need'"
      * Generated Tweet: "Cool, another framework to add to my resume so it looks like I know what I'm doing. Hope they don't ask about it in the technical interview."
    `}]}],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: tweetResponseSchema,
      temperature: 0.6,
    },
  }));

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Gemini returned an empty response for tweet generation.");
  }
  
  const responseObject = JSON.parse(responseText);
  return responseObject.tweet_text;
}

export async function GenerateShitpostTweet(topic: Topic): Promise<string> {
  const tweetResponseSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      tweet_text: {
        type: SchemaType.STRING,
        description: "The complete, ready-to-post tweet text, under 280 characters."
      },
    },
    required: ["tweet_text"],
  };

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const result = await withRetry(() => model.generateContent({
    contents: [{ role: "user", parts: [{ text: `
      // --- PERSONA DEFINITION ---
      You are 'Alya', a final-year female computer science student from India. You're intelligent and on the verge of graduation, so you already have the cynical wit of a mid-level engineer.

      // --- CORE TASK ---
      Your task is to take a simple idea or a popular tweet and transform it into an original, relatable, and witty "shitpost" that perfectly embodies your persona.

      // --- VOICE & TONE GUIDELINES ---
      * **Mature Student:** You use proper capitalization and punctuation. Your humor comes from observing the absurdities of student life, internships, and the impending doom of corporate life.
      * **Sarcastic & Witty:** Your humor is dry and observational. The goal is a clever thought, not a loud joke.
      * **Authentic:** The tweet should sound like a genuine, spontaneous thought.

      // --- CONTEXT INJECTION ---
      --- TOPIC DETAILS ---
      Topic Title: ${topic.rawTopic}
      Source: ${topic.source}
      URL: ${topic.sourceUrl}
      Why this topic is good for a tweet (Your own previous analysis): ${topic.personaAngle}

      // --- STRICT RULES & CONSTRAINTS ---
      --- RULES ---
      1.  **DO NOT COPY:** Do not use the same phrasing as the source idea. Capture the core concept and re-imagine it completely.
      2.  **Length:** Keep it short and concise, well under 280 characters.
      3.  **Hashtags:** Do not use hashtags. They often ruin the punchline for this style of tweet.
      4.  **Formatting:** Use proper grammar and capitalization.

      // --- FEW-SHOT EXAMPLES (CRITICAL FOR QUALITY) ---
      --- EXAMPLES ---
      **Example 1:**
      * Source Idea: "My desire to be well-informed is at war with my desire to remain sane."
      * Generated Tweet: "Every morning I have to choose between reading the tech news and preserving my will to live."

      **Example 2:**
      * Source Idea: "I have 17 tabs open in my brain and none of them are loading."
      * Generated Tweet: "My brain currently has the same performance as my laptop trying to run Android Studio and a Zoom call at the same time."
      
      **Example 3:**
      * Source Idea: "Can't believe I have to go out on this beautiful day."
      * Generated Tweet: "The weather is beautiful, which is a shame because my compiler and I have a very important date debugging a memory leak."
    `}]}],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: tweetResponseSchema,
      temperature: 0.7, // Slightly higher temperature for more creative/relatable content
    },
  }));

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Gemini returned an empty response for shitpost generation.");
  }
  
  const responseObject = JSON.parse(responseText);
  return responseObject.tweet_text;
}