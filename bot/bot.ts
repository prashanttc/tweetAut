// bot.ts
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { prisma } from "../lib/prisma";
import { GenerateTweet } from "../agents/telegramAgent";
import { PostAgent } from "../agents/postAgent";
import { Topic } from "../type";

dotenv.config();

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const bot = new TelegramBot(token, { polling: true });
  const ADMIN_IDS = process.env.TELEGRAM_ADMIN_ID!.split(",").map((id) => id.trim());

  function isAdmin(id: number | undefined): boolean {
    return id !== undefined && ADMIN_IDS.includes(id.toString());
  }

  const userSessions = new Map<number, { type: "tech" | "shitpost"; tweet: string; selectedTopic:Topic }>();

  console.log("🤖 Telegram bot started");

  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    const chatId = msg.chat.id;
    const name = msg.from?.first_name || "there";

    bot.sendMessage(
      chatId,
      `👋 Hey ${name}!\n\nI'm your *Tweet Automation Bot* – managing scheduled tweets for your account.\n\nHere’s what I can do:\n\n🕒 Auto-post tweets at:\n• 10 AM and 8 PM – Tech topics\n• 4 PM – Shitposts\n\n⚙️ You can also manually control me:\n• /posttech – Post tech tweet now\n• /postshit – Post shitpost now\n• /help – View all commands\n\n_Only the admin can access this bot._`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/help/, (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    bot.sendMessage(
      msg.chat.id,
      `📚 *Bot Commands Reference*:\n\n🛠️ *Tweet :*\n• /posttech – Post tech tweet manually\n• /postshit – Post shitpost manually\n\n🔍• /logs – See recent posted tweets\n• /start – Overview of what I do\n• /help – Show this help menu\n\n🔐 *Note:* Only the authorized admin can use these commands.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/posttech/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!isAdmin(userId)) return;

    bot.sendMessage(chatId, `🧠 Generating tech tweet...`);
    try {
      const {selectedTopic,tweet} = await GenerateTweet("tech");
      userSessions.set(userId!, { type: "tech", tweet , selectedTopic });

      bot.sendMessage(chatId, `💡 Tweet preview:\n\n${tweet}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Post", callback_data: "post_tweet" },
              { text: "🔁 Regenerate", callback_data: "regen_tweet" },
            ],
          ],
        },
      });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  });

  bot.onText(/\/postshit/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!isAdmin(userId)) return;

    bot.sendMessage(chatId, `🧠 Generating shitpost...`);
    try {
      const {selectedTopic,tweet} = await GenerateTweet("shitposting");
      userSessions.set(userId!, { type: "shitpost", tweet ,selectedTopic });

      bot.sendMessage(chatId, `💩 Shitpost preview:\n\n${tweet}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Post", callback_data: "post_tweet" },
              { text: "🔁 Regenerate", callback_data: "regen_tweet" },
            ],
          ],
        },
      });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  });

  bot.onText(/\/logs/, async (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    const chatId = msg.chat.id;

    try {
      const logs = await prisma.tweet.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (logs.length === 0) {
        bot.sendMessage(chatId, "📭 No logs found.");
        return;
      }

      let message = `🧾 *Recent Tweet Logs:*\n\n`;
      logs.forEach((log) => {
        message += `🕒 ${new Date(log.createdAt).toLocaleString()}\n📄 ${
          log.content
        }\n\n`;
      });

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (err: any) {
      bot.sendMessage(chatId, `❌ Failed to fetch logs: ${err.message}`);
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    const action = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message?.chat.id;

    if (!isAdmin(userId) || !chatId) return;
    const session = userSessions.get(userId);
    if (!session) {
      bot.sendMessage(chatId, "⚠️ No tweet found. Start again with /posttech or /postshit.");
      return;
    }

    if (action === "post_tweet") {
      try {
       await PostAgent({content:session.tweet,topic:session.selectedTopic})
        bot.sendMessage(chatId, `✅ Tweet posted!`);
      } catch (err: any) {
        bot.sendMessage(chatId, `❌ Posting failed: ${err.message}`);
      }
      userSessions.delete(userId);
    }

    if (action === "regen_tweet") {
      try {
        const {selectedTopic,tweet} = await GenerateTweet(session.type === "tech" ? "tech" : "shitposting");
        userSessions.set(userId, { type: session.type,tweet,selectedTopic });

        bot.editMessageText(
          `${session.type === "tech" ? "💡 New tech tweet" : "💩 New shitpost"} preview:\n\n"${tweet}"`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Post", callback_data: "post_tweet" },
                  { text: "🔁 Regenerate", callback_data: "regen_tweet" },
                ],
              ],
            },
          }
        );
      } catch (err: any) {
        bot.sendMessage(chatId, `❌ Error regenerating tweet: ${err.message}`);
      }
    }

    bot.answerCallbackQuery(callbackQuery.id);
  });
}
