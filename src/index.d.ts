import { UserInfo } from './common/dtos';

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}
