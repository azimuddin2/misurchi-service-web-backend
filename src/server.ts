import mongoose from 'mongoose';
import app from './app';
import { createServer, Server } from 'http';
import config from './app/config';
import initializeSocketIO from './socket';
import chalk from 'chalk';

let server: Server;
export const io = initializeSocketIO(createServer(app));

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log(
      chalk.green('✅ Connection to database is successfully established'),
    );

    server = app.listen(config.port, () => {
      console.log(chalk.blue(`🚀 Server is running on port: ${config.port}`));
    });

    io.listen(Number(config.socket_port));
    console.log(
      chalk.magenta(`🔌 Socket is listening on port: ${config.socket_port}`),
    );

    (global as any).socketio = io;
  } catch (error) {
    console.log(chalk.red('❌ Error:', error));
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.log(chalk.red(`😈 unhandledRejection detected, shutting down...`));
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log(chalk.red(`😈 uncaughtException detected, shutting down...`));
  process.exit(1);
});
