import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import type {
  IAuthAccount,
  IAuthCharacter,
} from '../auth/interfaces/i-auth-request.interface';
import {
  CreateStaffRatingDto,
  StaffRatingsQueryDto,
} from './dto/staff-rating.dto';
import { StaffRatingsService } from './staff-ratings.service';

@Controller('staff-ratings')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class StaffRatingsController {
  constructor(private readonly staffRatingsService: StaffRatingsService) {}

  @Post()
  @Permissions('staff-ratings.create')
  create(
    @Body() dto: CreateStaffRatingDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.staffRatingsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Get('dashboard')
  @Permissions('staff-ratings.read')
  getDashboard(@CurrentCharacter() character: IAuthCharacter) {
    return this.staffRatingsService.getDashboard(character.permissions ?? []);
  }

  @Get('pending')
  @Permissions('staff-ratings.create')
  listPending(@CurrentCharacter() character: IAuthCharacter) {
    return this.staffRatingsService.listMinePending(character.id);
  }

  @Get('eligibility/appointment/:appointmentId')
  @Permissions('appointments.read')
  getAppointmentEligibility(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.staffRatingsService.getAppointmentEligibility(
      appointmentId,
      character.id,
    );
  }

  @Get('eligibility/:adminRequestId')
  @Permissions('admin-requests.read')
  getEligibility(
    @Param('adminRequestId', ParseUUIDPipe) adminRequestId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.staffRatingsService.getEligibility(
      adminRequestId,
      character.id,
    );
  }

  @Get('staff/:staffProfileId')
  @Permissions('staff-ratings.read')
  listForStaff(
    @Param('staffProfileId', ParseUUIDPipe) staffProfileId: string,
    @Query() query: StaffRatingsQueryDto,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.staffRatingsService.listForStaff(
      staffProfileId,
      character.permissions ?? [],
      query.take ? Number(query.take) : 20,
    );
  }
}
