import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { StorageModule } from './common/storage/storage.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
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
import { PatientsModule } from './modules/patients/patients.module';
import { StaffModule } from './modules/staff/staff.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RanksModule } from './modules/ranks/ranks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { AcademyModule } from './modules/academy/academy.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { InstitutionalPaymentsModule } from './modules/institutional-payments/institutional-payments.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { AdminRequestsModule } from './modules/admin-requests/admin-requests.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { OccupationalHealthModule } from './modules/occupational-health/occupational-health.module';
import { StaffRatingsModule } from './modules/staff-ratings/staff-ratings.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    AppConfigModule,
    StorageModule,
    PrismaModule,
    WebhooksModule,
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
    AppointmentsModule,
    AdminRequestsModule,
    EstablishmentsModule,
    AgreementsModule,
    InstitutionalPaymentsModule,
    RegulationsModule,
    OccupationalHealthModule,
    StaffRatingsModule,
    PatientsModule,
    ReportsModule,
    AcademyModule,
    ShiftsModule,
    IncentivesModule,
    NotificationsModule,
    AuditModule,
    CharactersModule,
    AuthModule,
    RealtimeModule,
    HealthModule,
  ],
})
export class AppModule {}
