import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  IAuthAccount,
  IAuthRequestUser,
} from '../../modules/auth/interfaces/i-auth-request.interface';

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthAccount | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: IAuthRequestUser }>();
    return request.user?.account;
  },
);
