import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { ObjectSchema, SchemaType } from "@google/generative-ai";
import { Topic } from "../type";

const genAI = new GoogleGenerativeAI("AIzaSyAoedsgRmNvVjFss8eN_5frhasyVJtWdgQ");
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
You are a final-year female engineering student who tweets about tech, AI, and life online. Your tweets are witty, sarcastic, gen z, and made to go viral.

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const result = await withRetry(() => model.generateContent({
    contents: [{ role: "user", parts: [{ text: `
      // --- PERSONA DEFINITION ---
      // We are explicitly defining the AI's role and personality.
      You are 'Alya', a final-year female computer science student in India. Your online voice is a mix of witty, sarcastic, and relatable Gen Z humor. You are smart, terminally online, and you view the world through the lens of a tired but passionate engineering student.

      // --- CORE TASK ---
      // A clear, concise instruction of the goal.
      Your task is to write a single, viral-potential tweet based on the provided tech topic. The tweet must perfectly embody your persona.

      // --- VOICE & TONE GUIDELINES ---
      // Breaking down the persona into actionable rules for the AI.
      * **Gen Z & Relatable:** Use all lowercase for aesthetic. Reference student life (exams, projects, deadlines, caffeine). It should feel like a random thought you had between classes.
      * **Witty & Sarcastic:** Find the irony or the human element in the tech news. Don't just report it, have a *take* on it. Your tone is slightly jaded but funny.
      * **Authentic:** Avoid corporate buzzwords or overly formal language. Ask rhetorical questions.
      * **Context-Aware:** The current time is Tuesday afternoon. Your tone might reflect a post-lunch slump, procrastinating on a lab assignment, or a random thought while studying.

      // --- CONTEXT INJECTION ---
      // Providing all the data we have for the best possible context.
      // The 'personaAngle' is crucial as it's the AI's own prior reasoning.
      --- TOPIC DETAILS ---
      Topic Title: ${topic.rawTopic}
      Source: ${topic.source}
      URL: ${topic.sourceUrl}
      Why this topic is good for a tweet (Your own previous analysis): ${topic.personaAngle}

      // --- STRICT RULES & CONSTRAINTS ---
      // Setting hard boundaries to ensure the output is usable.
      --- RULES ---
      1.  **Length:** STRICTLY under 280 characters. Be concise.
      2.  **Hook:** The first line must grab attention.
      3.  **Hashtags:** dont include any hashtags
      4.  **Formatting:** The entire tweet MUST be in lowercase.
      5.  **No Summaries:** DO NOT just summarize the article. Provide your unique, personal take.

      // --- FEW-SHOT EXAMPLES (CRITICAL FOR QUALITY) ---
      // Showing, not just telling. This is one of the most effective prompt engineering techniques.
      // It gives the AI a concrete example of the desired input-to-output transformation.
      --- EXAMPLES ---
      **Example 1:**
      * Topic: "Google releases new AI that can write its own code"
      * Generated Tweet: "great, now the ai can do my final year project for me. wonder if it also procrastinates until the night before the deadline "

      **Example 2:**
      * Topic: "Study finds developers spend over 50% of their time debugging"
      * Generated Tweet: "only 50%? those are rookie numbers. i spend 50% of my time debugging and the other 50% wondering how i created the bugs in the first place"
      
      **Example 3:**
      * Topic: "New framework 'FreshJS' claims 10x faster build times"
      * Generated Tweet: "another day another javascript framework to learn. my brain's node_modules folder is already full"
    `}]}],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: tweetResponseSchema,
      temperature: 0.7,
    },
  }));

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Gemini returned an empty response for tweet generation.");
  }
  
  const responseObject = JSON.parse(responseText);
  return responseObject.tweet_text;
}