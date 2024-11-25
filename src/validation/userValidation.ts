import { body, param } from 'express-validator';

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateRegister = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
];

export const validateRefreshToken = [
  param('id').isUUID().withMessage('Valid user ID is required'),
];

export const validateAdminAction = [
  param('id').isUUID().withMessage('Valid admin ID is required'),
];
