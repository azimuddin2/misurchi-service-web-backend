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
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f2f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background: #1A73E8; padding: 40px 40px 30px;">
              <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🎉</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Booking Confirmed</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your appointment is fully secured</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <p style="font-size: 15px; color: #444444; margin: 0 0 20px; line-height: 1.6;">
                Dear <strong>${booking.name || 'Customer'}</strong>,
              </p>

              <p style="font-size: 15px; color: #555555; margin: 0 0 24px; line-height: 1.7;">
                We are pleased to confirm that your payment has been fully received and your booking for <strong>${serviceName}</strong> is now confirmed. Below is a summary of your booking and payment details.
              </p>

              <!-- Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f8ff; border: 1px solid #d7e6ff; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #1A73E8; text-transform: uppercase; letter-spacing: 0.5px;">Booking Summary</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;">Service: <span style="color: #111827; font-weight: 500;">${serviceName}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Date: <span style="color: #111827; font-weight: 500;">${bookingDate}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Time: <span style="color: #111827; font-weight: 500;">${time}</span></p>
                  </td>
                </tr>
              </table>

              <!-- Payment Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f8ff; border: 1px solid #d7e6ff; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #1A73E8; text-transform: uppercase; letter-spacing: 0.5px;">Payment Summary</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;">Amount Paid: <span style="color: #0AA84C; font-weight: 600;">$${amountPaid}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Remaining Balance: <span style="color: #0AA84C; font-weight: 600;">$0.00</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Payment Status: <span style="color: #0AA84C; font-weight: 600;">Fully Paid</span></p>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0faf3; border-left: 4px solid #0AA84C; border-radius: 4px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 13px; color: #1a7a3f; line-height: 1.5;">
                      ✅ &nbsp;Payment complete — there is no balance remaining on this booking. We look forward to serving you.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #555555; margin: 24px 0 0; line-height: 1.7;">
                If you have any questions regarding your booking, please don't hesitate to reach out to our support team.
              </p>

              <p style="font-size: 14px; color: #1a1a1a; margin: 20px 0 0;">
                Best regards,<br/>
                <strong style="color: #1A73E8;">SMEVine Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f2f4; border-top: 1px solid #f0f2f4; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #aaaaaa; line-height: 1.6;">
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

export const halfPaymentReceivedTemplate = (
  booking: any,
  serviceName: string,
  bookingDate: string,
  time: string,
  year: number,
  paidAmount: number,
  remainingAmount: number,
  paymentLink?: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partial Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f2f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,168,76,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background: #1A73E8; padding: 40px 40px 30px;">
              <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">💳</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Partial Payment Received</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">A balance remains on your booking</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <p style="font-size: 15px; color: #444444; margin: 0 0 20px; line-height: 1.6;">
                Dear <strong>${booking.name || 'Customer'}</strong>,
              </p>

              <p style="font-size: 15px; color: #555555; margin: 0 0 24px; line-height: 1.7;">
                Thank you for your payment. We are writing to confirm that we have received a partial payment toward your booking for <strong>${serviceName}</strong>. Below is a summary of your booking and current payment status.
              </p>

              <!-- Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f8ff; border: 1px solid #d7e6ff; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #1A73E8; text-transform: uppercase; letter-spacing: 0.5px;">Booking Summary</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;">Service: <span style="color: #111827; font-weight: 500;">${serviceName}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Date: <span style="color: #111827; font-weight: 500;">${bookingDate}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Time: <span style="color: #111827; font-weight: 500;">${time}</span></p>
                  </td>
                </tr>
              </table>

              <!-- Payment Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f8ff; border: 1px solid #d7e6ff; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #1A73E8; text-transform: uppercase; letter-spacing: 0.5px;">Payment Summary</p>
                    <p style="margin: 0; font-size: 14px; color: #555555;">Amount Paid: <span style="color: #0AA84C; font-weight: 600;">$${paidAmount}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Remaining Balance: <span style="color: #d68910; font-weight: 600;">$${remainingAmount}</span></p>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #555555;">Payment Status: <span style="color: #d68910; font-weight: 600;">Partially Paid</span></p>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f0; border-left: 4px solid #1A73E8; border-radius: 4px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
                      🔔 &nbsp;The remaining balance of <strong>$${remainingAmount}</strong> is due before or during your scheduled appointment. You will receive a separate receipt once the full amount has been settled.
                    </p>
                  </td>
                </tr>
              </table>

              ${
                paymentLink
                  ? `<!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                <tr>
                  <td align="center">
                    <a href="${paymentLink}" style="display: inline-block; background-color: #1A73E8; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px;">
                      Pay Remaining Balance
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }

              <p style="font-size: 14px; color: #555555; margin: 24px 0 0; line-height: 1.7;">
                If you have any questions regarding your payment or booking, please don't hesitate to reach out to our support team.
              </p>

              <p style="font-size: 14px; color: #1a1a1a; margin: 20px 0 0;">
                Best regards,<br/>
                <strong style="color: #1A73E8;">SMEVine Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f2f4; border-top: 1px solid #f0f2f4; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #aaaaaa; line-height: 1.6;">
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
