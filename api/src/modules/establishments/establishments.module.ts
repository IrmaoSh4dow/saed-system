import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { EstablishmentsController } from './establishments.controller';
import { EstablishmentsService } from './establishments.service';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
