import { body, param } from 'express-validator';

export const validateCreateComment = [
  body('content').notEmpty().withMessage('Content is required'),
  body('postId').isInt().withMessage('Post ID must be an integer'),
];

export const validateCommentId = [
  param('id').isInt().withMessage('Comment ID must be an integer'),
];
