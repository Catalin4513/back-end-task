import type { RequestHandler } from 'express';
import type { SequelizeClient } from '../../sequelize';
import { UserType } from '../../constants';
import { getUserNamesByIds } from '../users/handlers';
import { UnauthorizedError } from '../../errors';
import { RequestAuth } from '../../middleware/security';
import { Op } from 'sequelize';

export function initListUsersPostsRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listPostsRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        if (!user) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const postQueryOptions: {
          attributes: string[];
          where?: { authorId?: number };
        } = {
          attributes: [
            'id',
            'title',
            'content',
            'isHidden',
            'authorId',
            'createdAt',
          ],
        };

        let posts;
        if (user.type === UserType.BLOGGER) {
          postQueryOptions.where = { authorId: user.id };
          posts = await models.posts.findAll(postQueryOptions);
        } else if (user.type === UserType.ADMIN) {
          posts = await models.posts.findAll(postQueryOptions);
        }

        if (!posts || posts.length === 0) {
          res.status(404).json({ error: 'No posts found' });
          return;
        }

        const uniqueAuthorIds = [
          ...new Set(posts.map((post) => post.authorId)),
        ];
        const authorMap = await getUserNamesByIds(uniqueAuthorIds, models);

        const transformedPosts = posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: authorMap[post.authorId],
          visibility: !post.isHidden,
          createdAt: post.createdAt,
        }));

        res.status(200).json({ posts: transformedPosts });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initGetPostRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listPostRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        const { id } = req.params;

        const post = await models.posts.findOne({
          attributes: ['id', 'title', 'content', 'authorId', 'createdAt'],
          where: {
            id,
            ...(user.type === UserType.BLOGGER && {
              [Op.or]: [{ isHidden: false }],
            }),
          },
          raw: true,
        });

        if (!post) {
          res.status(404).json({ message: 'Post not found' });
          return;
        }

        const author = await models.users.findOne({
          attributes: ['id', 'name'],
          where: { id: post.authorId },
          raw: true,
        });

        const transformedPost = {
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: author ? author.name : 'Unknown',
          createdAt: post.createdAt,
        };
        res.status(200).json({ post: transformedPost });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initCreatePostRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function createPostRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        interface CreatePostRequestBody {
          title: string;
          content: string;
          publish: boolean;
        }

        const { title, content, publish } = req.body as CreatePostRequestBody;

        // Check for duplicate title by the same author
        const existingPost = await models.posts.findOne({
          where: {
            title: title,
          },
          raw: true,
        });

        if (existingPost) {
          res.status(400).json({ message: 'TITLE_ALREADY_EXISTS' });
          return;
        }

        await models.posts.create({
          title,
          content,
          isHidden: !publish,
          authorId: user.id,
          createdAt: new Date(),
        });

        res.status(201).json({ message: 'Post created successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initUpdatePostRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function updatePostRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        const { id } = req.params;
        interface UpdatePostRequestBody {
          title?: string;
          content?: string;
        }

        const { title, content } = req.body as UpdatePostRequestBody;

        const post = await models.posts.findOne({ where: { id }, raw: true });

        if (!post) {
          res.status(404).json({ message: 'Post not found' });
          return;
        }

        if (post.authorId !== user.id && user.type !== UserType.ADMIN) {
          throw new UnauthorizedError('CANNOT_MODIFY_POST');
        }

        const updateFields: Partial<{ title: string; content: string }> = {};
        if (title) {
          const existingPost = await models.posts.findOne({
            where: {
              title: title,
              authorId: post.authorId,
              id: { [Op.ne]: id },
            },
            raw: true,
          });
          if (existingPost) {
            res.status(400).json({ message: 'TITLE_ALREADY_EXISTS' });
            return;
          }
          updateFields.title = title;
        }
        if (content) {
          updateFields.content = content;
        }

        if (Object.keys(updateFields).length === 0) {
          res.status(400).json({ message: 'Nothing to update' });
          return;
        }

        await models.posts.update(updateFields, { where: { id } });

        res.status(200).json({ message: 'Post updated successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initDeletePostRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function deletePostRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        const { id } = req.params;

        const post = await models.posts.findOne({ where: { id }, raw: true });
        if (!post) {
          res.status(404).json({ message: 'Post not found' });
          return;
        }

        if (user.type !== UserType.ADMIN && post.authorId !== user.id) {
          throw new UnauthorizedError('CANNOT_DELETE_POST');
        }

        if (user.type === UserType.ADMIN && post.isHidden === true) {
          throw new UnauthorizedError('ADMINS_CAN_ONLY_DELETE_PUBLIC_POSTS');
        }

        await models.posts.destroy({ where: { id } });

        res.status(200).json({ message: 'Post deleted successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initPublishPostRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function publishPostRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };
        const { id } = req.params;
        interface PublishPostRequestBody {
          visible: boolean;
        }
        const { visible } = req.body as PublishPostRequestBody;

        const post = await models.posts.findOne({
          where: { id, authorId: user.id },
          raw: true,
        });
        if (!post) throw new UnauthorizedError('CANNOT_MODIFY_POST_VISIBILITY');

        await models.posts.update({ isHidden: !visible }, { where: { id } });

        res.status(200).json({ message: 'Post status updated successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initListAllPostsRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listAllPostsRequestHandler(req, res, next): void {
    (async () => {
      const { models } = sequelizeClient;

      try {
        const posts = await models.posts.findAll({
          attributes: ['id', 'title', 'content', 'authorId', 'createdAt'],
          where: { isHidden: false },
          raw: true,
        });

        const uniqueAuthorIds = [
          ...new Set(posts.map((post) => post.authorId)),
        ];
        const authorMap = await getUserNamesByIds(uniqueAuthorIds, models);

        const transformedPosts = posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          authorName: authorMap[post.authorId],
          createdAt: post.createdAt,
        }));

        res.status(200).json({ posts: transformedPosts });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}
