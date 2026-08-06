import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  PayIncentiveDto,
  SearchIncentivePaymentsDto,
  UpdateIncentiveConfigurationDto,
} from './dto/incentive.dto';
import { IncentivesService } from './incentives.service';

@Controller('incentives')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @Get('dashboard')
  @Permissions('incentives.read')
  getDashboard() {
    return this.incentivesService.getDashboard();
  }

  @Get('staff')
  @Permissions('incentives.read')
  listStaff(@Query('q') q?: string) {
    return this.incentivesService.listStaff(q ?? '');
  }

  @Get('staff/:staffProfileId')
  @Permissions('incentives.read')
  getStaffDetail(@Param('staffProfileId', ParseUUIDPipe) staffProfileId: string) {
    return this.incentivesService.getStaffDetail(staffProfileId);
  }

  @Post('staff/:staffProfileId/pay')
  @Permissions('incentives.pay')
  pay(
    @Param('staffProfileId', ParseUUIDPipe) staffProfileId: string,
    @Body() dto: PayIncentiveDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.incentivesService.pay(staffProfileId, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Get('payments')
  @Permissions('incentives.read')
  listPayments(@Query() query: SearchIncentivePaymentsDto) {
    return this.incentivesService.listPayments(query);
  }

  @Get('configurations')
  @Permissions('incentives.configuration')
  listConfigurations() {
    return this.incentivesService.listConfigurations();
  }

  @Patch('configurations/:rankId')
  @Permissions('incentives.configuration')
  updateConfiguration(
    @Param('rankId', ParseUUIDPipe) rankId: string,
    @Body() dto: UpdateIncentiveConfigurationDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.incentivesService.updateConfiguration(rankId, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
