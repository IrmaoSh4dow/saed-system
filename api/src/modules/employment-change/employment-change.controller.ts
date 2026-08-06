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
  AdminApplyEmploymentDto,
  CreateEmploymentChangeRequestDto,
  ReviewEmploymentChangeRequestDto,
  SearchEmploymentChangeRequestDto,
} from './dto/employment-change.dto';
import { EmploymentChangeService } from './employment-change.service';

@Controller('employment-change')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class EmploymentChangeController {
  constructor(private readonly employmentChangeService: EmploymentChangeService) {}

  @Get('mine')
  @Permissions('employment-change.read')
  listMine(@CurrentCharacter() character: IAuthCharacter) {
    return this.employmentChangeService.listMine(character.id);
  }

  @Get('dashboard')
  @Permissions('employment-change.read')
  getDashboard(@CurrentCharacter() character: IAuthCharacter) {
    return this.employmentChangeService.getDashboard(character.permissions ?? []);
  }

  @Get()
  @Permissions('employment-change.read')
  list(
    @CurrentCharacter() character: IAuthCharacter,
    @Query() query: SearchEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.list(query, character.permissions ?? []);
  }

  @Post()
  @Permissions('employment-change.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('characters/:characterId/apply')
  @Permissions('employment-change.manage')
  applyManual(
    @Param('characterId', ParseUUIDPipe) characterId: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: AdminApplyEmploymentDto,
  ) {
    return this.employmentChangeService.applyManual(
      characterId,
      dto.establishmentId,
      { accountId: account.id, characterId: character.id },
      dto.reason,
    );
  }

  @Post(':id/cancel')
  @Permissions('employment-change.create')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.employmentChangeService.cancel(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/under-review')
  @Permissions('employment-change.review')
  markUnderReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ReviewEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.markUnderReview(
      id,
      { accountId: account.id, characterId: character.id },
      dto,
    );
  }

  @Post(':id/approve')
  @Permissions('employment-change.review')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ReviewEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.approve(
      id,
      { accountId: account.id, characterId: character.id },
      dto,
    );
  }

  @Post(':id/reject')
  @Permissions('employment-change.review')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ReviewEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.reject(
      id,
      { accountId: account.id, characterId: character.id },
      dto,
    );
  }

  @Patch(':id/notes')
  @Permissions('employment-change.review')
  addNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ReviewEmploymentChangeRequestDto,
  ) {
    return this.employmentChangeService.addInternalNotes(
      id,
      { accountId: account.id, characterId: character.id },
      dto,
    );
  }

}
