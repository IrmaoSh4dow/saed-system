import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AcademyApplicationStatus, AcademyApplicationType } from '@prisma/client';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { AcademyService } from './academy.service';
import {
  CreateAcademyAnnouncementDto,
  CreateAcademyApplicationDto,
  CreateAcademyTrainingDto,
  RespondTrainingAttendanceDto,
  ReviewAcademyApplicationDto,
  UpdateAcademyAnnouncementDto,
  UpdateAcademyTrainingDto,
} from './dto/academy.dto';

@Controller('academy')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('staff/search')
  @Permissions('academy.manage')
  searchOfficers(@Query('q') query = '') {
    return this.academyService.searchOfficers(query);
  }

  @Get('dashboard')
  getDashboard(@CurrentCharacter() character: IAuthCharacter) {
    return this.academyService.getDashboard(character.id, character.permissions ?? []);
  }

  @Get('trainings')
  listTrainings(@CurrentCharacter() character: IAuthCharacter) {
    return this.academyService.listTrainings(character.id, character.permissions ?? []);
  }

  @Get('trainings/:id')
  getTraining(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.academyService.getTraining(id, character.id, character.permissions ?? []);
  }

  @Post('trainings')
  @Permissions('academy.manage')
  createTraining(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAcademyTrainingDto,
  ) {
    return this.academyService.createTraining(
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Patch('trainings/:id')
  @Permissions('academy.manage')
  updateTraining(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademyTrainingDto,
  ) {
    return this.academyService.updateTraining(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post('trainings/:id/attendance')
  respondAttendance(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondTrainingAttendanceDto,
  ) {
    return this.academyService.respondAttendance(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Get('announcements')
  listAnnouncements(@CurrentCharacter() character: IAuthCharacter) {
    return this.academyService.listAnnouncements(character.permissions ?? []);
  }

  @Post('announcements')
  @Permissions('academy.manage')
  createAnnouncement(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAcademyAnnouncementDto,
  ) {
    return this.academyService.createAnnouncement(
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Patch('announcements/:id')
  @Permissions('academy.manage')
  updateAnnouncement(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademyAnnouncementDto,
  ) {
    return this.academyService.updateAnnouncement(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Delete('announcements/:id')
  @Permissions('academy.manage')
  deleteAnnouncement(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.academyService.deleteAnnouncement(
      id,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Get('applications/mine')
  @Permissions('academy.apply')
  listMyApplications(@CurrentCharacter() character: IAuthCharacter) {
    return this.academyService.listMyApplications(character.id);
  }

  @Get('applications')
  @Permissions('academy.applications')
  listApplications(
    @CurrentCharacter() character: IAuthCharacter,
    @Query('type') type?: AcademyApplicationType,
    @Query('status') status?: AcademyApplicationStatus,
  ) {
    return this.academyService.listApplications(character.permissions ?? [], {
      type,
      status,
    });
  }

  @Get('applications/:id')
  getApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.academyService.getApplication(
      id,
      character.id,
      character.permissions ?? [],
    );
  }

  @Post('applications')
  @Permissions('academy.apply')
  createApplication(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAcademyApplicationDto,
  ) {
    return this.academyService.createApplication(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch('applications/:id/review')
  @Permissions('academy.applications')
  reviewApplication(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewAcademyApplicationDto,
  ) {
    return this.academyService.reviewApplication(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }
}
