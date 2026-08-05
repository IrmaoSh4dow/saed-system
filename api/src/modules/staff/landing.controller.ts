import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { StaffService } from './staff.service';

@Controller('landing')
export class LandingController {
  constructor(private readonly staffService: StaffService) {}

  @Public()
  @Get('personnel')
  listPersonnel() {
    return this.staffService.listPublicPersonnel();
  }
}
