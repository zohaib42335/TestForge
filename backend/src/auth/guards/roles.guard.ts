import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_PRIORITY: Record<UserRole, number> = {
  ADMIN: 4,
  QA_MANAGER: 3,
  TESTER: 2,
  VIEWER: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: UserRole } }>();
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException('User role is missing from request context.');
    }

    const hasPermission = requiredRoles.some(
      (requiredRole) => ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole],
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient role permissions.');
    }

    return true;
  }
}
