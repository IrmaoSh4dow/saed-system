import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AccountsAdminService } from './accounts-admin.service';
import { AccountsController } from './accounts.controller';
import { AccountsSelfController } from './accounts-self.controller';
import { AccountsSelfService } from './accounts-self.service';
import { AccountsService } from './accounts.service';

@Module({
  imports: [AuditModule],
  controllers: [AccountsSelfController, AccountsController],
  providers: [AccountsService, AccountsAdminService, AccountsSelfService],
  exports: [AccountsService],
})
export class AccountsModule {}
