// bot.ts
import TelegramBot from 'node-telegram-bot-api';
import { MorningAgent } from '../agents/morningTopicAgent';
import { ShitPostingAgent } from '../agents/ShitPostingAgent';
import dotenv from "dotenv";

dotenv.config();

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const bot = new TelegramBot(token, { polling: true });
  const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID!;

  function isAdmin(id: number | undefined): boolean {
    return id?.toString() === ADMIN_ID;
  }

  console.log("🤖 Telegram bot started");

  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    const chatId = msg.chat.id;
    const name = msg.from?.first_name || "there";
    bot.sendMessage(chatId, `👋 Hey ${name}! I'm your Tweet Automation Bot...`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/help/, (msg) => {
    if (!isAdmin(msg.from?.id)) return;
    bot.sendMessage(msg.chat.id, `📚 *Bot Commands Reference*`, { parse_mode: 'Markdown' });
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
}
