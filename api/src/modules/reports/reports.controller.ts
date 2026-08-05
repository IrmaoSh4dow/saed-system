import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { MAX_IMAGE_UPLOAD_BYTES } from '../../common/storage/media-storage.service';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  AddReportParticipantDto,
  CreateReportDto,
  CreateReportEvidenceDto,
  TransferReportDto,
  UpdateReportDto,
  UploadReportEvidenceDto,
} from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('staff/search')
  @Permissions('reports.create')
  searchOfficers(@Query('q') query = '') {
    return this.reportsService.searchOfficers(query);
  }

  @Get()
  @Permissions('reports.read')
  list(
    @CurrentCharacter() character: IAuthCharacter,
    @Query('scope') scope?: 'all' | 'mine' | 'department',
  ) {
    return this.reportsService.list(
      character.id,
      character.permissions ?? [],
      scope ?? 'mine',
    );
  }

  @Get(':id')
  @Permissions('reports.read')
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.reportsService.getById(id, character.id, character.permissions ?? []);
  }

  @Post()
  @Permissions('reports.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id')
  @Permissions('reports.read')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.update(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post(':id/transfer')
  @Permissions('reports.transfer')
  transfer(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferReportDto,
  ) {
    return this.reportsService.transfer(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post(':id/participants')
  @Permissions('reports.read')
  addParticipant(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddReportParticipantDto,
  ) {
    return this.reportsService.addParticipant(
      id,
      dto.staffProfileId,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Delete(':id/participants/:staffProfileId')
  @Permissions('reports.read')
  removeParticipant(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffProfileId', ParseUUIDPipe) staffProfileId: string,
  ) {
    return this.reportsService.removeParticipant(
      id,
      staffProfileId,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post(':id/evidence')
  @Permissions('reports.read')
  addEvidence(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportEvidenceDto,
  ) {
    return this.reportsService.addEvidence(
      id,
      dto,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }

  @Post(':id/evidence/upload')
  @Permissions('reports.read')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES, files: 1 },
      fileFilter: (_req, file, callback) => {
        const allowed = new Set([
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ]);
        if (!allowed.has(file.mimetype)) {
          callback(
            new BadRequestException('Only JPEG, PNG, WebP and GIF images are allowed') as Error,
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadEvidence(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadReportEvidenceDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.reportsService.uploadEvidenceImage(
      id,
      file,
      dto.label,
      { accountId: account.id, characterId: character.id },
      character.permissions ?? [],
    );
  }
}
