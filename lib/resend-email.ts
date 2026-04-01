import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "[Resend] RESEND_API_KEY is not set. Configure it or provide EmailJS credentials.",
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmailViaResend(
  input: TransactionalEmailInput,
) {
  const from = process.env.EMAIL_FROM ?? "noreply@client-flow.in";
  const resend = getResend();

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    throw new Error(`[Resend] Email delivery failed: ${error.message}`);
  }

  return { delivered: true, reason: null };
}
