import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
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
import { ComplaintsService } from './complaints.service';
import {
  AssignInvestigatorDto,
  CreateComplaintDto,
  CreateComplaintEvidenceDto,
  CreateComplaintMessageDto,
  CreateComplaintNoteDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get('staff/search')
  @Permissions('complaints.create')
  searchOfficers(@Query('q') query = '') {
    return this.complaintsService.searchOfficers(query);
  }

  @Get('investigators/search')
  @Permissions('complaints.assign')
  searchInvestigators(@Query('q') query = '') {
    return this.complaintsService.searchInvestigators(query);
  }

  @Get('by-officer/:staffId')
  @Permissions('complaints.assign')
  listByOfficer(
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.complaintsService.listForAccusedOfficer(
      staffId,
      request.user?.permissions ?? [],
      character.id,
    );
  }

  @Get()
  @Permissions('complaints.read')
  list(
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.complaintsService.listForCharacter(
      character.id,
      request.user?.permissions ?? [],
    );
  }

  @Get(':id')
  @Permissions('complaints.read')
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.complaintsService.getById(
      id,
      character.id,
      request.user?.permissions ?? [],
    );
  }

  @Post()
  @Permissions('complaints.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id/status')
  @Permissions('complaints.assign')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: UpdateComplaintStatusDto,
  ) {
    return this.complaintsService.updateStatus(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/assignments')
  @Permissions('complaints.assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: AssignInvestigatorDto,
  ) {
    return this.complaintsService.assignInvestigator(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/messages')
  @Permissions('complaints.read')
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: CreateComplaintMessageDto,
  ) {
    return this.complaintsService.addMessage(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/notes')
  @Permissions('complaints.assign')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: CreateComplaintNoteDto,
  ) {
    return this.complaintsService.addInternalNote(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/evidence')
  @Permissions('complaints.read')
  addEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: CreateComplaintEvidenceDto,
  ) {
    return this.complaintsService.addEvidence(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }
}
