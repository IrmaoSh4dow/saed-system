import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import type { IAuthAccount, IAuthRequestUser } from '../auth/interfaces/i-auth-request.interface';
import { CreateOccupationDto } from './dto/create-occupation.dto';
import { UpdateOccupationDto } from './dto/update-occupation.dto';
import { OccupationsService } from './occupations.service';

@Controller()
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class OccupationsController {
  constructor(
    private readonly occupationsService: OccupationsService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('characters/:characterId/occupations')
  async list(
    @CurrentAccount() account: IAuthAccount,
    @Req() request: { user?: IAuthRequestUser },
    @Param('characterId', ParseUUIDPipe) characterId: string,
  ) {
    await this.assertCanView(account.id, characterId, request.user?.permissions ?? []);
    return this.occupationsService.listForCharacter(characterId);
  }

  @Post('characters/:characterId/occupations')
  async create(
    @CurrentAccount() account: IAuthAccount,
    @Req() request: { user?: IAuthRequestUser },
    @Param('characterId', ParseUUIDPipe) characterId: string,
    @Body() dto: CreateOccupationDto,
  ) {
    await this.assertCanManage(account.id, characterId, request.user?.permissions ?? []);
    return this.occupationsService.createForCharacter(characterId, dto);
  }

  @Patch('occupations/:id')
  async update(
    @CurrentAccount() account: IAuthAccount,
    @Req() request: { user?: IAuthRequestUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOccupationDto,
  ) {
    const occupation = await this.prismaService.occupation.findUnique({ where: { id } });
    if (!occupation) {
      throw new ForbiddenException('Occupation was not found');
    }
    await this.assertCanManage(account.id, occupation.characterId, request.user?.permissions ?? []);
    return this.occupationsService.update(id, dto);
  }

  @Delete('occupations/:id')
  async remove(
    @CurrentAccount() account: IAuthAccount,
    @Req() request: { user?: IAuthRequestUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const occupation = await this.prismaService.occupation.findUnique({ where: { id } });
    if (!occupation) {
      throw new ForbiddenException('Occupation was not found');
    }
    await this.assertCanManage(account.id, occupation.characterId, request.user?.permissions ?? []);
    return this.occupationsService.remove(id);
  }

  private async assertCanView(
    accountId: string,
    characterId: string,
    permissions: string[],
  ) {
    if (hasAnyPermission(permissions, ['occupations.read', 'occupations.manage', '*'])) {
      return;
    }

    const owned = await this.prismaService.character.findFirst({
      where: { id: characterId, accountId },
      select: { id: true },
    });

    if (!owned) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async assertCanManage(
    accountId: string,
    characterId: string,
    permissions: string[],
  ) {
    if (hasAnyPermission(permissions, ['occupations.manage', '*'])) {
      return;
    }

    if (hasAnyPermission(permissions, ['characters.update'])) {
      const owned = await this.prismaService.character.findFirst({
        where: { id: characterId, accountId },
        select: { id: true },
      });
      if (owned) {
        return;
      }
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
