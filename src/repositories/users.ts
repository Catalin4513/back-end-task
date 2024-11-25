import { HasMany, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { Post, Comment } from './types';

import { UserType } from '../constants';

export class User extends Model {
  static associations: {
    posts: HasMany<User, Post>;
    comments: HasMany<User, Comment>;
  };

  id!: number;
  type!: UserType;
  name!: string;
  email!: string;
  passwordHash!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static associate(models: SequelizeModels): void {
    this.hasMany(models.posts, { foreignKey: 'authorId', as: 'posts' });
    this.hasMany(models.comments, { foreignKey: 'authorId', as: 'comments' });
  }
}

export type UsersModel = typeof User;
