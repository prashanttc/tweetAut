import { prisma } from "./prisma";

export async function CheckTopic() {
  try {
  const list = await prisma.usedTopics.findMany({
    select:{
        rawTopic:true
    }
  })
  return list;
  } catch (error) {
    console.error(error.message || "internal server error");
  }
}
