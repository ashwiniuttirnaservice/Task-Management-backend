/**
 * Email service — plug-in ready.
 *
 * Set GMAIL_EMAIL + GMAIL_APP_PASSWORD in .env to activate.
 * Until then every send() call logs a warning and returns { sent: 0, skipped: 1 }.
 *
 * Uses nodemailer with Gmail. Swap getTransport() for any other provider
 * (SendGrid, Resend, SES) without touching callers.
 */

const nodemailer = require("nodemailer");

const isConfigured = () =>
  Boolean(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);

let _transport;
function getTransport() {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transport;
}

/** Internal send — guards, sends, returns result object. */
async function send({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.warn(`[Email] Not configured — skipped send to ${to} (${subject})`);
    return { sent: 0, skipped: 1 };
  }
  try {
    await getTransport().sendMail({
      from: `"TaskPilot" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] Sent "${subject}" → ${to}`);
    return { sent: 1, skipped: 0 };
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" → ${to}:`, err.message);
    return { sent: 0, skipped: 0, error: err.message };
  }
}

/* ------------------------------------------------------------------ */
/*  Trigger functions — one per business event                         */
/* ------------------------------------------------------------------ */

/**
 * Called when a new team member is created.
 * Future use: welcome email with login link.
 */
async function sendWelcomeEmail({ name, workingEmail }) {
  if (!workingEmail) return { sent: 0, skipped: 1 };
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return send({
    to:      workingEmail,
    subject: "Welcome to TaskPilot!",
    html: `
      <h2>Hi ${name}, welcome to TaskPilot 👋</h2>
      <p>Your account has been set up. You'll receive a separate email with login credentials once auth is live.</p>
      <p>
        <a href="${appUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;">
          Open TaskPilot
        </a>
      </p>
    `,
    text: `Hi ${name}, welcome to TaskPilot! Visit: ${appUrl}`,
  });
}

/**
 * Called when a member is assigned to a project.
 * Future use: notify them of the new project.
 */
async function sendProjectAssignedEmail({ name, workingEmail, projectName }) {
  if (!workingEmail) return { sent: 0, skipped: 1 };
  return send({
    to:      workingEmail,
    subject: `You've been assigned to "${projectName}" on TaskPilot`,
    html: `
      <h2>New project assignment</h2>
      <p>Hi ${name},</p>
      <p>You have been assigned to the project <strong>${projectName}</strong>.</p>
      <p>Log in to TaskPilot to view your tasks.</p>
    `,
    text: `Hi ${name}, you've been assigned to project "${projectName}" on TaskPilot.`,
  });
}

/**
 * Called when a task is assigned to a member.
 * Future use: notify them of the new task.
 */
async function sendTaskAssignedEmail({ employeeName, workingEmail, taskTitle, deadline }) {
  if (!workingEmail) return { sent: 0, skipped: 1 };
  return send({
    to:      workingEmail,
    subject: `New task assigned: "${taskTitle}"`,
    html: `
      <h2>You have a new task</h2>
      <p>Hi ${employeeName},</p>
      <p>A new task has been assigned to you: <strong>${taskTitle}</strong></p>
      ${deadline ? `<p><strong>Deadline:</strong> ${deadline}</p>` : ""}
      <p>Log in to TaskPilot to view the full details.</p>
    `,
    text: `Hi ${employeeName}, new task assigned: "${taskTitle}"${deadline ? ` — deadline: ${deadline}` : ""}.`,
  });
}

module.exports = {
  isConfigured,
  sendWelcomeEmail,
  sendProjectAssignedEmail,
  sendTaskAssignedEmail,
};
