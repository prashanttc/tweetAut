import TelegramBot from 'node-telegram-bot-api';
import { MorningAgent } from '../agents/morningTopicAgent';
import { ShitPostingAgent } from '../agents/ShitPostingAgent';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID!;

function isAdmin(id: number | undefined): boolean {
  return id?.toString() === ADMIN_ID;
}

// ✅ /start
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from?.id)) return;

  const chatId = msg.chat.id;
  const name = msg.from?.first_name || "there";

  bot.sendMessage(
    chatId,
    `👋 Hey ${name}!\n\nI'm your *Tweet Automation Bot* – running your scheduled tweets like a boss.\n\nHere's what I can do:\n\n🕒 Auto-post tweets at:\n• 10 AM (Tech Topics)\n• 8 PM (Shitposts)\n\n⚙️ Manage with:\n• /post_morning – Post Tech tweet now\n• /post_evening – Post Shitpost now\n• /pause – Pause automation\n• /resume – Resume automation\n• /status – Show current bot status\n• /logs – View recent log\n• /preview – View upcoming post\n\nType /help anytime for a quick summary.`,
    { parse_mode: 'Markdown' }
  );
});

// ✅ /help
bot.onText(/\/help/, (msg) => {
  if (!isAdmin(msg.from?.id)) return;

  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `📚 *Bot Commands Reference*:\n\n🔹 /post_morning – Post Tech tweet instantly\n🔹 /post_evening – Post Shitpost instantly\n🔹 /preview – Show upcoming tweet drafts\n🔹 /logs – Show latest logs\n\n🛑 Cron Control:\n• /pause – Pause automation\n• /resume – Resume automation\n• /status – Show if automation is ON/OFF\n\nOnly *authorized admin* can use these commands.\nUse responsibly 🧠`,
    { parse_mode: 'Markdown' }
  );
});

// ✅ /post_morning
bot.onText(/\/post_morning/, async (msg) => {
  if (!isAdmin(msg.from?.id)) return;

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🚀 Running MorningAgent...`);

  try {
    await MorningAgent();
    bot.sendMessage(chatId, `✅ Morning Tweet posted!`);
  } catch (err: any) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ✅ /post_evening
bot.onText(/\/post_evening/, async (msg) => {
  if (!isAdmin(msg.from?.id)) return;

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `🌙 Running EveningAgent...`);

  try {
    await ShitPostingAgent();
    bot.sendMessage(chatId, `✅ Evening Tweet posted!`);
  } catch (err: any) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});
