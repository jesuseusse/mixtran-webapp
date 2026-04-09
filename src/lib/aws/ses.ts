import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/** Shared SESv2 client singleton. */
const client = new SESv2Client({
  region: process.env.NEXT_AWS_REGION ?? "us-east-1",
});

/** Parameters required to send a transactional email. */
export interface SendEmailParams {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** Full HTML body. */
  html: string;
}

/**
 * Sends a transactional email via AWS SES.
 * Always uses the verified FROM address from NEXT_SES_FROM_EMAIL.
 * Throws if SES returns an error.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: process.env.NEXT_SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      },
    })
  );
}
