import {
  Body,
  Controller,
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
import { EstablishmentStatus } from '@prisma/client';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { imageUploadInterceptor } from '../../common/storage/image-upload.interceptor';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateEstablishmentDto,
  UpdateEstablishmentDto,
} from './dto/establishment.dto';
import { EstablishmentsService } from './establishments.service';

@Controller('establishments')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class EstablishmentsController {
  constructor(private readonly establishmentsService: EstablishmentsService) {}

  @Get()
  @Permissions('establishments.read')
  list(@Query('includeInactive') includeInactive?: string) {
    return this.establishmentsService.list({
      includeInactive: includeInactive === 'true' || includeInactive === '1',
    });
  }

  @Get(':id')
  @Permissions('establishments.read')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.establishmentsService.getById(id);
  }

  @Post()
  @Permissions('establishments.manage')
  create(
    @Body() dto: CreateEstablishmentDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.establishmentsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id')
  @Permissions('establishments.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstablishmentDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.establishmentsService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/activate')
  @Permissions('establishments.manage')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.establishmentsService.setStatus(id, EstablishmentStatus.ACTIVE, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/deactivate')
  @Permissions('establishments.manage')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.establishmentsService.setStatus(id, EstablishmentStatus.INACTIVE, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/logo')
  @Permissions('establishments.manage')
  @UseInterceptors(imageUploadInterceptor('file'))
  uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.establishmentsService.uploadLogo(id, file, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
