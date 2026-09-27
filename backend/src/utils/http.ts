import { Response } from 'express';
export function ok(res: Response, data: unknown, status = 200) { return res.status(status).json(data); }
export function fail(res: Response, message: string, status = 400, details?: unknown) { return res.status(status).json({ message, ...(details ? {details} : {}) }); }
