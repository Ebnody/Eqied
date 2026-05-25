interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  // TODO: Integrate with a real email provider (Resend, SendGrid, AWS SES, etc.)
  // For now, log to console so the super admin can manually send the info.
  console.log("\n========== EMAIL ==========");
  console.log(`To: ${input.to}`);
  console.log(`Subject: ${input.subject}`);
  console.log(`Body:\n${input.text}`);
  console.log("==========================\n");
}
