import {
  NextFunction,
  Request,
  Response,
} from 'express';

import jwt from 'jsonwebtoken';

import { Role } from '@prisma/client';

import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
      };
    }
  }
}

export function auth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      env.jwtSecret
    );

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.id !== 'number' ||
      typeof decoded.email !== 'string' ||
      (decoded.role !== Role.ADMIN &&
        decoded.role !== Role.SALES_USER)
    ) {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
}

export function requireRole(
  ...roles: Role[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    next();
  };
}