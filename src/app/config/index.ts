import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  server_url: process.env.SERVER_URL,
  client_Url: process.env.CLIENT_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  resend_api_key: process.env.RESEND_API_KEY,
  aws_region: process.env.AWS_REGION,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
  aws_bucket: process.env.AWS_BUCKET,
  socket_port: process.env.SOCKET_PORT,

  stripe_api_key: process.env.STRIPE_API_KEY,
  stripe_api_secret: process.env.STRIPE_API_SECRET,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: process.env.CURRENCY || 'usd',
};
