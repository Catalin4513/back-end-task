import { body } from 'express-validator';

export const validateCreatePost = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
];

export const validateUpdatePost = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
];
