import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { RolesService } from 'src/roles/roles.service';
import { ShopService } from 'src/shops/shops.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly shopService: ShopService,
    private readonly rolesService: RolesService, // Assuming RolesService is used elsewhere
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY, {
        algorithms: [(process.env.JWT_ALGORITHM || 'HS256') as jwt.Algorithm],
      });

      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('shop_id' in payload)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }
      const roles = await this.rolesService.findByUserId(
        (payload as any).user_id, // Assuming user_id is in the payload
      );
      const permissionsUniqueCode = new Set<string>();
      roles.forEach((role) => {
        role.permissions.forEach((permission) => {
          permissionsUniqueCode.add(permission.code);
        });
      });

      const shop = await this.shopService.findOne((payload as any).shop_id);
      if (!shop) {
        throw new UnauthorizedException('Shop not found');
      }

      request['user'] = payload;
      request['shop'] = shop;
      request['permissions'] = Array.from(permissionsUniqueCode);
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
