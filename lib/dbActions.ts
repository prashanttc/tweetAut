import { Topic } from "../type";
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

export async function saveTweet(tweet:string) {
   try {
     const Tweet = await prisma.tweets.create({
      data:{
        content:tweet,
        postUrl:"",
      }
     })
     if(!Tweet){
      throw new Error("unable to save tweet")
     }
     return {success:true};
   } catch (error) {
    console.error(error.message || "internal server error");
   }
}

export async function saveTopic(topic:Topic) {
 try {
    const res = await prisma.usedTopics.create({
      data:{
         rawTopic:topic.rawTopic,
         source:topic.source,
         sourceUrl:topic.sourceUrl,
         contextSummary:topic.contextSummary
      }
    })
 }catch (error) {
    console.error(error.message || "internal server error");
   }
}