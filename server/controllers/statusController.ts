import { Request, Response } from 'express';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function getStatus(req: Request, res: Response) {
  try {
    const response = await fetch(`${BACKEND_URL}/status`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach backend' });
  }
}
