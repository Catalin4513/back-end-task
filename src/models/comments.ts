import { Sequelize, DataTypes } from 'sequelize';

export function setupCommentsModel(
  modelName: string,
  sequelize: Sequelize,
): void {
  sequelize.define(
    modelName,
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'comments',
      modelName,
      name: {
        singular: 'comment',
        plural: 'comments',
      },
      timestamps: true,
    },
  );
}
