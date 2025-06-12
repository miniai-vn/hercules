// auth/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ShopService } from '../shops/shops.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly shopService: ShopService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      // Verify and decode the token created by Python
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY, {
        algorithms: [(process.env.JWT_ALGORITHM || 'HS256') as jwt.Algorithm],
      });

      // Ensure payload is an object and has shop_id
      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('shop_id' in payload)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Fetch shop using ShopService
      const shop = await this.shopService.findOne((payload as any).shop_id);
      if (!shop) {
        throw new UnauthorizedException('Shop not found');
      }
      console.log('Shop found:', shop);
      // Attach user and shop to request object
      request['user'] = payload;
      request['shop'] = shop;
      // console.log('Associated shop:', request['shop']);
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
