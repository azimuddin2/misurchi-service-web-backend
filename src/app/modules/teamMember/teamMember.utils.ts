import config from '../../config';
import { TTeamMember } from './teamMember.interface';

const baseStyle = `
  margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;
`;

const containerStyle = `
  background:#ffffff;padding:48px 40px;border-radius:12px;
  box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;
`;

export const buildEmailWithPassword = (
  payload: TTeamMember,
  vendor: any,
  tempPassword: string,
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Team Member Invitation</title>
</head>
<body style="${baseStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="${containerStyle}">

        <!-- Logo / Brand -->
        <tr>
          <td align="center" style="padding-bottom:32px;border-bottom:1px solid #e8ecf0;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f6e56;letter-spacing:-0.5px;">
              ${vendor.businessName}
            </h1>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:32px 0 16px;">
            <div style="background:#e8f5f0;width:56px;height:56px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">🎉</span>
            </div>
            <h2 style="margin:0;font-size:20px;font-weight:700;color:#1a1a2e;">
              Welcome to the Team!
            </h2>
            <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
              You've been invited to join <strong>${vendor.businessName}</strong>
            </p>
          </td>
        </tr>

        <!-- Role Badge -->
<tr>
  <td align="center" style="padding:16px 0 24px;">
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">
      Your Role
    </p>

    ${
      payload.role === 'manager'
        ? `<span style="display:inline-flex;align-items:center;gap:10px;background:#e8f5f0;color:#0f6e56;padding:10px 28px;border-radius:99px;font-size:14px;font-weight:700;letter-spacing:0.3px;border:1px solid #a7f3d0;line-height:1;">
          <span style="font-size:18px;line-height:1;">&#128188;</span>
          <span>Manager</span>
         </span>`
        : payload.role === 'supervisor'
          ? `<span style="display:inline-flex;align-items:center;gap:10px;background:#e8f5f0;color:#0f6e56;padding:10px 28px;border-radius:99px;font-size:14px;font-weight:700;letter-spacing:0.3px;border:1px solid #a7f3d0;line-height:1;">
          <span style="font-size:18px;line-height:1;">&#128737;</span>
          <span>Supervisor</span>
         </span>`
          : `<span style="display:inline-flex;align-items:center;gap:10px;background:#e8f5f0;color:#0f6e56;padding:10px 28px;border-radius:99px;font-size:14px;font-weight:700;letter-spacing:0.3px;border:1px solid #a7f3d0;line-height:1;">
          <span style="font-size:18px;line-height:1;">&#128100;</span>
          <span>Team Member</span>
         </span>`
    }
  </td>
</tr>

        <!-- Credentials -->
        <tr>
          <td style="padding:0 0 24px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">
                Your Login Credentials
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:13px;color:#6b7280;">Email</span><br/>
                    <span style="font-size:15px;font-weight:600;color:#1a1a2e;">${payload.email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="font-size:13px;color:#6b7280;">Password</span><br/>
                    <span style="
                      font-size:22px;font-weight:700;
                      color:#0f6e56;letter-spacing:4px;
                      font-family:'Courier New',monospace;
                    ">${tempPassword}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Warning -->
        <tr>
          <td style="padding:0 0 32px;">
            <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;">⚠️</span>
              <span style="font-size:13px;color:#92400e;">
                Please change your password after your first login for security.
              </span>
            </div>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <a href=${`${config.client_Url}/login`} style="
              display:inline-block;
              background:#0f6e56;color:#ffffff;
              padding:14px 36px;border-radius:8px;
              font-size:15px;font-weight:600;
              text-decoration:none;letter-spacing:0.3px;
            ">
              Login to Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="border-top:1px solid #e8ecf0;padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${vendor.businessName}. All rights reserved.
            </p>
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
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Team Member Invitation</title>
</head>
<body style="${baseStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="${containerStyle}">

        <!-- Logo / Brand -->
        <tr>
          <td align="center" style="padding-bottom:32px;border-bottom:1px solid #e8ecf0;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f6e56;letter-spacing:-0.5px;">
              ${vendor.businessName}
            </h1>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:32px 0 16px;">
            <div style="background:#e8f5f0;width:56px;height:56px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:24px;">👋</span>
            </div>
            <h2 style="margin:0;font-size:20px;font-weight:700;color:#1a1a2e;">
              You've Been Added to the Team!
            </h2>
            <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
              You've been invited to join <strong>${vendor.businessName}</strong>
            </p>
          </td>
        </tr>

        <!-- Role Badge -->
        <tr>
          <td align="center" style="padding:16px 0 24px;">
            <span style="
              background:#e8f5f0;color:#0f6e56;
              padding:6px 20px;border-radius:99px;
              font-size:13px;font-weight:600;
              text-transform:capitalize;letter-spacing:0.3px;
            ">
              ${payload.role.replace('_', ' ')}
            </span>
          </td>
        </tr>

        <!-- Info -->
        <tr>
          <td style="padding:0 0 24px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;text-align:center;">
              <p style="margin:0;font-size:15px;color:#374151;">
                Use your <strong>existing credentials</strong> to login and access your new dashboard.
              </p>
            </div>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <a href=${`${config.client_Url}/login`} style="
              display:inline-block;
              background:#0f6e56;color:#ffffff;
              padding:14px 36px;border-radius:8px;
              font-size:15px;font-weight:600;
              text-decoration:none;letter-spacing:0.3px;
            ">
              Login to Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="border-top:1px solid #e8ecf0;padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${vendor.businessName}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
