import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserInfo } from '../dtos';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as UserInfo;

    return data?.length ? user[data as keyof UserInfo] : user;
  },
);
