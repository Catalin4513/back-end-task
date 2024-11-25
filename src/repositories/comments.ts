import { BelongsTo, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { User } from './types';

import type { Post } from './types';

export class Comment extends Model {
  static associations: {
    post: BelongsTo<Comment, Post>;
    author: BelongsTo<Comment, User>;
  };

  id!: number;
  content!: string;
  authorId!: number;
  postId!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static associate(models: SequelizeModels): void {
    this.belongsTo(models.posts, { foreignKey: 'postId', as: 'post' });
    this.belongsTo(models.users, { foreignKey: 'authorId', as: 'author' });
  }
}

export type CommentsModel = typeof Comment;
