import express from "express";
import "./bot/bot"
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { MorningAgent } from "./agents/morningTopicAgent";
import { ShitPostingAgent } from "./agents/ShitPostingAgent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(req: express.Request): boolean {
  return req.query.key === CRON_SECRET;
}

app.get("/cron/morning", async (req: any, res: any) => {
  if (!isAuthorized(req)) return res.status(401).send("Unauthorized");
  try {
    await MorningAgent();
    res.status(204).end();
  } catch (err) {
    console.error("❌ MorningAgent error:", err);
    res.status(500).send("Error in MorningAgent");
  }
});

app.get("/cron/evening", async (req: any, res: any) => {
  if (!isAuthorized(req)) return res.status(401).send("Unauthorized");
  try {
    await ShitPostingAgent();
    res.status(204).end();
  } catch (err) {
    console.error("❌ EveningAgent error:", err);
    res.status(500).send("Error in EveningAgent");
  }
});

process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down...");
  await prisma.$disconnect();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

