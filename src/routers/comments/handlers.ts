import { RequestHandler } from 'express';
import type { SequelizeClient } from '../../sequelize';
import { getUserNamesByIds } from '../users/handlers';
import { BadRequestError, UnauthorizedError } from '../../errors';
import { RequestAuth } from '../../middleware/security';
import { UserType } from '../../constants';

export function initGetCommentRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function getCommentRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;
      const { id } = req.params;

      try {
        const comment = await models.comments.findByPk(id);

        if (!comment) {
          return next(new BadRequestError('Comment not found'));
        }

        res.status(200).json({ comment });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initDeleteCommentRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function deleteCommentRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;
      const { id } = req.params;
      const {
        auth: { user },
      } = req as unknown as { auth: RequestAuth };

      try {
        const comment = await models.comments.findByPk(id);

        if (!comment) {
          return next(new BadRequestError('Comment not found'));
        }

        if (comment.authorId !== user.id && user.type !== UserType.ADMIN) {
          return next(
            new UnauthorizedError(
              'You are not authorized to delete this comment',
            ),
          );
        }

        await comment.destroy();

        res.status(200).json({ message: 'Comment deleted successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initListPostCommentsRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listCommentsRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;

      try {
        const {
          auth: { user },
        } = req as unknown as { auth: RequestAuth };

        const post = await models.posts.findByPk(req.params.id);
        if (!post) {
          return next(new BadRequestError('Post not found'));
        }

        const isPostAuthor = post.authorId === user.id;
        if (post.isHidden && user.type !== UserType.ADMIN && !isPostAuthor) {
          return next(
            new UnauthorizedError('You do not have access to this post'),
          );
        }

        const commentQueryOptions: {
          attributes: string[];
          where: { postId: string };
        } = {
          attributes: ['id', 'content', 'authorId', 'createdAt'],
          where: { postId: req.params.id },
        };

        const comments = await models.comments.findAll(commentQueryOptions);

        const uniqueAuthorIds = [
          ...new Set(comments.map((comment) => comment.authorId)),
        ];
        const authorMap = await getUserNamesByIds(uniqueAuthorIds, models);

        const transformedComments = comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          authorName: authorMap[comment.authorId],
          createdAt: comment.createdAt,
        }));

        res.status(200).json({ comments: transformedComments });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initCreateCommentRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function createCommentRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;
      const postId = req.params.id;
      const { content } = req.body as { content: string };
      const {
        auth: { user },
      } = req as unknown as { auth: RequestAuth };

      if (!content || !postId) {
        return next(new BadRequestError('Content and postId are required'));
      }

      try {
        const post = await models.posts.findByPk(postId);

        if (!post) {
          return next(new BadRequestError('Post not found'));
        }

        const comment = await models.comments.create({
          content,
          postId,
          authorId: user.id,
          isHidden: false,
        });

        res
          .status(201)
          .json({ message: 'Comment created successfully', comment });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initUpdateCommentRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function updateCommentRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;
      const { id } = req.params;
      const { content } = req.body as { content: string };
      const {
        auth: { user },
      } = req as unknown as { auth: RequestAuth };

      if (!content) {
        return next(new BadRequestError('Content is required'));
      }

      try {
        const comment = await models.comments.findByPk(id);

        if (!comment) {
          return next(new BadRequestError('Comment not found'));
        }

        if (comment.authorId !== user.id && user.type !== UserType.ADMIN) {
          return next(
            new UnauthorizedError(
              'You are not authorized to edit this comment',
            ),
          );
        }

        comment.content = content;
        await comment.save();

        res.status(200).json({ message: 'Comment updated successfully' });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}

export function initListUserCommentsRequestHandler(
  sequelizeClient: SequelizeClient,
): RequestHandler {
  return function listUserCommentsRequestHandler(req, res, next): void {
    (async (): Promise<void> => {
      const { models } = sequelizeClient;
      const {
        auth: { user },
      } = req as unknown as { auth: RequestAuth };

      try {
        const comments = await models.comments.findAll({
          attributes: ['id', 'content', 'postId', 'createdAt'],
          where: { authorId: user.id },
          raw: true,
        });

        res.status(200).json({ comments });
      } catch (error) {
        next(error);
      }
    })().catch(next);
  };
}
