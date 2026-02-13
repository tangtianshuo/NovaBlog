import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileSystem } from '../utils/fileSystem.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cyberpunk-secret-key';

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const users = await fileSystem.getUsers();
    const user = users.find(u => u.username === username);

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
        res.status(403).json({ success: false, message: 'Invalid token' });
        return;
    }
    (req as any).user = user;
    next();
  });
};

export default router;