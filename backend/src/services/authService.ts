import jwt from 'jsonwebtoken';
import { User } from '../models';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  user_id: string;
  email: string;
}

class AuthService {
  private static ACCESS_TOKEN_EXPIRY = '15m';
  private static REFRESH_TOKEN_EXPIRY = '7d';

  static generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      user_id: user.user_id,
      email: user.email,
    };

    const jwtSecret = process.env.JWT_SECRET as string;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, jwtSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): TokenPayload {
    const jwtSecret = process.env.JWT_SECRET as string;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.verify(token, jwtSecret) as TokenPayload;
  }

  static async validateUser(email: string, password: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return null;
    }

    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static async registerUser(
    email: string,
    password: string,
    full_name: string,
    university?: string
  ): Promise<User> {
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      email,
      password_hash: password,
      full_name,
      university,
    });

    return user;
  }
}

export default AuthService;