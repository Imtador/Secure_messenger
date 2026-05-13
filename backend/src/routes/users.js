import { Router } from 'express';
import { authenticate } from './auth.js';
import { findUserById, updateUser, searchUsers } from '../models/userModel.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// PUT /api/users/me - Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    
    const user = await updateUser(req.user.userId, { displayName, avatarUrl });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.info('User profile updated', { userId: req.user.userId });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/users/search - Search users by username or display name
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const users = await searchUsers(q.trim(), req.user.userId);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// GET /api/users/:id - Get user profile by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
