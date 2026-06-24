export const orderConfirmedTemplate = (order: any, year: number) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
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
                <span style="font-size:28px;">🛍️</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Order Confirmed</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Payment required to proceed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${order.customerName || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Your order <strong>#${order.orderId}</strong> has been placed successfully. Please complete your payment to proceed — orders are processed only after payment confirmation.
              </p>

              <!-- Order Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Order Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Order ID: <span style="color:#111827;font-weight:500;">#${order.orderId}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Total Items: <span style="color:#111827;font-weight:500;">${order.products?.length ?? 0}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Total Price: <span style="color:#111827;font-weight:500;">$${order.totalPrice}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Payment Status: <span style="color:#d97706;font-weight:600;">Pending</span></p>
              </div>

              <!-- Action Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      ⚠️ &nbsp;Please complete your payment from your dashboard to confirm this order.
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

export const orderRequestSubmittedTemplate = (
  order: any,
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
                Hi <strong>${order.customerName || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We've received your <strong>${requestLabel.toLowerCase()}</strong> request for order <strong>#${order.orderId}</strong>. The vendor will review it shortly.
              </p>

              <!-- Request Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Order ID: <span style="color:#111827;font-weight:500;">#${order.orderId}</span></p>
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

export const orderRequestApprovedTemplate = (
  order: any,
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
                Hi <strong>${order.customerName || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Great news! Your <strong>${requestLabel.toLowerCase()}</strong> request for order <strong>#${order.orderId}</strong> has been <strong>approved</strong> by the vendor.
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Order ID: <span style="color:#111827;font-weight:500;">#${order.orderId}</span></p>
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

export const orderRequestRejectedTemplate = (
  order: any,
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
                Hi <strong>${order.customerName || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                We're sorry to let you know that your <strong>${requestLabel.toLowerCase()}</strong> request for order <strong>#${order.orderId}</strong> has been <strong>declined</strong> by the vendor.
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Request Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Order ID: <span style="color:#111827;font-weight:500;">#${order.orderId}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Request Type: <span style="color:#111827;font-weight:500;">${requestLabel}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#DC2626;font-weight:600;">Declined</span></p>
              </div>

              <!-- Info Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      💡 &nbsp;If you'd like to discuss this further, please contact our support team.
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

export const orderDeliveredTemplate = (order: any, year: number) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Delivered</title>
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
                <span style="font-size:28px;">📦</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Order Delivered</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Thank you for shopping with us</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:15px;color:#444444;margin:0 0 24px;line-height:1.6;">
                Hi <strong>${order.customerName || 'there'}</strong>,
              </p>

              <p style="font-size:15px;color:#555555;margin:0 0 28px;line-height:1.7;text-align:center;">
                Your order <strong>#${order.orderId}</strong> has been <strong>delivered</strong>. We hope you love your purchase!
              </p>

              <!-- Details Box -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Order Details</p>
                <p style="margin:0;font-size:14px;color:#6b7280;">Order ID: <span style="color:#111827;font-weight:500;">#${order.orderId}</span></p>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">Status: <span style="color:#0AA84C;font-weight:600;">Delivered</span></p>
              </div>

              <!-- Review Prompt -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fdf9;border:1px solid #d4f0e0;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                      ⭐ &nbsp;We'd love to hear your feedback! Please consider leaving a review from your dashboard.
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
