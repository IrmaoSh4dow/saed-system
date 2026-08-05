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
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { CreateDepartmentDto } from './dto/create-department.dto';
import {
  AssignSupervisorDto,
  CreateInterestLetterDto,
  CreateOpeningDto,
  ReviewInterestLetterDto,
  UpdateOpeningDto,
} from './dto/department-recruitment.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('departments.read')
  findAll(@Query('scope') scope?: string) {
    if (scope === 'admin') {
      return this.departmentsService.findAllAdmin();
    }
    return this.departmentsService.findAll();
  }

  @Get('interest-letters/mine')
  @Permissions('departments.read')
  listMine(@CurrentCharacter() character: IAuthCharacter) {
    return this.departmentsService.listMyInterestLetters(character.id);
  }

  @Get(':id')
  @Permissions('departments.read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.departmentsService.findById(
      id,
      character.id,
      character.permissions ?? [],
    );
  }

  @Get(':id/interest-letters')
  @Permissions('departments.read')
  listLetters(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.departmentsService.listInterestLetters(
      id,
      character.id,
      character.permissions ?? [],
    );
  }

  @Post()
  @Permissions('departments.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id')
  @Permissions('departments.update')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Post(':id/supervisors')
  @Permissions('departments.update')
  addSupervisor(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSupervisorDto,
  ) {
    return this.departmentsService.addSupervisor(id, dto.staffProfileId, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete(':id/supervisors/:staffProfileId')
  @Permissions('departments.update')
  removeSupervisor(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffProfileId', ParseUUIDPipe) staffProfileId: string,
  ) {
    return this.departmentsService.removeSupervisor(id, staffProfileId, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Post(':id/openings')
  @Permissions('departments.read')
  createOpening(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOpeningDto,
  ) {
    return this.departmentsService.createOpening(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Patch('openings/:openingId')
  @Permissions('departments.read')
  updateOpening(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('openingId', ParseUUIDPipe) openingId: string,
    @Body() dto: UpdateOpeningDto,
  ) {
    return this.departmentsService.updateOpening(
      openingId,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post('openings/:openingId/interest-letters')
  @Permissions('departments.read')
  createLetter(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('openingId', ParseUUIDPipe) openingId: string,
    @Body() dto: CreateInterestLetterDto,
  ) {
    return this.departmentsService.createInterestLetter(openingId, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('interest-letters/:letterId/accept')
  @Permissions('departments.read')
  acceptLetter(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('letterId', ParseUUIDPipe) letterId: string,
    @Body() dto: ReviewInterestLetterDto,
  ) {
    return this.departmentsService.acceptInterestLetter(
      letterId,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post('interest-letters/:letterId/reject')
  @Permissions('departments.read')
  rejectLetter(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('letterId', ParseUUIDPipe) letterId: string,
    @Body() dto: ReviewInterestLetterDto,
  ) {
    return this.departmentsService.rejectInterestLetter(
      letterId,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }
}
