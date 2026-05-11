import mongoose from 'mongoose';
import app from './app';
import { createServer, Server } from 'http';
import config from './app/config';
import initializeSocketIO from './socket';
import chalk from 'chalk';
import { startCronJobs } from './app/utils/cronJobs';

let server: Server;
export const io = initializeSocketIO(createServer(app));

async function main() {
  try {
    await mongoose.connect(
      'mongodb://mohammadazimuddin:Yn13pU4ul04s9ke6@ac-evxy9ch-shard-00-00.nbb0ei9.mongodb.net:27017,ac-evxy9ch-shard-00-01.nbb0ei9.mongodb.net:27017,ac-evxy9ch-shard-00-02.nbb0ei9.mongodb.net:27017/misurchiServiceWeb?ssl=true&replicaSet=atlas-11j7uv-shard-0&authSource=admin&appName=Cluster0' as string,
    );
    // await mongoose.connect(config.database_url as string);
    console.log(
      chalk.green('🟢 Connection to database is successfully established'),
    );

    startCronJobs();

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
