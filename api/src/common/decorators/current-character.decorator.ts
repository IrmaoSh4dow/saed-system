import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  IAuthCharacter,
  IAuthRequestUser,
} from '../../modules/auth/interfaces/i-auth-request.interface';

export const CurrentCharacter = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthCharacter | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: IAuthRequestUser }>();
    return request.user?.character ?? undefined;
  },
);
