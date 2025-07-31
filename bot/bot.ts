// bot.ts
import TelegramBot from 'node-telegram-bot-api';
import { MorningAgent } from '../agents/morningTopicAgent';
import { ShitPostingAgent } from '../agents/ShitPostingAgent';
import dotenv from "dotenv";
import { prisma } from '../lib/prisma';

dotenv.config();

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const bot = new TelegramBot(token, { polling: true });
const ADMIN_IDS = process.env.TELEGRAM_ADMIN_ID!.split(',').map(id => id.trim());

function isAdmin(id: number | undefined): boolean {
  return id !== undefined && ADMIN_IDS.includes(id.toString());
}

  console.log("🤖 Telegram bot started");

bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from?.id)) return;
  const chatId = msg.chat.id;
  const name = msg.from?.first_name || "there";

  bot.sendMessage(
    chatId,
    `👋 Hey ${name}!\n\nI'm your *Tweet Automation Bot* – managing scheduled tweets for your account.\n\nHere’s what I can do:\n\n🕒 Auto-post tweets at:\n• 10 AM – Tech topics\n• 8 PM – Shitposts\n\n⚙️ You can also manually control me:\n• /post_morning – Post tech tweet now\n• /post_evening – Post shitpost now\n• /help – View all commands\n\n_Only the admin can access this bot._`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/help/, (msg) => {
  if (!isAdmin(msg.from?.id)) return;
  bot.sendMessage(
    msg.chat.id,
    `📚 *Bot Commands Reference*:\n\n🛠️ *Tweet :*\n• /post_morning – Post tech tweet manually\n• /post_evening – Post shitpost manually\n\n🔍• /logs – see all posted tweets\n• *Info:*\n• /start – Overview of what I do\n• /help – Show this help menu\n\n 🔐 *Note:* Only the authorized admin can use these commands.`,
    { parse_mode: 'Markdown' }
  );
});

  bot.onText(/\/post_morning/, async (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    bot.sendMessage(msg.chat.id, `🚀 Running MorningAgent...`);
    try {
      await MorningAgent();
      bot.sendMessage(msg.chat.id, `✅ Morning Tweet posted!`);
    } catch (err: any) {
      bot.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
    }
  });

  bot.onText(/\/post_evening/, async (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    bot.sendMessage(msg.chat.id, `🌙 Running EveningAgent...`);
    try {
      await ShitPostingAgent();
      bot.sendMessage(msg.chat.id, `✅ Evening Tweet posted!`);
    } catch (err: any) {
      bot.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
    }
  });

bot.onText(/\/logs/, async (msg) => {
  if (!isAdmin(msg.from?.id)) return;
  const chatId = msg.chat.id;

  try {
    const logs = await prisma.tweets.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (logs.length === 0) {
      bot.sendMessage(chatId, "📭 No logs found.");
      return;
    }

    let message = `🧾 *Recent Tweet Logs:*\n\n`;
    logs.forEach(log => {
      message += `🕒 ${new Date(log.createdAt).toLocaleString()}\n📄 ${log.content}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err: any) {
    bot.sendMessage(chatId, `❌ Failed to fetch logs: ${err.message}`);
  }
});

}
