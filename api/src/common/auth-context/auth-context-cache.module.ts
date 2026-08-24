import { Global, Module } from '@nestjs/common';
import { AuthContextCacheService } from './auth-context-cache.service';

/**
 * Global so any module mutating roles/permissions can invalidate the auth cache
 * without importing AuthModule (which would create circular dependencies).
 */
@Global()
@Module({
  providers: [AuthContextCacheService],
  exports: [AuthContextCacheService],
})
export class AuthContextCacheModule {}
