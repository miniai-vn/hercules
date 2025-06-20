import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { ShopService } from 'src/shops/shops.service';

export interface JwtPayload {
  email?: string;
  userId: string;
  shopId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  tokenType: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly shopService: ShopService, // Assuming shopService is similar to usersService
  ) {}

  // Login user
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.shopId, user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        platform: user.platform,
        zaloId: user.zaloId,
        shopId: user.shopId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  // Register user
  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists by username
      const existingUserByUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUserByUsername) {
        throw new ConflictException('Username already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(registerDto.password);

      // Create user data
      const userData = {
        ...registerDto,
        password: hashedPassword,
        isActive: true, // Set to false if you want email verification
      };

      // Create user

      const shop = await this.shopService.create({
        name: 'Default Shop', // Use shopName from registerDto or default
      });
      const user = await this.usersService.create(
        {
          ...userData,
          shopId: shop.id, // Assign the created shop ID
        } as CreateUserDto, // Cast to CreateUserDto
      );

      // Generate tokens using the full User entity
      const tokens = await this.generateTokens(shop.id, registerDto.platform);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          platform: user.platform,
          shopId: user.shopId,
          createdAt: user.createdAt,
        },
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  // Validate user credentials
  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      // Try to find user by username or email
      const user = await this.usersService.findByUsername(username);

      if (!user) {
        return null;
      }

      // Check if password matches
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  // Generate access and refresh tokens
  async generateTokens(
    shopId: string,
    userId: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const payload: JwtPayload = {
      userId,
      shopId,
    };

    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '24h',
        ),
      }),
    ]);

    return { accessToken };
  }

  // Verify access token
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Logout (invalidate tokens - if you implement token blacklist)
  async logout(userId: string, token: string): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Get token expiration time in seconds
  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '1h',
    );

    // Convert to seconds
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }

    return 3600; // Default 1 hour
  }

  // Decode token without verification (for debugging)
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded?.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}
