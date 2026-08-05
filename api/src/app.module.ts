import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { StorageModule } from './common/storage/storage.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { DecorationsModule } from './modules/decorations/decorations.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { NewsModule } from './modules/news/news.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OccupationsModule } from './modules/occupations/occupations.module';
import { StaffModule } from './modules/staff/staff.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RanksModule } from './modules/ranks/ranks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { AcademyModule } from './modules/academy/academy.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    AppConfigModule,
    StorageModule,
    PrismaModule,
    AccountsModule,
    PermissionsModule,
    RolesModule,
    RanksModule,
    DepartmentsModule,
    StaffModule,
    OccupationsModule,
    DecorationsModule,
    LicensesModule,
    NewsModule,
    GalleryModule,
    ComplaintsModule,
    ReportsModule,
    AcademyModule,
    NotificationsModule,
    AuditModule,
    CharactersModule,
    AuthModule,
    RealtimeModule,
    HealthModule,
  ],
})
export class AppModule {}
