import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // If no roles are required, allow access
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false; // If there's no user or the user doesn't have a role, deny access
    }
    
    // Super admins always have access
    if (user.role === Role.SUPER_ADMIN) {
        return true;
    }

    return requiredRoles.includes(user.role);
  }
}
