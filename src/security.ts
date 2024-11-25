import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
dotenv.config();
// TODO(roman): implement these
// external libraries can be used
// you can even ignore them and use your own preferred method

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

export function validatePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(reject(err));
      } else {
        resolve(result);
      }
    });
  });
}

export function generateHashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

export function generateToken(data: TokenData): string {
  const secretKey = process.env.ACCESS_TOKEN_SECRET;
  if (!secretKey) {
    throw new Error('SECRET_KEY is not defined');
  }
  return jwt.sign(data, secretKey, { expiresIn: '10m' });
}

export function generateRefreshToken(data: TokenData): string {
  const secretKey = process.env.REFRESH_TOKEN_SECRET;
  if (!secretKey) {
    throw new Error('SECRET_KEY is not defined');
  }
  return jwt.sign(data, secretKey, { expiresIn: '1d' });
}

import { Response } from 'express';

export function refreshAccessToken(
  data: TokenData,
  token: string,
  res: Response,
): void {
  const secretKey = process.env.REFRESH_TOKEN_SECRET;
  if (!secretKey) {
    throw new Error('SECRET_KEY is not defined');
  }
  jwt.verify(token, secretKey, (err) => {
    if (err) {
      return res.status(406).json({ message: 'Unauthorized' });
    }
    const accessToken = generateToken(data);

    return res.json({ accessToken });
  });
}

const secretKey = process.env.ACCESS_TOKEN_SECRET || '';

export function isValidToken(token: string): boolean {
  try {
    jwt.verify(token, secretKey as jwt.Secret);
    return true;
  } catch (err) {
    return false;
  }
}

// NOTE(roman): assuming that `isValidToken` will be called before
export function extraDataFromToken(token: string): TokenData {
  try {
    const decoded = jwt.verify(token, secretKey) as TokenData;
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
}

export interface TokenData {
  id: number;
}
