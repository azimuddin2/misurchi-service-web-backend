import { TBookingAssigned } from './booking.interface';

export const bookingConfirmedTemplate = (
  booking: any,
  serviceName: string,
  bookingDate: string,
  time: string,
  year: number,
  amountPaid: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0AA84C 0%,#078a3e 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🎉</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Booking Confirmed</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your appointment is all set</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We're confirming your booking for <strong>${serviceName}</strong> has been <strong>successfully placed</strong>. We look forward to serving you!
              </p>

              <!-- Booking Details Box -->
            <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
  <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${serviceName}</span></p>
  <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Date: <span style="color:#111827;font-weight:500;">${bookingDate}</span></p>
  <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Time: <span style="color:#111827;font-weight:500;">${time}</span></p>
  <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Amount Paid: <span style="color:#0AA84C;font-weight:600;">$${amountPaid}</span></p>
  <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#0AA84C;font-weight:600;">Confirmed</span></p>
</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#0AA84C;">SMEVine</strong>. All rights reserved.<br/>
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

export const requestSubmittedTemplate = (
  booking: any,
  requestLabel: string,
  reason: string | undefined,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${requestLabel} Request Submitted</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0AA84C 0%,#078a3e 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">📋</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">${requestLabel} Request Submitted</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Awaiting vendor approval</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We've received your <strong>${requestLabel.toLowerCase()}</strong> request for <strong>${booking.serviceName}</strong>. The vendor will review it shortly.
              </p>

              <!-- Request Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${booking.serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Request Type: <span style="color:#111827;font-weight:500;">${requestLabel}</span></p>
                ${
                  reason
                    ? `<p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Reason: <span style="color:#111827;font-weight:500;">${reason}</span></p>`
                    : ''
                }
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fdf9;border:1px solid #d4f0e0;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;You'll receive another email once the vendor approves or declines this request.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#0AA84C;">SMEVine</strong>. All rights reserved.<br/>
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

export const requestApprovedTemplate = (
  booking: any,
  requestLabel: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${requestLabel} Request Approved</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0AA84C 0%,#078a3e 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">✅</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">${requestLabel} Request Approved</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your request has been accepted</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Great news! Your <strong>${requestLabel.toLowerCase()}</strong> request for <strong>${booking.serviceName}</strong> has been <strong>approved</strong> by the vendor.
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${booking.serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Request Type: <span style="color:#111827;font-weight:500;">${requestLabel}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#0AA84C;font-weight:600;">Approved</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fdf9;border:1px solid #d4f0e0;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;If you have any questions about this change, feel free to contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#0AA84C;">SMEVine</strong>. All rights reserved.<br/>
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

export const requestRejectedTemplate = (
  booking: any,
  requestLabel: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${requestLabel} Request Declined</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f4f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(220,38,38,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#DC2626 0%,#991B1B 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">❌</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">${requestLabel} Request Declined</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your request was not approved</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We're sorry to let you know that your <strong>${requestLabel.toLowerCase()}</strong> request for <strong>${booking.serviceName}</strong> has been <strong>declined</strong> by the vendor.
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${booking.serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Request Type: <span style="color:#111827;font-weight:500;">${requestLabel}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#DC2626;font-weight:600;">Declined</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;Your original booking remains unchanged. If you'd like to discuss this further, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fef9f9;border-top:1px solid #fde8e8;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#DC2626;">SMEVine</strong>. All rights reserved.<br/>
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

export const serviceCompletedTemplate = (booking: any, year: number) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Completed</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0AA84C 0%,#078a3e 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🎉</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Service Completed</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Thank you for choosing us</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Your booking for <strong>${booking.serviceName}</strong> has been marked as <strong>completed</strong>. We hope you had a great experience!
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${booking.serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#0AA84C;font-weight:600;">Completed</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fdf9;border:1px solid #d4f0e0;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;We'd love to hear your feedback! Feel free to leave a review from your dashboard.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fdf9;border-top:1px solid #e8f5ee;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#0AA84C;">SMEVine</strong>. All rights reserved.<br/>
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

export const bookingCancelledTemplate = (booking: any, year: number) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Cancelled</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f4f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f0f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(220,38,38,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#DC2626 0%,#991B1B 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🚫</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Booking Cancelled</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your booking status has changed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Your booking for <strong>${booking.serviceName}</strong> has been <strong>cancelled</strong>.
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${booking.serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#DC2626;font-weight:600;">Cancelled</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;If you have any questions, please contact our support team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fef9f9;border-top:1px solid #fde8e8;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color:#DC2626;">SMEVine</strong>. All rights reserved.<br/>
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

export const memberAssignedTemplate = (
  memberName: string,
  booking: TBookingAssigned,
  bookingDate: string,
  year: number,
): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Booking Assigned</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0AA84C 0%,#087a38 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">SMEVine</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">New Booking Assigned</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">You have a new appointment to manage</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1a1a1a;line-height:1.6;">Hi <strong>${memberName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.7;">
                A new booking has been assigned to you. Please review the details below and make sure everything is prepared before the appointment.
              </p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fdf9;border:1px solid #d4edda;border-radius:12px;overflow:hidden;">

                <tr>
                  <td colspan="2" style="background:#e8f7ee;padding:14px 20px;border-bottom:1px solid #d4edda;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0AA84C;letter-spacing:1px;text-transform:uppercase;">📅 Booking Details</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;width:40%;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Service</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${booking.serviceName}</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Date</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${bookingDate}</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Time</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${booking.time}</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <span style="display:inline-block;padding:3px 12px;background:#fff3cd;color:#856404;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize;border:1px solid #ffc107;">
                      ${booking.status}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td colspan="2" style="background:#e8f7ee;padding:14px 20px;border-top:1px solid #d4edda;border-bottom:1px solid #d4edda;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0AA84C;letter-spacing:1px;text-transform:uppercase;">👤 Customer Information</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Name</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${booking.name}</p>
                  </td>
                </tr>

                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <a href="mailto:${booking.email}" style="font-size:14px;color:#0AA84C;text-decoration:none;font-weight:500;">${booking.email}</a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Phone</p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <a href="tel:${booking.phone}" style="font-size:14px;color:#0AA84C;text-decoration:none;font-weight:500;">${booking.phone}</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA Note -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
                      ⚠️ <strong>Action Required:</strong> Please log in to your dashboard to confirm your availability and review the full booking details before the appointment date.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
                If you have any questions or concerns about this booking, please contact your manager or reply to this email.
              </p>
              <p style="margin:20px 0 0;font-size:15px;color:#1a1a1a;">
                Best regards,<br/>
                <strong style="color:#0AA84C;">SMEVine Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                © ${year} SMEVine. All rights reserved.<br/>
                This email was sent because a booking was assigned to you.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const bookingReceivedTemplate = (
  booking: any,
  serviceName: string,
  bookingDate: string,
  time: string,
  year: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Received</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color: #f0f2f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#F5A623 0%,#D68910 100%);padding:40px 40px 30px;">
              <div style="width:60px;height:60px;background-color:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🕓</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Booking Received</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Payment pending to secure your slot</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${booking.name || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We've received your booking request for <strong>${serviceName}</strong>. Your slot is reserved, but payment is still required to secure it.
              </p>

              <!-- Booking Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Service: <span style="color:#111827;font-weight:500;">${serviceName}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Date: <span style="color:#111827;font-weight:500;">${bookingDate}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Time: <span style="color:#111827;font-weight:500;">${time}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#D68910;font-weight:600;">Payment Pending</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      ⚠️ &nbsp;Please complete payment to confirm this booking. You'll receive a separate confirmation email once payment is done.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f2f4; border-top:1px solid #f0f2f4;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                &copy; ${year} <strong style="color: #1A73E8;">SMEVine</strong>. All rights reserved.<br/>
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
