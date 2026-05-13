import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import {
  createUser,
  findUserByUsernameOrEmail,
  findUserById,
  updateUser,
} from '../models/userModel.js';
import logger from '../utils/logger.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),
  body('publicKey').notEmpty().withMessage('Public key is required'),
  body('encryptedPrivateKey').optional(),
  body('privateKeyIv').optional(),
  body('privateKeyTag').optional(),
];

const loginValidation = [
  body('usernameOrEmail').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('avatarUrl').optional().trim().isURL().withMessage('Avatar URL must be a valid URL'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Middleware to authenticate requests
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// POST /api/auth/register - Register a new user
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password, publicKey, encryptedPrivateKey, privateKeyIv, privateKeyTag } = req.body;

    // Check if user already exists
    const existingUser = await findUserByUsernameOrEmail(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({
      username,
      email,
      passwordHash,
      displayName: username,
      publicKey,
      encryptedPrivateKey,
      privateKeyIv,
      privateKeyTag,
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('User registered successfully', { userId: user.id, username: user.username });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          publicKey: user.public_key,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find user
    const user = await findUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(user.password_hash, password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('User logged in successfully', { userId: user.id, username: user.username });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          publicKey: user.public_key,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: decoded.userId, username: decoded.username });
    const newRefreshToken = generateRefreshToken({ userId: decoded.userId });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
