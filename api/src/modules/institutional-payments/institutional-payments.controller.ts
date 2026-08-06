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
import { InstitutionalPaymentStatus } from '@prisma/client';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateInstitutionalPaymentDto,
  UpdateInstitutionalPaymentDto,
  VoidInstitutionalPaymentDto,
} from './dto/institutional-payment.dto';
import { InstitutionalPaymentsService } from './institutional-payments.service';

@Controller('institutional-payments')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class InstitutionalPaymentsController {
  constructor(
    private readonly institutionalPaymentsService: InstitutionalPaymentsService,
  ) {}

  @Get('dashboard')
  @Permissions('institutional-payments.read')
  getDashboard() {
    return this.institutionalPaymentsService.getDashboard();
  }

  @Get('organizations')
  @Permissions('institutional-payments.read')
  listOrganizations() {
    return this.institutionalPaymentsService.listOrganizations();
  }

  @Get('organizations/:establishmentId')
  @Permissions('institutional-payments.read')
  getOrganization(
    @Param('establishmentId', ParseUUIDPipe) establishmentId: string,
  ) {
    return this.institutionalPaymentsService.getOrganizationDetail(establishmentId);
  }

  @Get()
  @Permissions('institutional-payments.read')
  list(
    @Query('establishmentId') establishmentId?: string,
    @Query('status') status?: InstitutionalPaymentStatus,
  ) {
    return this.institutionalPaymentsService.listPayments({
      establishmentId,
      status,
    });
  }

  @Get(':id')
  @Permissions('institutional-payments.read')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.institutionalPaymentsService.getPayment(id);
  }

  @Post()
  @Permissions('institutional-payments.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateInstitutionalPaymentDto,
  ) {
    return this.institutionalPaymentsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id')
  @Permissions('institutional-payments.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: UpdateInstitutionalPaymentDto,
  ) {
    return this.institutionalPaymentsService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/void')
  @Permissions('institutional-payments.delete')
  voidPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: VoidInstitutionalPaymentDto,
  ) {
    return this.institutionalPaymentsService.voidPayment(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
