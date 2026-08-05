import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_CHARACTER_KEY } from '../constants/metadata.constants';
import { IAuthRequestUser } from '../../modules/auth/interfaces/i-auth-request.interface';

@Injectable()
export class CharacterGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireCharacter = this.reflector.getAllAndOverride<boolean>(REQUIRE_CHARACTER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requireCharacter === false) {
      return true;
    }

    if (requireCharacter !== true) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: IAuthRequestUser }>();
    const character = request.user?.character;

    if (!character) {
      throw new ForbiddenException('An active character is required');
    }

    return true;
  }
}
