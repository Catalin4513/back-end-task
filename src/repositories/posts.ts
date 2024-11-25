import { BelongsTo, HasMany, Model } from 'sequelize';

import type { SequelizeModels } from '../sequelize';
import type { User, Comment } from './types';

export class Post extends Model {
  static associations: {
    author: BelongsTo<Post, User>;
    comments: HasMany<Post, Comment>;
  };

  id!: number;
  title!: string;
  content!: string;
  isHidden!: boolean;
  authorId!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static associate(models: SequelizeModels): void {
    this.belongsTo(models.users, { foreignKey: 'authorId', as: 'author' });
    this.hasMany(models.comments, { foreignKey: 'postId', as: 'comments' });
  }
}

export type PostsModel = typeof Post;
