import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@promptingschool.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error("[email] Failed to send email to", to, err);
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prompting School</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;background:#ffffff;border-radius:12px;
                      border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;
                        letter-spacing:-0.3px;">Prompting School</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You can manage your email preferences in
                <a href="${APP_URL}/settings/email"
                   style="color:#6b7280;text-decoration:underline;">account settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Exported send functions
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  to: string,
  displayName: string
): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Welcome, ${escHtml(displayName)}!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Thanks for joining Prompting School — the interactive platform for mastering AI prompting.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Here's what you can do:
    </p>
    <ul style="margin:0 0 28px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
      <li>Explore workshops and practise prompt engineering</li>
      <li>Get instant AI-powered feedback on every submission</li>
      <li>Track your progress and earn badges</li>
    </ul>
    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      Go to Dashboard
    </a>`;

  await sendEmail(to, "Welcome to Prompting School!", baseTemplate(content));
}

export async function sendScoreNotification(
  to: string,
  displayName: string,
  exerciseTitle: string,
  totalScore: number,
  maxScore: number,
  overallFeedback: string,
  submissionId: string
): Promise<void> {
  const pct =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const scoreColor =
    pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

  const content = `
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">
      Your score is ready
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      ${escHtml(exerciseTitle)}
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-bottom:24px;
                border:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:42px;font-weight:800;color:${scoreColor};">
        ${pct}<span style="font-size:20px;font-weight:600;">%</span>
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">
        ${totalScore} / ${maxScore} points
      </p>
    </div>
    ${
      overallFeedback
        ? `<p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;
                     background:#eff6ff;border-left:3px solid #2563eb;
                     padding:12px 16px;border-radius:0 6px 6px 0;">
             ${escHtml(overallFeedback)}
           </p>`
        : ""
    }
    <a href="${APP_URL}/api/submissions/${submissionId}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      View Full Feedback
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
      Keep practising, ${escHtml(displayName)} — consistency is key.
    </p>`;

  await sendEmail(
    to,
    `Score ready: ${pct}% on "${exerciseTitle}"`,
    baseTemplate(content)
  );
}

export async function sendWorkshopInviteEmail(
  to: string,
  workshopTitle: string,
  instructorName: string,
  inviteCode: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/join/${inviteCode}`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      You're invited to a workshop
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${escHtml(instructorName)}</strong> has invited you to join
      <strong>${escHtml(workshopTitle)}</strong> on Prompting School.
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:16px 24px;
                margin-bottom:24px;border:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;
                letter-spacing:0.05em;">Invite Code</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#111827;
                letter-spacing:0.1em;">${escHtml(inviteCode)}</p>
    </div>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      Join Workshop
    </a>
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">
      Or visit <a href="${inviteUrl}" style="color:#6b7280;">${inviteUrl}</a>
    </p>`;

  await sendEmail(
    to,
    `You're invited: ${workshopTitle}`,
    baseTemplate(content)
  );
}

// Notify instructor that their workshop is now live
export async function sendWorkshopPublishedEmail(
  to: string,
  displayName: string,
  workshopTitle: string,
  inviteCode: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/join/${inviteCode}`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      Your workshop is live!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${escHtml(workshopTitle)}</strong> is now published and accepting trainees.
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:16px 24px;
                margin-bottom:24px;border:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;
                letter-spacing:0.05em;">Share this invite link</p>
      <p style="margin:4px 0 0;font-size:13px;">
        <a href="${inviteUrl}" style="color:#2563eb;word-break:break-all;">${inviteUrl}</a>
      </p>
    </div>
    <a href="${APP_URL}/workshops"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      Manage Workshop
    </a>`;

  await sendEmail(
    to,
    `"${workshopTitle}" is now live`,
    baseTemplate(content)
  );
}

export async function sendCertificateEmail(
  to: string,
  displayName: string,
  entityTitle: string,
  entityType: "workshop" | "learning_path",
  verificationCode: string,
  scorePct: number | null
): Promise<void> {
  const certUrl = `${APP_URL}/certificates/${verificationCode}`;
  const typeLabel = entityType === "workshop" ? "workshop" : "learning path";

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      🎓 You've earned a certificate!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Congratulations, <strong>${escHtml(displayName)}</strong>! You've successfully
      completed the ${typeLabel} <strong>${escHtml(entityTitle)}</strong>.
    </p>
    ${
      scorePct !== null
        ? `<div style="background:#eff6ff;border-radius:10px;padding:16px 24px;
                    margin-bottom:24px;border:1px solid #bfdbfe;text-align:center;">
             <p style="margin:0;font-size:36px;font-weight:800;color:#2563eb;">
               ${scorePct}%
             </p>
             <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">Final score</p>
           </div>`
        : ""
    }
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Your certificate is ready to view, download as PDF, and share on LinkedIn.
    </p>
    <a href="${certUrl}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      View Certificate
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
      Keep going — more workshops await you!
    </p>`;

  await sendEmail(
    to,
    `Certificate earned: ${entityTitle}`,
    baseTemplate(content)
  );
}

// ---------------------------------------------------------------------------
// Collaboration notifications
// ---------------------------------------------------------------------------

export async function sendDiscussionReplyEmail(
  to: string,
  displayName: string,
  replierName: string,
  exerciseTitle: string,
  replyBody: string,
  exerciseUrl: string
): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      New reply to your discussion
    </h1>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">
      Exercise: ${escHtml(exerciseTitle)}
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${escHtml(replierName)}</strong> replied to your discussion:
    </p>
    <div style="background:#f9fafb;border-left:3px solid #2563eb;
                padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        ${escHtml(replyBody.slice(0, 300))}${replyBody.length > 300 ? "…" : ""}
      </p>
    </div>
    <a href="${exerciseUrl}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      View Discussion
    </a>`;

  await sendEmail(
    to,
    `${replierName} replied to your discussion in "${exerciseTitle}"`,
    baseTemplate(content)
  );
}

export async function sendPeerReviewReceivedEmail(
  to: string,
  displayName: string,
  exerciseTitle: string,
  rating: number,
  feedbackText: string,
  submissionUrl: string
): Promise<void> {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      You received a peer review
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
      Exercise: ${escHtml(exerciseTitle)}
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;
                margin-bottom:24px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;font-size:22px;color:#f59e0b;letter-spacing:0.05em;">
        ${stars}
      </p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        ${escHtml(feedbackText.slice(0, 400))}${feedbackText.length > 400 ? "…" : ""}
      </p>
    </div>
    <a href="${submissionUrl}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      View Full Review
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
      Peer feedback helps you grow — keep it up, ${escHtml(displayName)}!
    </p>`;

  await sendEmail(
    to,
    `You received a ${rating}-star peer review on "${exerciseTitle}"`,
    baseTemplate(content)
  );
}

export async function sendNewWorkshopFromFollowedInstructorEmail(
  to: string,
  displayName: string,
  instructorName: string,
  workshopTitle: string,
  workshopDescription: string,
  workshopUrl: string
): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      New workshop from ${escHtml(instructorName)}
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      An instructor you follow just published a new workshop:
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;
                margin-bottom:24px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#111827;">
        ${escHtml(workshopTitle)}
      </p>
      ${workshopDescription
        ? `<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
             ${escHtml(workshopDescription.slice(0, 200))}${workshopDescription.length > 200 ? "…" : ""}
           </p>`
        : ""}
    </div>
    <a href="${workshopUrl}"
       style="display:inline-block;background:#2563eb;color:#ffffff;
              font-size:14px;font-weight:600;text-decoration:none;
              padding:12px 24px;border-radius:8px;">
      View Workshop
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
      You're following ${escHtml(instructorName)}. Manage your follows in
      <a href="${APP_URL}/settings/email" style="color:#6b7280;">settings</a>.
    </p>`;

  await sendEmail(
    to,
    `New workshop: "${workshopTitle}" by ${instructorName}`,
    baseTemplate(content)
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
