import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendAssignmentEmail(params: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  actorName: string;
  taskId: string;
}) {
  if (!resend) {
    console.log("[Email] Resend not configured, skipping email to", params.to);
    return;
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: "Goodness Gardens PM <notifications@goodnessgardens.net>",
    to: params.to,
    subject: `Task assigned: ${params.taskTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1a3a2a; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
          <strong>Goodness Gardens</strong> — Task Manager
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Hi ${params.assigneeName},</p>
          <p><strong>${params.actorName}</strong> assigned a task to you:</p>
          <div style="background: #f9fafb; border-left: 3px solid #1a3a2a; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
            <strong>${params.taskTitle}</strong>
          </div>
          <a href="${appUrl}/tasks/${params.taskId}" style="display: inline-block; background: #1a3a2a; color: white; padding: 8px 20px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
            View Task
          </a>
        </div>
      </div>
    `,
  });
}
