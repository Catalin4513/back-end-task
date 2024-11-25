import { Sequelize, Options } from 'sequelize';

import type {
  PostsModel,
  UsersModel,
  CommentsModel,
} from './repositories/types';

import { setupPostsModel, setupUsersModel, setupCommentsModel } from './models';

const postsModelName = 'posts';
const usersModelName = 'users';
const commentsModelName = 'comments';

export async function initSequelizeClient(
  params: SetupSequelizeParams,
): Promise<SequelizeClient> {
  const { dialect, host, port, username, password, database } = params;

  const sequelizeClient = new Sequelize({
    dialect,
    host,
    port,
    username,
    password,
    database,
    logging: false,
  });

  setupUsersModel(usersModelName, sequelizeClient);
  setupPostsModel(postsModelName, sequelizeClient);
  setupCommentsModel(commentsModelName, sequelizeClient);

  associateModels(sequelizeClient.models as unknown as SequelizeModels);

  // NOTE(roman): this creates the tables in the database for add the defined models, if they don't already exist
  try {
    await sequelizeClient.sync();
  } catch (error) {
    console.error('Failed to sync database:', error);
    throw error;
  }

  return sequelizeClient as unknown as SequelizeClient;
}

function associateModels(models: SequelizeModels): void {
  for (const model of Object.values(models)) {
    const associate = (model as ModelWithPossibleAssociations).associate?.bind(
      model,
    );
    if (associate) {
      associate(models);
    }
  }
}

type SetupSequelizeParams = Pick<
  Options,
  'dialect' | 'host' | 'port' | 'username' | 'password' | 'database'
>;

export interface SequelizeModels {
  [usersModelName]: UsersModel;
  [postsModelName]: PostsModel;
  [commentsModelName]: CommentsModel;
}

interface ModelWithPossibleAssociations {
  associate?(models: SequelizeModels): void;
}

// @ts-expect-error sequelize was not built for this kind of modifications
export interface SequelizeClient extends Sequelize {
  models: SequelizeModels;
}
