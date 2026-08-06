import { Module, forwardRef } from '@nestjs/common';
import { AgreementsModule } from '../agreements/agreements.module';
import { OccupationalHealthModule } from '../occupational-health/occupational-health.module';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [AgreementsModule, forwardRef(() => OccupationalHealthModule)],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
