import { TTeamMember } from './teamMember.interface';

export const buildEmailWithPassword = (
  payload: TTeamMember,
  vendor: any,
  tempPassword: string,
): string => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Team Member Invitation</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;padding:40px;border-radius:8px;">
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <h2 style="color:#007BFF;margin:0;">You're added as a Team Member</h2>
          </td>
        </tr>
        <tr>
          <td style="font-size:16px;color:#333;text-align:center;padding-bottom:20px;">
            <p>You have been added as <strong>${payload.role}</strong> by <strong>${vendor.businessName}</strong>.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 0;">
            <div style="background:#f8f8f8;padding:20px;border-radius:6px;text-align:left;">
              <p style="margin:0 0 8px;"><strong>Email:</strong> ${payload.email}</p>
              <p style="margin:0 0 8px;"><strong>Temporary Password:</strong>
                <span style="font-size:18px;font-weight:bold;color:#007BFF;letter-spacing:2px;">
                  ${tempPassword}
                </span>
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#666;text-align:center;">
            <p>Please change your password after first login.</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:30px;text-align:center;">
            <p style="font-size:12px;color:#ccc;margin:0;">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const buildEmailWithoutPassword = (
  payload: TTeamMember,
  vendor: any,
): string => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Team Member Invitation</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;padding:40px;border-radius:8px;">
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <h2 style="color:#007BFF;margin:0;">You're added as a Team Member</h2>
          </td>
        </tr>
        <tr>
          <td style="font-size:16px;color:#333;text-align:center;padding-bottom:20px;">
            <p>You have been added as <strong>${payload.role}</strong> by <strong>${vendor.businessName}</strong>.</p>
            <p>Login with your existing credentials.</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:30px;text-align:center;">
            <p style="font-size:12px;color:#ccc;margin:0;">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
