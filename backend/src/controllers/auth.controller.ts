import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Email and password are required',
    });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@feedpulse.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatch = password === adminPassword;

  if (!emailMatch || !passwordMatch) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    return;
  }

  const secret = process.env.JWT_SECRET || 'feedpulse_default_secret';
  const token = jwt.sign({ email: adminEmail }, secret, { expiresIn: '24h' });

  res.json({
    success: true,
    data: { token, email: adminEmail },
    message: 'Login successful',
  });
};
