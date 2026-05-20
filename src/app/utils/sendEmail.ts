import { Resend } from 'resend';
import config from '../config';

const resend = new Resend(config.resend_api_key);

export const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({
    from: 'Scott Clements <noreply@smevine.com>',
    to,
    subject,
    html,
  });
};
