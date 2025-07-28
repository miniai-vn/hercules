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
    private readonly shopService: ShopService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.shop.id, user.id);

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
        shopId: user.shop.id,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const existingUserByUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUserByUsername) {
        throw new ConflictException('Username already exists');
      }

      const hashedPassword = await this.hashPassword(registerDto.password);

      const userData = {
        ...registerDto,
        password: hashedPassword,
        isActive: true,
      };

      const shop = await this.shopService.create({
        name: 'Default Shop',
      });

      const roleAdmin = shop.roles.find((role) => role.name === 'Admin');

      const user = await this.usersService.create({
        ...userData,
        shopId: shop.id,
        roleIds: [roleAdmin.id],
      } as CreateUserDto);

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

          shopId: user.shop.id,
          createdAt: user.createdAt,
        },
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      throw new BadRequestException('Registration failed');
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByUsername(username);

      if (!user) {
        return null;
      }

      const isPasswordValid = bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

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
        secret: process.env.JWT_SECRET_KEY,
        expiresIn: '24h',
      }),
    ]);

    return { accessToken };
  }

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

  async logout(userId: string, token: string): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compareSync(password, hashedPassword);
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '1h',
    );

    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }

    return 3600;
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

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
