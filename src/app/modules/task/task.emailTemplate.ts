export const taskAssignedTemplate = (
  taskTitle: string,
  assigneeName: string,
  assignorName: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Task Assigned</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(26,115,232,0.1);">

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1A73E8 0%,#155bb6 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">📌</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">New Task Assigned</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">A task has been assigned to you</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${assigneeName}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                <strong>${assignorName}</strong> has assigned you a new task: <strong>"${taskTitle}"</strong>. Please log in to your dashboard to view the details.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#1A73E8;">SMEVine</strong>. All rights reserved.<br/>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const taskReviewTemplate = (
  taskTitle: string,
  reviewerName: string,
  taggedByName: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Review Requested</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1A73E8 0%,#155bb6 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">📝</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Review Requested</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">A task needs your review</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${reviewerName}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                <strong>${taggedByName}</strong> has tagged you to review the task <strong>"${taskTitle}"</strong>. Please log in to your dashboard to view the details.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#1A73E8;">SMEVine</strong>. All rights reserved.<br/>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const taskBlockedTemplate = (
  taskTitle: string,
  resolverName: string,
  taggedByName: string,
  reason: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Blocked - Action Needed</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(230,126,34,0.1);">

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#E67E22 0%,#c96417 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🚧</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Task Blocked</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your help is needed to unblock a task</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${resolverName}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 20px;line-height:1.7;text-align:center;">
                <strong>${taggedByName}</strong> tagged you to help resolve a blocked task: <strong>"${taskTitle}"</strong>.
              </p>

              <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px 24px;margin-bottom:8px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
                <p style="margin:8px 0 0;font-size:14px;color:#7c2d12;">${reason}</p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#E67E22;">SMEVine</strong>. All rights reserved.<br/>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
