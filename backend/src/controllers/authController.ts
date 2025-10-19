import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { User } from '../models';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, full_name, university } = req.body;

      // Basic required field checks
      if (!email || !password || !full_name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and full name are required',
        });
      }

      // Basic email format check
      if (!email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email',
        });
      }

      // Basic password length check
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }

      // Create new user
      const user = await AuthService.registerUser(email, password, full_name, university);
      
      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Update last login
      await user.update({ last_login: new Date() });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toSafeObject(),
          tokens,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Basic required field checks
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Validate user credentials
      const user = await AuthService.validateUser(email, password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toSafeObject(),
          tokens,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await User.findByPk(req.user!.user_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeObject(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const decoded = AuthService.verifyToken(refreshToken);
      const user = await User.findByPk(decoded.user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const tokens = AuthService.generateTokens(user);

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error: any) {
      res.status(403).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { full_name, university } = req.body;
      const user = await User.findByPk(req.user!.user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update allowed fields
      if (full_name !== undefined) {
        if (!full_name.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Full name cannot be empty',
          });
        }
        user.full_name = full_name;
      }
      
      if (university !== undefined) {
        user.university = university;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toSafeObject(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }
}

export default AuthController;