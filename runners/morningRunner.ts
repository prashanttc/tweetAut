import { MorningAgent } from "../agents/morningTopicAgent";
import { prisma } from "../lib/prisma";

async function main() {
  try {
    await MorningAgent(); 
    console.log("Tweet posted successfully.");
  } catch (err) {
    console.error("Error posting tweet:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
