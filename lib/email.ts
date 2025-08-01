// utils/email.ts
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();
const resend = new Resend(process.env.RESEND_API!);

export async function sendEmailNotification(
  tweetText: string,
  status: "posted" | "failed"
) {
  await resend.emails.send({
    from: "Tweet Bot",
    to: ["tanishkabgt@gmail.com"],
    subject: `Tweet ${status === "posted" ? "✅ Posted" : "❌ Failed"}`,
    html: `
      <h2>Tweet ${status === "posted" ? "was successfully posted" : "failed to post"}.</h2>
      <p><strong>Content:</strong> ${tweetText}</p>
      <p><em>Time:</em> ${new Date().toLocaleString()}</p>
    `,
  });
}
