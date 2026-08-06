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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { documentUploadInterceptor } from '../../common/storage/document-upload.interceptor';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateRegulationCategoryDto,
  CreateRegulationDocumentDto,
  SearchRegulationsDto,
  UpdateRegulationCategoryDto,
  UpdateRegulationDocumentDto,
} from './dto/regulation.dto';
import { RegulationsService } from './regulations.service';

@Controller('regulations')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  @Get('dashboard')
  @Permissions('regulations.read')
  getDashboard(@CurrentCharacter() character: IAuthCharacter) {
    return this.regulationsService.getDashboard(character.permissions ?? []);
  }

  @Get('categories')
  @Permissions('regulations.read')
  listCategories(@Query('includeInactive') includeInactive?: string) {
    return this.regulationsService.listCategories(
      includeInactive === 'true' || includeInactive === '1',
    );
  }

  @Post('categories')
  @Permissions('regulations.create')
  createCategory(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateRegulationCategoryDto,
  ) {
    return this.regulationsService.createCategory(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch('categories/:id')
  @Permissions('regulations.update')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: UpdateRegulationCategoryDto,
  ) {
    return this.regulationsService.updateCategory(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Get('documents')
  @Permissions('regulations.read')
  listDocuments(
    @CurrentCharacter() character: IAuthCharacter,
    @Query() query: SearchRegulationsDto,
  ) {
    return this.regulationsService.listDocuments(query, character.permissions ?? []);
  }

  @Get('documents/:id')
  @Permissions('regulations.read')
  getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.regulationsService.getDocument(id, character.permissions ?? []);
  }

  @Post('documents')
  @Permissions('regulations.create')
  createDocument(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateRegulationDocumentDto,
  ) {
    return this.regulationsService.createDocument(
      dto,
      {
        accountId: account.id,
        characterId: character.id,
      },
      character.permissions ?? [],
    );
  }

  @Patch('documents/:id')
  @Permissions('regulations.update')
  updateDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: UpdateRegulationDocumentDto,
  ) {
    return this.regulationsService.updateDocument(
      id,
      dto,
      {
        accountId: account.id,
        characterId: character.id,
      },
      character.permissions ?? [],
    );
  }

  @Post('documents/:id/restore/:versionId')
  @Permissions('regulations.update')
  restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.regulationsService.restoreVersion(
      id,
      versionId,
      {
        accountId: account.id,
        characterId: character.id,
      },
      character.permissions ?? [],
    );
  }

  @Delete('documents/:id')
  @Permissions('regulations.delete')
  deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.regulationsService.deleteDocument(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('documents/:id/attachments')
  @Permissions('regulations.update')
  @UseInterceptors(documentUploadInterceptor('file'))
  addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.regulationsService.addAttachment(id, file, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Delete('documents/:id/attachments/:attachmentId')
  @Permissions('regulations.update')
  removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.regulationsService.removeAttachment(id, attachmentId, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
