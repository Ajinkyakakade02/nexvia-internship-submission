import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { verifyAccessToken } from '../utils/generateToken.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing'));
    }

    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token expired', { expired: true }));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
};

export default authenticate;
