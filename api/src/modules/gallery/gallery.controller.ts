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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { imageUploadInterceptor } from '../../common/storage/image-upload.interceptor';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateGalleryMetaDto,
  GalleryService,
  ReorderGalleryDto,
  UpdateGalleryItemDto,
} from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get('active')
  listActive() {
    return this.galleryService.listActive();
  }

  @Get()
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('gallery.manage')
  listAll() {
    return this.galleryService.listAll();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('gallery.manage')
  @UseInterceptors(imageUploadInterceptor('file'))
  upload(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGalleryMetaDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.galleryService.createFromUpload(file, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('gallery.manage')
  reorder(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: ReorderGalleryDto,
  ) {
    return this.galleryService.reorder(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('gallery.manage')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryItemDto,
  ) {
    return this.galleryService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('gallery.manage')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.galleryService.remove(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
