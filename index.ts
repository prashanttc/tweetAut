import express from "express";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { MorningAgent } from "./agents/morningTopicAgent";

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
    res.send("✅ Morning tweet posted");
  } catch (err) {
    console.error("❌ MorningAgent error:", err);
    res.status(500).send("Error in MorningAgent");
  }
});

// app.get("/cron/afternoon", async (req, res) => {
//   if (!isAuthorized(req)) return res.status(401).send("Unauthorized");
//   try {
//     await AfternoonAgent();
//     res.send("✅ Afternoon tweet posted");
//   } catch (err) {
//     console.error("❌ AfternoonAgent error:", err);
//     res.status(500).send("Error in AfternoonAgent");
//   }
// });

// app.get("/cron/evening", async (req, res) => {
//   if (!isAuthorized(req)) return res.status(401).send("Unauthorized");
//   try {
//     await EveningAgent();
//     res.send("✅ Evening tweet posted");
//   } catch (err) {
//     console.error("❌ EveningAgent error:", err);
//     res.status(500).send("Error in EveningAgent");
//   }
// });

process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down...");
  await prisma.$disconnect();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
