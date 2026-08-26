import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  GrantMedicalReportAccessDto,
  SearchMedicalReportAccessDto,
} from './dto/medical-report-access.dto';
import { MedicalReportAccessService } from './medical-report-access.service';

@Controller('medical-report-access')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class MedicalReportAccessController {
  constructor(private readonly medicalReportAccessService: MedicalReportAccessService) {}

  @Get('dashboard')
  @Permissions('medical-report-access.read')
  getDashboard(@CurrentCharacter() character: IAuthCharacter) {
    return this.medicalReportAccessService.getDashboard(character.permissions ?? []);
  }

  @Get('reasons')
  @Permissions('medical-report-access.grant')
  listReasons() {
    return this.medicalReportAccessService.listReasons();
  }

  @Get('recipients')
  @Permissions('medical-report-access.grant')
  listRecipients(@Query('partner') partner?: string) {
    return this.medicalReportAccessService.listRecipients(partner);
  }

  @Get('grants')
  @Permissions('medical-report-access.read')
  listGrants(
    @CurrentCharacter() character: IAuthCharacter,
    @Query() query: SearchMedicalReportAccessDto,
  ) {
    return this.medicalReportAccessService.list(query, {
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }

  @Get('reports/:reportId/grants')
  @Permissions('medical-report-access.read')
  listForReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalReportAccessService.listForReport(
      reportId,
      character.permissions ?? [],
    );
  }

  @Post('grants')
  @Permissions('medical-report-access.grant')
  grant(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: GrantMedicalReportAccessDto,
  ) {
    return this.medicalReportAccessService.grant(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('grants/:id/revoke')
  @Permissions('medical-report-access.revoke')
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalReportAccessService.revoke(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
