import express from 'express';

import { initSequelizeClient } from './sequelize';
import { initPostsRouter } from './routers/posts/index';
import { initUsersRouter } from './routers/users/index';
import { initCommentsRouter } from './routers/comments/index';
import dotenv from 'dotenv';
import {
  initErrorRequestHandler,
  initNotFoundRequestHandler,
} from './middleware';

const PORT = 8081;

async function main(): Promise<void> {
  const app = express();

  dotenv.config();

  // TODO: store these credentials in some external configs
  // so that they don't end up in the git repo
  const sequelizeClient = await initSequelizeClient({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'example',
    database: process.env.DB_NaME || 'bend-backend-task',
  });

  app.use(express.json());

  app.use('/api/v1/users', initUsersRouter(sequelizeClient));

  app.use('/api/v1/posts', initPostsRouter(sequelizeClient));

  app.use('/api/v1/comments', initCommentsRouter(sequelizeClient));

  app.use('/', initNotFoundRequestHandler());

  app.use(initErrorRequestHandler());

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.info(`app listening on port: '${PORT}'`);

      resolve();
    });
  });
}

main()
  .then(() => console.info('app started'))
  .catch(console.error);
