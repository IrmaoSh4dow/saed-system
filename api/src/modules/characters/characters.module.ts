import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AuditModule } from '../audit/audit.module';
import { EstablishmentsModule } from '../establishments/establishments.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { AvatarStorageService } from './avatar-storage.service';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

@Module({
  imports: [
    PermissionsModule,
    RolesModule,
    AccountsModule,
    AuditModule,
    EstablishmentsModule,
  ],
  controllers: [CharactersController],
  providers: [CharactersService, AvatarStorageService],
  exports: [CharactersService],
})
export class CharactersModule {}

