// utils/email.ts
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();
const resend = new Resend(process.env.RESEND_API!);
export async function sendEmailNotification(
  tweetText: string,
  status: "posted" | "failed"
) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "tanishka.bgt@gmail.com",
      subject: `Tweet ${status === "posted" ? "✅ Posted" : "❌ Failed"}`,
      html: `
        <h2>Tweet ${status === "posted" ? "was successfully posted" : "failed to post"}.</h2>
        <p><strong>Content:</strong> ${tweetText}</p>
        <p><em>Time:</em> ${new Date().toLocaleString()}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send email notification:", err.message);
  }
}
