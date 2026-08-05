--
-- PostgreSQL database dump
--

\restrict INbrKBppppXJSfShCALTxHFaWGypAb7YFIyXxqO5dV46PNEr5PRe2B56RPCsISt

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Report" DROP CONSTRAINT IF EXISTS "Report_leadOfficerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Report" DROP CONSTRAINT IF EXISTS "Report_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Report" DROP CONSTRAINT IF EXISTS "Report_createdByCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportTransfer" DROP CONSTRAINT IF EXISTS "ReportTransfer_transferredByCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportTransfer" DROP CONSTRAINT IF EXISTS "ReportTransfer_toDivisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportTransfer" DROP CONSTRAINT IF EXISTS "ReportTransfer_reportId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportTransfer" DROP CONSTRAINT IF EXISTS "ReportTransfer_fromDivisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportParticipant" DROP CONSTRAINT IF EXISTS "ReportParticipant_reportId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportParticipant" DROP CONSTRAINT IF EXISTS "ReportParticipant_officerProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportEvidence" DROP CONSTRAINT IF EXISTS "ReportEvidence_uploadedByCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."ReportEvidence" DROP CONSTRAINT IF EXISTS "ReportEvidence_reportId_fkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."OfficerProfile" DROP CONSTRAINT IF EXISTS "OfficerProfile_rankId_fkey";
ALTER TABLE IF EXISTS ONLY public."OfficerProfile" DROP CONSTRAINT IF EXISTS "OfficerProfile_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."OfficerProfile" DROP CONSTRAINT IF EXISTS "OfficerProfile_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."OfficerDecoration" DROP CONSTRAINT IF EXISTS "OfficerDecoration_officerProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public."OfficerDecoration" DROP CONSTRAINT IF EXISTS "OfficerDecoration_decorationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Occupation" DROP CONSTRAINT IF EXISTS "Occupation_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."NewsArticle" DROP CONSTRAINT IF EXISTS "NewsArticle_authorCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."InterestLetter" DROP CONSTRAINT IF EXISTS "InterestLetter_openingId_fkey";
ALTER TABLE IF EXISTS ONLY public."InterestLetter" DROP CONSTRAINT IF EXISTS "InterestLetter_officerProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public."InterestLetter" DROP CONSTRAINT IF EXISTS "InterestLetter_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."DivisionSupervisor" DROP CONSTRAINT IF EXISTS "DivisionSupervisor_officerProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public."DivisionSupervisor" DROP CONSTRAINT IF EXISTS "DivisionSupervisor_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."DivisionOpening" DROP CONSTRAINT IF EXISTS "DivisionOpening_minRankId_fkey";
ALTER TABLE IF EXISTS ONLY public."DivisionOpening" DROP CONSTRAINT IF EXISTS "DivisionOpening_divisionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Complaint" DROP CONSTRAINT IF EXISTS "Complaint_complainantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Complaint" DROP CONSTRAINT IF EXISTS "Complaint_accusedOfficerId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintMessage" DROP CONSTRAINT IF EXISTS "ComplaintMessage_complaintId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintMessage" DROP CONSTRAINT IF EXISTS "ComplaintMessage_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintInternalNote" DROP CONSTRAINT IF EXISTS "ComplaintInternalNote_complaintId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintInternalNote" DROP CONSTRAINT IF EXISTS "ComplaintInternalNote_authorId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintEvidence" DROP CONSTRAINT IF EXISTS "ComplaintEvidence_complaintId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintEvent" DROP CONSTRAINT IF EXISTS "ComplaintEvent_complaintId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintEvent" DROP CONSTRAINT IF EXISTS "ComplaintEvent_actorId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintAssignment" DROP CONSTRAINT IF EXISTS "ComplaintAssignment_complaintId_fkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintAssignment" DROP CONSTRAINT IF EXISTS "ComplaintAssignment_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."Character" DROP CONSTRAINT IF EXISTS "Character_rankId_fkey";
ALTER TABLE IF EXISTS ONLY public."Character" DROP CONSTRAINT IF EXISTS "Character_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."CharacterRole" DROP CONSTRAINT IF EXISTS "CharacterRole_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."CharacterRole" DROP CONSTRAINT IF EXISTS "CharacterRole_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuthIdentity" DROP CONSTRAINT IF EXISTS "AuthIdentity_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorAccountId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_activeCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTraining" DROP CONSTRAINT IF EXISTS "AcademyTraining_instructorCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTraining" DROP CONSTRAINT IF EXISTS "AcademyTraining_createdByCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingSupportOfficer" DROP CONSTRAINT IF EXISTS "AcademyTrainingSupportOfficer_trainingId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingSupportOfficer" DROP CONSTRAINT IF EXISTS "AcademyTrainingSupportOfficer_officerProfileId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingAttendance" DROP CONSTRAINT IF EXISTS "AcademyTrainingAttendance_trainingId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingAttendance" DROP CONSTRAINT IF EXISTS "AcademyTrainingAttendance_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyApplication" DROP CONSTRAINT IF EXISTS "AcademyApplication_reviewedByCharacterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyApplication" DROP CONSTRAINT IF EXISTS "AcademyApplication_characterId_fkey";
ALTER TABLE IF EXISTS ONLY public."AcademyAnnouncement" DROP CONSTRAINT IF EXISTS "AcademyAnnouncement_authorCharacterId_fkey";
DROP INDEX IF EXISTS public."Role_slug_key";
DROP INDEX IF EXISTS public."Role_name_key";
DROP INDEX IF EXISTS public."Report_status_idx";
DROP INDEX IF EXISTS public."Report_reportNumber_key";
DROP INDEX IF EXISTS public."Report_priority_idx";
DROP INDEX IF EXISTS public."Report_leadOfficerId_idx";
DROP INDEX IF EXISTS public."Report_divisionId_idx";
DROP INDEX IF EXISTS public."Report_createdByCharacterId_idx";
DROP INDEX IF EXISTS public."Report_createdAt_idx";
DROP INDEX IF EXISTS public."ReportTransfer_toDivisionId_idx";
DROP INDEX IF EXISTS public."ReportTransfer_reportId_createdAt_idx";
DROP INDEX IF EXISTS public."ReportTransfer_fromDivisionId_idx";
DROP INDEX IF EXISTS public."ReportParticipant_reportId_officerProfileId_key";
DROP INDEX IF EXISTS public."ReportParticipant_officerProfileId_idx";
DROP INDEX IF EXISTS public."ReportEvidence_uploadedByCharacterId_idx";
DROP INDEX IF EXISTS public."ReportEvidence_reportId_idx";
DROP INDEX IF EXISTS public."RefreshToken_tokenHash_key";
DROP INDEX IF EXISTS public."RefreshToken_expiresAt_idx";
DROP INDEX IF EXISTS public."RefreshToken_accountId_idx";
DROP INDEX IF EXISTS public."Rank_slug_key";
DROP INDEX IF EXISTS public."Rank_name_key";
DROP INDEX IF EXISTS public."Permission_key_key";
DROP INDEX IF EXISTS public."OfficerProfile_status_idx";
DROP INDEX IF EXISTS public."OfficerProfile_rankId_idx";
DROP INDEX IF EXISTS public."OfficerProfile_divisionId_idx";
DROP INDEX IF EXISTS public."OfficerProfile_characterId_key";
DROP INDEX IF EXISTS public."OfficerProfile_badgeNumber_key";
DROP INDEX IF EXISTS public."OfficerDecoration_officerProfileId_decorationId_key";
DROP INDEX IF EXISTS public."OfficerDecoration_decorationId_idx";
DROP INDEX IF EXISTS public."Occupation_organization_idx";
DROP INDEX IF EXISTS public."Occupation_isActive_idx";
DROP INDEX IF EXISTS public."Occupation_characterId_idx";
DROP INDEX IF EXISTS public."Notification_characterId_idx";
DROP INDEX IF EXISTS public."Notification_accountId_isRead_createdAt_idx";
DROP INDEX IF EXISTS public."NewsArticle_status_publishedAt_idx";
DROP INDEX IF EXISTS public."NewsArticle_authorCharacterId_idx";
DROP INDEX IF EXISTS public."InterestLetter_openingId_officerProfileId_key";
DROP INDEX IF EXISTS public."InterestLetter_officerProfileId_idx";
DROP INDEX IF EXISTS public."InterestLetter_divisionId_status_idx";
DROP INDEX IF EXISTS public."GalleryItem_status_sortOrder_idx";
DROP INDEX IF EXISTS public."Division_slug_key";
DROP INDEX IF EXISTS public."Division_name_key";
DROP INDEX IF EXISTS public."DivisionSupervisor_officerProfileId_idx";
DROP INDEX IF EXISTS public."DivisionSupervisor_divisionId_officerProfileId_key";
DROP INDEX IF EXISTS public."DivisionOpening_minRankId_idx";
DROP INDEX IF EXISTS public."DivisionOpening_divisionId_status_idx";
DROP INDEX IF EXISTS public."Decoration_name_key";
DROP INDEX IF EXISTS public."Complaint_status_idx";
DROP INDEX IF EXISTS public."Complaint_createdAt_idx";
DROP INDEX IF EXISTS public."Complaint_complainantId_idx";
DROP INDEX IF EXISTS public."Complaint_caseNumber_key";
DROP INDEX IF EXISTS public."Complaint_accusedOfficerId_idx";
DROP INDEX IF EXISTS public."ComplaintMessage_complaintId_createdAt_idx";
DROP INDEX IF EXISTS public."ComplaintMessage_authorId_idx";
DROP INDEX IF EXISTS public."ComplaintInternalNote_complaintId_createdAt_idx";
DROP INDEX IF EXISTS public."ComplaintInternalNote_authorId_idx";
DROP INDEX IF EXISTS public."ComplaintEvidence_complaintId_idx";
DROP INDEX IF EXISTS public."ComplaintEvent_complaintId_createdAt_idx";
DROP INDEX IF EXISTS public."ComplaintAssignment_complaintId_characterId_key";
DROP INDEX IF EXISTS public."ComplaintAssignment_characterId_idx";
DROP INDEX IF EXISTS public."Character_status_idx";
DROP INDEX IF EXISTS public."Character_rankId_idx";
DROP INDEX IF EXISTS public."Character_fivemCitizenId_key";
DROP INDEX IF EXISTS public."Character_accountId_idx";
DROP INDEX IF EXISTS public."AuthIdentity_provider_providerAccountId_key";
DROP INDEX IF EXISTS public."AuthIdentity_accountId_idx";
DROP INDEX IF EXISTS public."AuditLog_targetType_targetId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AuditLog_actorCharacterId_idx";
DROP INDEX IF EXISTS public."AuditLog_actorAccountId_idx";
DROP INDEX IF EXISTS public."AuditLog_action_idx";
DROP INDEX IF EXISTS public."Account_username_key";
DROP INDEX IF EXISTS public."Account_email_key";
DROP INDEX IF EXISTS public."Account_activeCharacterId_key";
DROP INDEX IF EXISTS public."AcademyTraining_status_idx";
DROP INDEX IF EXISTS public."AcademyTraining_startsAt_idx";
DROP INDEX IF EXISTS public."AcademyTraining_instructorCharacterId_idx";
DROP INDEX IF EXISTS public."AcademyTrainingSupportOfficer_trainingId_officerProfileId_key";
DROP INDEX IF EXISTS public."AcademyTrainingSupportOfficer_officerProfileId_idx";
DROP INDEX IF EXISTS public."AcademyTrainingAttendance_trainingId_characterId_key";
DROP INDEX IF EXISTS public."AcademyTrainingAttendance_status_idx";
DROP INDEX IF EXISTS public."AcademyTrainingAttendance_characterId_idx";
DROP INDEX IF EXISTS public."AcademyApplication_type_status_idx";
DROP INDEX IF EXISTS public."AcademyApplication_status_createdAt_idx";
DROP INDEX IF EXISTS public."AcademyApplication_characterId_createdAt_idx";
DROP INDEX IF EXISTS public."AcademyAnnouncement_publishedAt_idx";
DROP INDEX IF EXISTS public."AcademyAnnouncement_priority_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Role" DROP CONSTRAINT IF EXISTS "Role_pkey";
ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_pkey";
ALTER TABLE IF EXISTS ONLY public."Report" DROP CONSTRAINT IF EXISTS "Report_pkey";
ALTER TABLE IF EXISTS ONLY public."ReportTransfer" DROP CONSTRAINT IF EXISTS "ReportTransfer_pkey";
ALTER TABLE IF EXISTS ONLY public."ReportParticipant" DROP CONSTRAINT IF EXISTS "ReportParticipant_pkey";
ALTER TABLE IF EXISTS ONLY public."ReportEvidence" DROP CONSTRAINT IF EXISTS "ReportEvidence_pkey";
ALTER TABLE IF EXISTS ONLY public."RefreshToken" DROP CONSTRAINT IF EXISTS "RefreshToken_pkey";
ALTER TABLE IF EXISTS ONLY public."Rank" DROP CONSTRAINT IF EXISTS "Rank_pkey";
ALTER TABLE IF EXISTS ONLY public."Permission" DROP CONSTRAINT IF EXISTS "Permission_pkey";
ALTER TABLE IF EXISTS ONLY public."OfficerProfile" DROP CONSTRAINT IF EXISTS "OfficerProfile_pkey";
ALTER TABLE IF EXISTS ONLY public."OfficerDecoration" DROP CONSTRAINT IF EXISTS "OfficerDecoration_pkey";
ALTER TABLE IF EXISTS ONLY public."Occupation" DROP CONSTRAINT IF EXISTS "Occupation_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."NewsArticle" DROP CONSTRAINT IF EXISTS "NewsArticle_pkey";
ALTER TABLE IF EXISTS ONLY public."InterestLetter" DROP CONSTRAINT IF EXISTS "InterestLetter_pkey";
ALTER TABLE IF EXISTS ONLY public."GalleryItem" DROP CONSTRAINT IF EXISTS "GalleryItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Division" DROP CONSTRAINT IF EXISTS "Division_pkey";
ALTER TABLE IF EXISTS ONLY public."DivisionSupervisor" DROP CONSTRAINT IF EXISTS "DivisionSupervisor_pkey";
ALTER TABLE IF EXISTS ONLY public."DivisionOpening" DROP CONSTRAINT IF EXISTS "DivisionOpening_pkey";
ALTER TABLE IF EXISTS ONLY public."Decoration" DROP CONSTRAINT IF EXISTS "Decoration_pkey";
ALTER TABLE IF EXISTS ONLY public."Complaint" DROP CONSTRAINT IF EXISTS "Complaint_pkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintMessage" DROP CONSTRAINT IF EXISTS "ComplaintMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintInternalNote" DROP CONSTRAINT IF EXISTS "ComplaintInternalNote_pkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintEvidence" DROP CONSTRAINT IF EXISTS "ComplaintEvidence_pkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintEvent" DROP CONSTRAINT IF EXISTS "ComplaintEvent_pkey";
ALTER TABLE IF EXISTS ONLY public."ComplaintAssignment" DROP CONSTRAINT IF EXISTS "ComplaintAssignment_pkey";
ALTER TABLE IF EXISTS ONLY public."Character" DROP CONSTRAINT IF EXISTS "Character_pkey";
ALTER TABLE IF EXISTS ONLY public."CharacterRole" DROP CONSTRAINT IF EXISTS "CharacterRole_pkey";
ALTER TABLE IF EXISTS ONLY public."AuthIdentity" DROP CONSTRAINT IF EXISTS "AuthIdentity_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_pkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTraining" DROP CONSTRAINT IF EXISTS "AcademyTraining_pkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingSupportOfficer" DROP CONSTRAINT IF EXISTS "AcademyTrainingSupportOfficer_pkey";
ALTER TABLE IF EXISTS ONLY public."AcademyTrainingAttendance" DROP CONSTRAINT IF EXISTS "AcademyTrainingAttendance_pkey";
ALTER TABLE IF EXISTS ONLY public."AcademyApplication" DROP CONSTRAINT IF EXISTS "AcademyApplication_pkey";
ALTER TABLE IF EXISTS ONLY public."AcademyAnnouncement" DROP CONSTRAINT IF EXISTS "AcademyAnnouncement_pkey";
ALTER TABLE IF EXISTS public."Report" ALTER COLUMN "reportNumber" DROP DEFAULT;
ALTER TABLE IF EXISTS public."Complaint" ALTER COLUMN "caseNumber" DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."RolePermission";
DROP TABLE IF EXISTS public."Role";
DROP SEQUENCE IF EXISTS public."Report_reportNumber_seq";
DROP TABLE IF EXISTS public."ReportTransfer";
DROP TABLE IF EXISTS public."ReportParticipant";
DROP TABLE IF EXISTS public."ReportEvidence";
DROP TABLE IF EXISTS public."Report";
DROP TABLE IF EXISTS public."RefreshToken";
DROP TABLE IF EXISTS public."Rank";
DROP TABLE IF EXISTS public."Permission";
DROP TABLE IF EXISTS public."OfficerProfile";
DROP TABLE IF EXISTS public."OfficerDecoration";
DROP TABLE IF EXISTS public."Occupation";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."NewsArticle";
DROP TABLE IF EXISTS public."InterestLetter";
DROP TABLE IF EXISTS public."GalleryItem";
DROP TABLE IF EXISTS public."DivisionSupervisor";
DROP TABLE IF EXISTS public."DivisionOpening";
DROP TABLE IF EXISTS public."Division";
DROP TABLE IF EXISTS public."Decoration";
DROP SEQUENCE IF EXISTS public."Complaint_caseNumber_seq";
DROP TABLE IF EXISTS public."ComplaintMessage";
DROP TABLE IF EXISTS public."ComplaintInternalNote";
DROP TABLE IF EXISTS public."ComplaintEvidence";
DROP TABLE IF EXISTS public."ComplaintEvent";
DROP TABLE IF EXISTS public."ComplaintAssignment";
DROP TABLE IF EXISTS public."Complaint";
DROP TABLE IF EXISTS public."CharacterRole";
DROP TABLE IF EXISTS public."Character";
DROP TABLE IF EXISTS public."AuthIdentity";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."Account";
DROP TABLE IF EXISTS public."AcademyTrainingSupportOfficer";
DROP TABLE IF EXISTS public."AcademyTrainingAttendance";
DROP TABLE IF EXISTS public."AcademyTraining";
DROP TABLE IF EXISTS public."AcademyApplication";
DROP TABLE IF EXISTS public."AcademyAnnouncement";
DROP TYPE IF EXISTS public."ReportType";
DROP TYPE IF EXISTS public."ReportStatus";
DROP TYPE IF EXISTS public."ReportPriority";
DROP TYPE IF EXISTS public."ReportEvidenceType";
DROP TYPE IF EXISTS public."OfficerStatus";
DROP TYPE IF EXISTS public."OccupationType";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."NewsStatus";
DROP TYPE IF EXISTS public."InterestLetterStatus";
DROP TYPE IF EXISTS public."GalleryItemStatus";
DROP TYPE IF EXISTS public."DivisionOpeningStatus";
DROP TYPE IF EXISTS public."ComplaintStatus";
DROP TYPE IF EXISTS public."ComplaintEvidenceType";
DROP TYPE IF EXISTS public."ComplaintEventType";
DROP TYPE IF EXISTS public."CharacterStatus";
DROP TYPE IF EXISTS public."CharacterSex";
DROP TYPE IF EXISTS public."AuthProvider";
DROP TYPE IF EXISTS public."AccountStatus";
DROP TYPE IF EXISTS public."AcademyTrainingStatus";
DROP TYPE IF EXISTS public."AcademyAttendanceStatus";
DROP TYPE IF EXISTS public."AcademyApplicationType";
DROP TYPE IF EXISTS public."AcademyApplicationStatus";
DROP TYPE IF EXISTS public."AcademyAnnouncementPriority";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AcademyAnnouncementPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademyAnnouncementPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


--
-- Name: AcademyApplicationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademyApplicationStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
);


--
-- Name: AcademyApplicationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademyApplicationType" AS ENUM (
    'ACADEMY',
    'TRANSFER'
);


--
-- Name: AcademyAttendanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademyAttendanceStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'DECLINED'
);


--
-- Name: AcademyTrainingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademyTrainingStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'ACTIVE',
    'DISABLED',
    'BANNED'
);


--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'LOCAL',
    'DISCORD'
);


--
-- Name: CharacterSex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CharacterSex" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


--
-- Name: CharacterStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CharacterStatus" AS ENUM (
    'CIVIL',
    'OFFICER',
    'RETIRED',
    'SUSPENDED',
    'CADET'
);


--
-- Name: ComplaintEventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComplaintEventType" AS ENUM (
    'CREATED',
    'STATUS_CHANGED',
    'INVESTIGATOR_ASSIGNED',
    'INVESTIGATOR_REMOVED',
    'MESSAGE_SENT',
    'INTERNAL_NOTE_ADDED',
    'EVIDENCE_ADDED',
    'EVIDENCE_REMOVED'
);


--
-- Name: ComplaintEvidenceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComplaintEvidenceType" AS ENUM (
    'IMAGE',
    'VIDEO_URL'
);


--
-- Name: ComplaintStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComplaintStatus" AS ENUM (
    'PENDING',
    'UNDER_INVESTIGATION',
    'WAITING_FOR_CITIZEN',
    'RESOLVED',
    'REJECTED',
    'CLOSED'
);


--
-- Name: DivisionOpeningStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DivisionOpeningStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'COMPLETED'
);


--
-- Name: GalleryItemStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GalleryItemStatus" AS ENUM (
    'ACTIVE',
    'HIDDEN'
);


--
-- Name: InterestLetterStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InterestLetterStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'NEEDS_INFO'
);


--
-- Name: NewsStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NewsStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'HIDDEN'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'COMPLAINT_CREATED',
    'COMPLAINT_MESSAGE',
    'COMPLAINT_STATUS',
    'COMPLAINT_ASSIGNED',
    'SYSTEM',
    'DIVISION_OPENING',
    'DIVISION_INTEREST_LETTER',
    'DIVISION_APPLICATION_ACCEPTED',
    'DIVISION_APPLICATION_REJECTED',
    'DIVISION_ASSIGNED',
    'REPORT_CREATED',
    'REPORT_ASSIGNED',
    'REPORT_STATUS',
    'REPORT_TRANSFERRED',
    'REPORT_EVIDENCE',
    'REPORT_PARTICIPANT',
    'ACADEMY_APPLICATION_SUBMITTED',
    'ACADEMY_APPLICATION_ACCEPTED',
    'ACADEMY_APPLICATION_REJECTED',
    'ACADEMY_TRAINING_CREATED',
    'ACADEMY_ANNOUNCEMENT',
    'ACADEMY_ATTENDANCE'
);


--
-- Name: OccupationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OccupationType" AS ENUM (
    'DEPARTMENT',
    'BUSINESS',
    'EMPLOYMENT',
    'OTHER'
);


--
-- Name: OfficerStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OfficerStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'RETIRED'
);


--
-- Name: ReportEvidenceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportEvidenceType" AS ENUM (
    'IMAGE',
    'VIDEO_URL',
    'DOCUMENT'
);


--
-- Name: ReportPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'COMPLETED',
    'ARCHIVED'
);


--
-- Name: ReportType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportType" AS ENUM (
    'INCIDENT',
    'INVESTIGATION',
    'INTERNAL',
    'ACTIVITY',
    'OTHER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcademyAnnouncement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademyAnnouncement" (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "authorCharacterId" text NOT NULL,
    priority public."AcademyAnnouncementPriority" DEFAULT 'NORMAL'::public."AcademyAnnouncementPriority" NOT NULL,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AcademyApplication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademyApplication" (
    id text NOT NULL,
    type public."AcademyApplicationType" NOT NULL,
    status public."AcademyApplicationStatus" DEFAULT 'PENDING'::public."AcademyApplicationStatus" NOT NULL,
    "characterId" text NOT NULL,
    "formData" jsonb NOT NULL,
    "internalNotes" text,
    "reviewNotes" text,
    "reviewedByCharacterId" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AcademyTraining; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademyTraining" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "instructorCharacterId" text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    location text NOT NULL,
    capacity integer,
    status public."AcademyTrainingStatus" DEFAULT 'SCHEDULED'::public."AcademyTrainingStatus" NOT NULL,
    "createdByCharacterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AcademyTrainingAttendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademyTrainingAttendance" (
    id text NOT NULL,
    "trainingId" text NOT NULL,
    "characterId" text NOT NULL,
    status public."AcademyAttendanceStatus" DEFAULT 'PENDING'::public."AcademyAttendanceStatus" NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AcademyTrainingSupportOfficer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademyTrainingSupportOfficer" (
    id text NOT NULL,
    "trainingId" text NOT NULL,
    "officerProfileId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    email text,
    username text,
    "displayName" text,
    status public."AccountStatus" DEFAULT 'ACTIVE'::public."AccountStatus" NOT NULL,
    "activeCharacterId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorAccountId" text,
    "actorCharacterId" text,
    action text NOT NULL,
    "targetType" text,
    "targetId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AuthIdentity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuthIdentity" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    provider public."AuthProvider" NOT NULL,
    "providerAccountId" text NOT NULL,
    "passwordHash" text,
    profile jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Character; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Character" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    status public."CharacterStatus" DEFAULT 'CIVIL'::public."CharacterStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "birthDate" date,
    sex public."CharacterSex",
    nationality text,
    "avatarUrl" text,
    "rankId" text,
    "fivemCitizenId" text,
    "joinedAt" date,
    phone text,
    biography text
);


--
-- Name: CharacterRole; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CharacterRole" (
    "characterId" text NOT NULL,
    "roleId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Complaint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Complaint" (
    id text NOT NULL,
    "caseNumber" integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "incidentDate" date,
    location text,
    status public."ComplaintStatus" DEFAULT 'PENDING'::public."ComplaintStatus" NOT NULL,
    "complainantId" text NOT NULL,
    "accusedOfficerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ComplaintAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplaintAssignment" (
    id text NOT NULL,
    "complaintId" text NOT NULL,
    "characterId" text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "unassignedAt" timestamp(3) without time zone
);


--
-- Name: ComplaintEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplaintEvent" (
    id text NOT NULL,
    "complaintId" text NOT NULL,
    "actorId" text,
    type public."ComplaintEventType" NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ComplaintEvidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplaintEvidence" (
    id text NOT NULL,
    "complaintId" text NOT NULL,
    type public."ComplaintEvidenceType" NOT NULL,
    label text,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ComplaintInternalNote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplaintInternalNote" (
    id text NOT NULL,
    "complaintId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ComplaintMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplaintMessage" (
    id text NOT NULL,
    "complaintId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Complaint_caseNumber_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Complaint_caseNumber_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Complaint_caseNumber_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Complaint_caseNumber_seq" OWNED BY public."Complaint"."caseNumber";


--
-- Name: Decoration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Decoration" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "imageUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Division; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Division" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "imageUrl" text
);


--
-- Name: DivisionOpening; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DivisionOpening" (
    id text NOT NULL,
    "divisionId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "minRankId" text,
    status public."DivisionOpeningStatus" DEFAULT 'OPEN'::public."DivisionOpeningStatus" NOT NULL,
    "createdByCharacterId" text,
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DivisionSupervisor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DivisionSupervisor" (
    id text NOT NULL,
    "divisionId" text NOT NULL,
    "officerProfileId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: GalleryItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GalleryItem" (
    id text NOT NULL,
    "imageUrl" text NOT NULL,
    title text,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    status public."GalleryItemStatus" DEFAULT 'ACTIVE'::public."GalleryItemStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InterestLetter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InterestLetter" (
    id text NOT NULL,
    "openingId" text NOT NULL,
    "divisionId" text NOT NULL,
    "officerProfileId" text NOT NULL,
    motivation text NOT NULL,
    experience text NOT NULL,
    "additionalInfo" text,
    status public."InterestLetterStatus" DEFAULT 'PENDING'::public."InterestLetterStatus" NOT NULL,
    "reviewNotes" text,
    "reviewedByCharacterId" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: NewsArticle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NewsArticle" (
    id text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    content text NOT NULL,
    "coverImageUrl" text,
    "authorName" text NOT NULL,
    "authorCharacterId" text,
    status public."NewsStatus" DEFAULT 'DRAFT'::public."NewsStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "characterId" text,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    href text,
    metadata jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Occupation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Occupation" (
    id text NOT NULL,
    "characterId" text NOT NULL,
    type public."OccupationType" DEFAULT 'EMPLOYMENT'::public."OccupationType" NOT NULL,
    organization text NOT NULL,
    "position" text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startedAt" date,
    "endedAt" date,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OfficerDecoration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OfficerDecoration" (
    id text NOT NULL,
    "officerProfileId" text NOT NULL,
    "decorationId" text NOT NULL,
    "awardedAt" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OfficerProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OfficerProfile" (
    id text NOT NULL,
    "characterId" text NOT NULL,
    "badgeNumber" text NOT NULL,
    "rankId" text NOT NULL,
    "divisionId" text,
    status public."OfficerStatus" DEFAULT 'ACTIVE'::public."OfficerStatus" NOT NULL,
    callsign text,
    "joinedAt" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    key text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Rank; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Rank" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "replacedById" text,
    "userAgent" text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reportNumber" integer NOT NULL,
    title text NOT NULL,
    type public."ReportType" DEFAULT 'INCIDENT'::public."ReportType" NOT NULL,
    description text NOT NULL,
    "incidentDate" date,
    location text,
    status public."ReportStatus" DEFAULT 'PENDING'::public."ReportStatus" NOT NULL,
    priority public."ReportPriority" DEFAULT 'MEDIUM'::public."ReportPriority" NOT NULL,
    "divisionId" text,
    "leadOfficerId" text,
    "createdByCharacterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReportEvidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportEvidence" (
    id text NOT NULL,
    "reportId" text NOT NULL,
    type public."ReportEvidenceType" NOT NULL,
    value text NOT NULL,
    label text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "originalName" text,
    "uploadedByCharacterId" text
);


--
-- Name: ReportParticipant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportParticipant" (
    id text NOT NULL,
    "reportId" text NOT NULL,
    "officerProfileId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ReportTransfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportTransfer" (
    id text NOT NULL,
    "reportId" text NOT NULL,
    "fromDivisionId" text,
    "toDivisionId" text NOT NULL,
    "transferredByCharacterId" text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Report_reportNumber_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Report_reportNumber_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Report_reportNumber_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Report_reportNumber_seq" OWNED BY public."Report"."reportNumber";


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Complaint caseNumber; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint" ALTER COLUMN "caseNumber" SET DEFAULT nextval('public."Complaint_caseNumber_seq"'::regclass);


--
-- Name: Report reportNumber; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report" ALTER COLUMN "reportNumber" SET DEFAULT nextval('public."Report_reportNumber_seq"'::regclass);


--
-- Data for Name: AcademyAnnouncement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademyAnnouncement" (id, title, content, "authorCharacterId", priority, "publishedAt", "createdAt", "updatedAt") FROM stdin;
b3c78004-0f1f-466f-a041-56d7bc4203a8	ASCENSOS EL VIERNES	ASCENSOS PARA EL DIA VIERNES POR SU INCREIBLE DESEMPEÑO DE GENERACION Z	7a7ae5fe-05bf-4bba-9471-08234d4a0188	NORMAL	2026-08-05 04:49:01.522	2026-08-05 04:49:01.522	2026-08-05 04:49:01.522
\.


--
-- Data for Name: AcademyApplication; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademyApplication" (id, type, status, "characterId", "formData", "internalNotes", "reviewNotes", "reviewedByCharacterId", "reviewedAt", "createdAt", "updatedAt") FROM stdin;
acdf67b6-407c-443b-a03f-e8152395867e	ACADEMY	ACCEPTED	37c5198e-24b2-47ab-9f0a-9d4c17093b41	{"email": "rapempireofficial@gmail.com", "phone": "20987465", "fullName": "Test Test", "birthDate": "2000-09-30", "whyAccept": "NINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNO", "motivation": "NINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNO", "workHistory": "NINGUNO", "availability": "NINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNO", "educationLevel": "Anular", "additionalNotes": "NINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNO", "currentOccupation": "Camarero", "securityExperience": "NINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNONINGUNO"}	\N	\N	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 04:35:30.399	2026-08-05 04:22:38.43	2026-08-05 04:35:30.4
\.


--
-- Data for Name: AcademyTraining; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademyTraining" (id, title, description, "instructorCharacterId", "startsAt", location, capacity, status, "createdByCharacterId", "createdAt", "updatedAt") FROM stdin;
12eb7b95-219b-443f-bf68-878369882744	Test	testeotesteotesteotesteo	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2000-09-30 06:01:00	Academia LSPD	1	SCHEDULED	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 04:35:12.162	2026-08-05 04:35:12.162
f3a16436-93fb-4724-9ce0-5d4a085a6395	Testing	TestingTestingTestingTestingTestingTestingTestingTesting	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 15:10:00	Academia LSPD	1	SCHEDULED	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 04:37:06.889	2026-08-05 04:47:55.274
\.


--
-- Data for Name: AcademyTrainingAttendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademyTrainingAttendance" (id, "trainingId", "characterId", status, "respondedAt", notes, "createdAt", "updatedAt") FROM stdin;
76425881-3fdb-4f60-a5a7-18fef1cf40bd	f3a16436-93fb-4724-9ce0-5d4a085a6395	37c5198e-24b2-47ab-9f0a-9d4c17093b41	CONFIRMED	2026-08-05 04:47:14.138	\N	2026-08-05 04:37:27.357	2026-08-05 04:47:14.14
\.


--
-- Data for Name: AcademyTrainingSupportOfficer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademyTrainingSupportOfficer" (id, "trainingId", "officerProfileId", "createdAt") FROM stdin;
fb357530-46fe-4abb-ac3b-912376134f08	f3a16436-93fb-4724-9ce0-5d4a085a6395	1da7678a-ac6a-4536-af2a-ebe7f55559f1	2026-08-05 04:47:55.28
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Account" (id, email, username, "displayName", status, "activeCharacterId", "createdAt", "updatedAt") FROM stdin;
bb3a40d5-7a51-4861-84a4-67048b4a40b8	rapempireofficial@gmail.com	sh4dow	Sh4dow	ACTIVE	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-04 22:57:05.225	2026-08-05 14:53:15.24
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "actorAccountId", "actorCharacterId", action, "targetType", "targetId", metadata, "createdAt") FROM stdin;
28f314f7-1823-4853-aac0-2a0f96fa5466	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.promote	OfficerProfile	aeb68825-86e6-4f71-b362-643d0a3c4bb5	{"rankId": "11a69851-576a-4216-a1fc-2280b7d404cc", "roleSlug": "officer", "divisionId": null, "badgeNumber": "1709", "characterId": "7a7ae5fe-05bf-4bba-9471-08234d4a0188", "characterName": "Grant Mercer"}	2026-08-05 01:15:06.512
0571015a-3fda-400e-bf14-9dbbf32549a5	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.update	OfficerProfile	aeb68825-86e6-4f71-b362-643d0a3c4bb5	{"divisionId": "8f2dc628-f2b4-4c32-964b-31fb1e8528f4"}	2026-08-05 01:15:41.446
afaba5d9-3358-49c5-8071-631c34118fc1	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.update	Division	8f2dc628-f2b4-4c32-964b-31fb1e8528f4	{"isActive": false}	2026-08-05 01:23:03.993
5adbdd07-71ca-40e2-abaa-a481efa945bf	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.update	Division	8f2dc628-f2b4-4c32-964b-31fb1e8528f4	{"isActive": true}	2026-08-05 01:23:19.484
460c457f-b6b3-4f6d-b8ea-7e64b5acf4b1	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	decorations.create	Decoration	f04f4b52-98fd-4041-84ec-166f389c2c6a	{"name": "Medalla al Valor"}	2026-08-05 02:07:05.389
013d1053-1618-4ae2-aa82-6abcf86961f7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	decorations.award	OfficerDecoration	163c0391-e54e-4ee7-bed6-041b93af6f66	{"decorationId": "f04f4b52-98fd-4041-84ec-166f389c2c6a", "officerProfileId": "aeb68825-86e6-4f71-b362-643d0a3c4bb5"}	2026-08-05 02:07:18.635
2376e169-f5db-4e29-8896-ad02987a7119	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.update	OfficerProfile	aeb68825-86e6-4f71-b362-643d0a3c4bb5	{"divisionId": "f6be7c6f-2a8e-4b80-9cee-8fc2c96266a5"}	2026-08-05 02:07:24.781
b7580ef1-1df3-4602-a12d-a3b86a6c3a8b	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.update	OfficerProfile	aeb68825-86e6-4f71-b362-643d0a3c4bb5	{"divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	2026-08-05 02:07:27.583
78b0474b-2617-4079-abc5-0e9894798302	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.update	Division	aaa46fab-0265-476b-aecd-81372126b135	{"imageUrl": "/uploads/divisions/aaa46fab-0265-476b-aecd-81372126b135-d606ecf7d897.jpg"}	2026-08-05 02:08:47.008
00837448-ca2e-410b-b02e-31e9f6384145	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.promote	OfficerProfile	1da7678a-ac6a-4536-af2a-ebe7f55559f1	{"rankId": "11a69851-576a-4216-a1fc-2280b7d404cc", "roleSlug": "officer", "divisionId": null, "badgeNumber": "0001", "characterId": "626c5381-191d-4d16-b4d0-30a69cad7a23", "characterName": "Thomas Graves"}	2026-08-05 02:10:16.478
2be52f3c-28f3-4ce3-bfc6-f7fe942c79b7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	decorations.award	OfficerDecoration	619799ba-7725-4139-8e84-a24b0864cd5f	{"decorationId": "f04f4b52-98fd-4041-84ec-166f389c2c6a", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 02:40:56.822
165ff0ea-1be8-4821-a057-177f60ec3516	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	decorations.revoke	OfficerDecoration	619799ba-7725-4139-8e84-a24b0864cd5f	{"decorationId": "f04f4b52-98fd-4041-84ec-166f389c2c6a", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 02:40:58.211
68ef6153-52c7-4aa3-a24b-3388281ca560	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	decorations.award	Officer	1da7678a-ac6a-4536-af2a-ebe7f55559f1	{"notes": null, "decorationId": "f04f4b52-98fd-4041-84ec-166f389c2c6a", "decorationName": "Medalla al Valor", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1", "officerDecorationId": "a624f72f-d4cd-4ca7-bf10-b4128fdaecea"}	2026-08-05 03:15:20.135
2b7211e6-d650-4cd6-adef-37d6493b9bbd	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.rank_promoted	Officer	aeb68825-86e6-4f71-b362-643d0a3c4bb5	{"toRankId": "8c7a881a-64d3-4b15-be49-3e7838065ed4", "fromRankId": "11a69851-576a-4216-a1fc-2280b7d404cc", "toRankName": "Jefe", "fromRankName": "Oficial I"}	2026-08-05 03:16:23.022
60c965b2-0ad9-407c-bd84-1e9fbd76ae98	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.supervisor_added	Division	aaa46fab-0265-476b-aecd-81372126b135	{"badgeNumber": "0001", "officerName": "Thomas Graves", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 03:31:29.704
1ec68cbd-30ea-42bb-8b77-db3081dccb87	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.opening_created	Division	aaa46fab-0265-476b-aecd-81372126b135	{"title": "SE ABREN LAS CONVOS", "minRankId": "11a69851-576a-4216-a1fc-2280b7d404cc", "openingId": "c46ca8a4-6399-4b46-aae2-d0c17ca4e356"}	2026-08-05 03:31:45.068
dad86657-3cb9-46f5-b0df-130dcb2f2931	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.supervisor_removed	Division	aaa46fab-0265-476b-aecd-81372126b135	{"officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 03:32:15.218
fb61f943-f3da-457c-847f-b7c30b67ad40	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.supervisor_added	Division	aaa46fab-0265-476b-aecd-81372126b135	{"badgeNumber": "1709", "officerName": "Grant Mercer", "officerProfileId": "aeb68825-86e6-4f71-b362-643d0a3c4bb5"}	2026-08-05 03:32:16.996
8b2404c7-b584-4ad4-b7e1-637aeaeb4300	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	divisions.interest_letter_submitted	Division	aaa46fab-0265-476b-aecd-81372126b135	{"letterId": "96b1861a-e9ec-43a3-be12-35b06981eb47", "openingId": "c46ca8a4-6399-4b46-aae2-d0c17ca4e356", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 03:32:33.463
013b42ab-4047-42da-927b-7f96c947e1b5	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	divisions.interest_letter_accepted	Division	aaa46fab-0265-476b-aecd-81372126b135	{"letterId": "96b1861a-e9ec-43a3-be12-35b06981eb47", "officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1", "previousDivisionId": null}	2026-08-05 03:32:58.491
137e1b2d-c715-46ce-ac50-22b3f119f4c0	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	officers.division_changed	Officer	1da7678a-ac6a-4536-af2a-ebe7f55559f1	{"source": "interest_letter", "letterId": "96b1861a-e9ec-43a3-be12-35b06981eb47", "toDivisionId": "aaa46fab-0265-476b-aecd-81372126b135", "fromDivisionId": null, "toDivisionName": "SWAT"}	2026-08-05 03:32:58.494
5b56cff6-d00f-47eb-9973-9b86a4e05536	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	reports.created	Report	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	{"title": "Test", "involved": ["1da7678a-ac6a-4536-af2a-ebe7f55559f1"], "divisionId": "8f2dc628-f2b4-4c32-964b-31fb1e8528f4", "reportNumber": 1, "leadOfficerId": "aeb68825-86e6-4f71-b362-643d0a3c4bb5"}	2026-08-05 03:46:22.03
f9109e38-8a7a-4166-b66e-7d9c474618f8	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	reports.transferred	Report	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	{"notes": "Trabajen", "toDivisionId": "aaa46fab-0265-476b-aecd-81372126b135", "fromDivisionId": "8f2dc628-f2b4-4c32-964b-31fb1e8528f4"}	2026-08-05 03:47:40.192
dd0db193-1b51-45c1-a69f-0a7e40b21acf	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	reports.evidence_added	Report	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	{"path": "/uploads/reports/7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e-b54cb3b3a989.jpg", "type": "IMAGE", "evidenceId": "64437181-b0d1-4439-9362-0b7f9a27ed63", "originalName": "descarga.jpg"}	2026-08-05 03:57:35.649
737c6a74-23f6-4a03-b8b6-3312279ae81f	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	reports.evidence_added	Report	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	{"path": "/uploads/reports/7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e-4c53f29c9169.png", "type": "IMAGE", "evidenceId": "b0cf1338-5f3c-4d0f-93ac-bd3684a54a37", "originalName": "foton3.png"}	2026-08-05 03:57:46.871
2f0b69af-d5c0-4096-88d2-04b69ec8e488	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	academy.application_created	Academy	acdf67b6-407c-443b-a03f-e8152395867e	{"type": "ACADEMY"}	2026-08-05 04:22:38.434
d86776eb-768f-45af-9711-15b649237917	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.application_status_changed	Academy	acdf67b6-407c-443b-a03f-e8152395867e	{"status": "UNDER_REVIEW"}	2026-08-05 04:24:27.861
12268ba1-c5e6-4dd1-b3be-dc903964c89c	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.training_created	Academy	12eb7b95-219b-443f-bf68-878369882744	{"title": "Test", "startsAt": "2000-09-30T06:01:00.000Z"}	2026-08-05 04:35:12.167
c27a2315-dccc-46c2-80f3-887d8cdf8f16	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.cadet_promoted	Officer	f222fa14-6d78-4a88-b047-03be84bd2557	{"event": "academy_accepted", "rankId": "e3ae6686-4ce4-4311-ae25-2b40cfa2d039", "badgeNumber": "C-3992", "characterId": "37c5198e-24b2-47ab-9f0a-9d4c17093b41"}	2026-08-05 04:35:30.398
4146b7f3-d844-4a75-ac7b-5f8ea0d5add4	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.application_accepted	Academy	acdf67b6-407c-443b-a03f-e8152395867e	{"type": "ACADEMY"}	2026-08-05 04:35:30.409
65fec4b7-d5a6-4659-a31b-0845e4f3a5d9	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.training_created	Academy	f3a16436-93fb-4724-9ce0-5d4a085a6395	{"title": "Testing", "startsAt": "2026-08-05T15:10:00.000Z"}	2026-08-05 04:37:06.893
5d6ea7e9-ac75-4074-9cd9-e89559fe002a	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	academy.attendance_responded	Academy	f3a16436-93fb-4724-9ce0-5d4a085a6395	{"status": "CONFIRMED", "attendanceId": "76425881-3fdb-4f60-a5a7-18fef1cf40bd"}	2026-08-05 04:37:27.361
20b6be75-fe9c-4c48-991f-d4e784cf7fa0	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	academy.attendance_responded	Academy	f3a16436-93fb-4724-9ce0-5d4a085a6395	{"status": "CONFIRMED", "attendanceId": "76425881-3fdb-4f60-a5a7-18fef1cf40bd"}	2026-08-05 04:47:14.15
5cc9002d-e985-4206-b75a-2ff381d008f4	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.training_support_added	Academy	f3a16436-93fb-4724-9ce0-5d4a085a6395	{"officerProfileId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 04:47:55.282
ec71f45b-aa14-42ea-8881-91df265686f7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.training_updated	Academy	f3a16436-93fb-4724-9ce0-5d4a085a6395	{"title": "Testing", "status": "SCHEDULED", "location": "Academia LSPD"}	2026-08-05 04:47:55.285
0083f4e7-59e7-4871-b7a6-ba0b04ce9ee3	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	academy.announcement_published	Academy	b3c78004-0f1f-466f-a041-56d7bc4203a8	{"title": "ASCENSOS EL VIERNES", "priority": "NORMAL"}	2026-08-05 04:49:01.526
02c9cf89-742a-4477-87e6-7f616d89c883	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_uploaded	Gallery	3b5d5cef-5b33-43e2-bbd6-70fa3ff46163	{"title": null, "sortOrder": 0}	2026-08-05 05:03:24.947
9f44da33-d7c1-4314-8fa3-4ab470b7014c	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_published	Gallery	3b5d5cef-5b33-43e2-bbd6-70fa3ff46163	\N	2026-08-05 05:03:24.957
5904010a-1652-4d60-abc3-c1c349dc1304	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	news.created	News	d5f84564-a50e-48b3-a82e-18bd4d44253d	{"title": "Testeo", "status": "DRAFT"}	2026-08-05 05:05:17.646
2268afac-b783-41c4-aa9a-2d3dca6c4a69	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	news.updated	News	d5f84564-a50e-48b3-a82e-18bd4d44253d	{"toStatus": "PUBLISHED", "fromStatus": "DRAFT"}	2026-08-05 05:05:20.053
3e8b1846-40d9-4cdc-8f7a-09f6d64ad335	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	news.published	News	d5f84564-a50e-48b3-a82e-18bd4d44253d	{"title": "Testeo"}	2026-08-05 05:05:20.058
bcc0ed74-85b5-42cc-830a-970bc4d781a9	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_uploaded	Gallery	733c467e-77a8-44f0-81fa-23c33f0ec007	{"title": null, "sortOrder": 1}	2026-08-05 05:12:37.371
905c428e-8771-4597-b432-d2d67eabb5b2	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_published	Gallery	733c467e-77a8-44f0-81fa-23c33f0ec007	\N	2026-08-05 05:12:37.373
4b2928c8-8cb3-41b2-b5d6-c46cc1a84eb0	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_uploaded	Gallery	f1a352db-dd7d-41e5-8097-452721139285	{"title": null, "sortOrder": 2}	2026-08-05 05:12:49.937
d41c91c8-c6c9-491a-9445-4085862a5e47	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_published	Gallery	f1a352db-dd7d-41e5-8097-452721139285	\N	2026-08-05 05:12:49.938
89ac283c-bfdc-4da6-a8e5-690b78e14770	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_uploaded	Gallery	294117d7-3159-4a41-910e-5a1edd4b8ef5	{"title": null, "sortOrder": 3}	2026-08-05 05:12:53.938
05b54950-f1ff-4158-93d6-5919502ee571	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	gallery.image_published	Gallery	294117d7-3159-4a41-910e-5a1edd4b8ef5	\N	2026-08-05 05:12:53.94
1aa49d80-2170-4a06-9744-ae1a5e3b047e	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	characters.profile_updated	Character	7a7ae5fe-05bf-4bba-9471-08234d4a0188	{"phone": {"to": null, "from": null}, "biography": {"to": "asddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", "from": null}, "birthDate": {"to": "2000-09-30T00:00:00.000Z", "from": "2000-09-30T00:00:00.000Z"}, "nationality": {"to": "Estadounidense", "from": "Estadounidense"}}	2026-08-05 14:53:04.704
1b938149-a5d4-4b25-a57c-b21ad455db76	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	characters.avatar_updated	Character	7a7ae5fe-05bf-4bba-9471-08234d4a0188	{"avatarUrl": "/uploads/avatars/7a7ae5fe-05bf-4bba-9471-08234d4a0188-12eb204f8ade.png"}	2026-08-05 14:53:04.755
d73059be-a7a1-497a-8859-bfb41423a6d9	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	characters.profile_updated	Character	7a7ae5fe-05bf-4bba-9471-08234d4a0188	{"phone": {"to": null, "from": null}, "biography": {"to": null, "from": "asddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"}, "birthDate": {"to": "2000-09-30T00:00:00.000Z", "from": "2000-09-30T00:00:00.000Z"}, "nationality": {"to": "Estadounidense", "from": "Estadounidense"}}	2026-08-05 14:53:40.785
af5c3c74-4ba5-48b4-bbf6-7aa30ef54ae8	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	characters.profile_updated	Character	7a7ae5fe-05bf-4bba-9471-08234d4a0188	{"phone": {"to": null, "from": null}, "biography": {"to": null, "from": null}, "birthDate": {"to": "2000-09-30T00:00:00.000Z", "from": "2000-09-30T00:00:00.000Z"}, "nationality": {"to": "Estadounidense", "from": "Estadounidense"}}	2026-08-05 14:53:43.9
997e437f-7aaa-489f-a384-a049a0760a38	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	characters.avatar_updated	Character	7a7ae5fe-05bf-4bba-9471-08234d4a0188	{"avatarUrl": "/uploads/avatars/7a7ae5fe-05bf-4bba-9471-08234d4a0188-b54cb3b3a989.jpg"}	2026-08-05 14:53:43.936
\.


--
-- Data for Name: AuthIdentity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuthIdentity" (id, "accountId", provider, "providerAccountId", "passwordHash", profile, "createdAt", "updatedAt") FROM stdin;
f0c93ccb-2ddb-466d-962b-81879b907e42	bb3a40d5-7a51-4861-84a4-67048b4a40b8	LOCAL	rapempireofficial@gmail.com	$argon2id$v=19$m=65536,p=4,t=3$iQhhXKgdnioW7IInc7sVGw$gEnNzJRAp0IOR5y1TF6PXA0HBR8i7WFYyWgKXDNTK0I	\N	2026-08-04 22:57:05.225	2026-08-04 22:57:05.225
\.


--
-- Data for Name: Character; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Character" (id, "accountId", "firstName", "lastName", status, "createdAt", "updatedAt", "birthDate", sex, nationality, "avatarUrl", "rankId", "fivemCitizenId", "joinedAt", phone, biography) FROM stdin;
626c5381-191d-4d16-b4d0-30a69cad7a23	bb3a40d5-7a51-4861-84a4-67048b4a40b8	Thomas	Graves	OFFICER	2026-08-04 22:58:38.51	2026-08-05 02:10:16.469	2000-09-30	MALE	Estadounidense	/uploads/avatars/626c5381-191d-4d16-b4d0-30a69cad7a23-b54cb3b3a989.jpg	11a69851-576a-4216-a1fc-2280b7d404cc	\N	2026-08-04	\N	\N
37c5198e-24b2-47ab-9f0a-9d4c17093b41	bb3a40d5-7a51-4861-84a4-67048b4a40b8	Test	Test	CADET	2026-08-05 01:09:58.081	2026-08-05 04:35:30.39	2000-09-30	MALE	Estadounidense	/uploads/avatars/37c5198e-24b2-47ab-9f0a-9d4c17093b41-b54cb3b3a989.jpg	e3ae6686-4ce4-4311-ae25-2b40cfa2d039	\N	2026-08-05	\N	\N
7a7ae5fe-05bf-4bba-9471-08234d4a0188	bb3a40d5-7a51-4861-84a4-67048b4a40b8	Grant	Mercer	OFFICER	2026-08-04 22:57:44.266	2026-08-05 14:53:43.932	2000-09-30	MALE	Estadounidense	/uploads/avatars/7a7ae5fe-05bf-4bba-9471-08234d4a0188-b54cb3b3a989.jpg	8c7a881a-64d3-4b15-be49-3e7838065ed4	\N	2026-08-04	\N	\N
\.


--
-- Data for Name: CharacterRole; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CharacterRole" ("characterId", "roleId", "assignedAt") FROM stdin;
626c5381-191d-4d16-b4d0-30a69cad7a23	56c189af-1afe-456c-b85e-49894501598e	2026-08-04 22:58:38.51
7a7ae5fe-05bf-4bba-9471-08234d4a0188	b165be01-0d24-483a-bdb8-da559af61d4c	2026-08-04 22:57:44.266
37c5198e-24b2-47ab-9f0a-9d4c17093b41	56c189af-1afe-456c-b85e-49894501598e	2026-08-05 01:09:58.081
7a7ae5fe-05bf-4bba-9471-08234d4a0188	e1ddf573-b680-4001-b6c5-42cb52e5a614	2026-08-05 01:15:06.505
626c5381-191d-4d16-b4d0-30a69cad7a23	e1ddf573-b680-4001-b6c5-42cb52e5a614	2026-08-05 02:10:16.475
37c5198e-24b2-47ab-9f0a-9d4c17093b41	a635d0df-e329-4ce0-83aa-2e5d86bba5a5	2026-08-05 04:35:30.396
\.


--
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Complaint" (id, "caseNumber", title, description, "incidentDate", location, status, "complainantId", "accusedOfficerId", "createdAt", "updatedAt") FROM stdin;
c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	1	Evasion de Responsabilidad	Esto es un testeo porque el agente me choto y se dio a la fuga	2026-08-04	Vinewood	UNDER_INVESTIGATION	37c5198e-24b2-47ab-9f0a-9d4c17093b41	1da7678a-ac6a-4536-af2a-ebe7f55559f1	2026-08-05 02:11:30.748	2026-08-05 02:13:12.422
773a9539-c929-4b32-99e1-a587a6354f1d	2	test	testttttttttttt	2019-09-30	Test	UNDER_INVESTIGATION	37c5198e-24b2-47ab-9f0a-9d4c17093b41	1da7678a-ac6a-4536-af2a-ebe7f55559f1	2026-08-05 02:17:37.618	2026-08-05 02:39:43.938
\.


--
-- Data for Name: ComplaintAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ComplaintAssignment" (id, "complaintId", "characterId", "isPrimary", "assignedAt", "unassignedAt") FROM stdin;
15030e87-ccb2-4621-98e7-d682a244d86c	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	t	2026-08-05 02:13:57.797	\N
f39824b5-16ef-4c1c-bb79-57ba8761c763	773a9539-c929-4b32-99e1-a587a6354f1d	7a7ae5fe-05bf-4bba-9471-08234d4a0188	t	2026-08-05 02:39:43.928	\N
\.


--
-- Data for Name: ComplaintEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ComplaintEvent" (id, "complaintId", "actorId", type, message, metadata, "createdAt") FROM stdin;
9c7e75e2-7eb4-435b-9f80-bd45ae834d2b	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	37c5198e-24b2-47ab-9f0a-9d4c17093b41	CREATED	Denuncia creada	{"badgeNumber": "0001", "accusedOfficerId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 02:11:30.748
e03e8433-d56a-4d9c-98cd-3a0ba59e538f	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	37c5198e-24b2-47ab-9f0a-9d4c17093b41	MESSAGE_SENT	Nuevo mensaje en el chat	{"messageId": "d37faaed-7104-4fde-a635-3f5cfa15c81e"}	2026-08-05 02:11:52.564
99a23df7-0adb-442c-89d6-f6e720391e57	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	MESSAGE_SENT	Nuevo mensaje en el chat	{"messageId": "89076219-188a-4a5e-bddd-fb5de02cae22"}	2026-08-05 02:12:06.74
5bea0f2b-5a25-43b8-9e10-36843b8e658f	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INTERNAL_NOTE_ADDED	Nota interna agregada	{"noteId": "5cc24ade-ea79-47eb-a8a4-aee0b9e38f09"}	2026-08-05 02:12:57.218
618578ef-0b95-4216-a104-8ac0d0d0d9eb	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	STATUS_CHANGED	Estado cambiado a UNDER_INVESTIGATION	{"to": "UNDER_INVESTIGATION", "from": "PENDING"}	2026-08-05 02:13:12.427
9765f08c-3bfc-4af3-a188-298216960813	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INVESTIGATOR_ASSIGNED	Investigador asignado: Grant Mercer	{"characterId": "7a7ae5fe-05bf-4bba-9471-08234d4a0188"}	2026-08-05 02:13:48.965
d9260503-9676-4b58-8763-f4972e2d5880	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INVESTIGATOR_ASSIGNED	Investigador asignado: Grant Mercer	{"characterId": "7a7ae5fe-05bf-4bba-9471-08234d4a0188"}	2026-08-05 02:13:55.381
f027a180-93d3-4ed8-9572-dee9bdd5a9cb	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INVESTIGATOR_ASSIGNED	Investigador asignado: Grant Mercer	{"characterId": "7a7ae5fe-05bf-4bba-9471-08234d4a0188"}	2026-08-05 02:13:57.8
be49c83d-39b9-4fde-a1da-a0c54986bbc0	773a9539-c929-4b32-99e1-a587a6354f1d	37c5198e-24b2-47ab-9f0a-9d4c17093b41	CREATED	Denuncia creada	{"badgeNumber": "0001", "accusedOfficerId": "1da7678a-ac6a-4536-af2a-ebe7f55559f1"}	2026-08-05 02:17:37.618
81a2b66a-ea16-4ef1-8f4c-ee199ace2aa7	773a9539-c929-4b32-99e1-a587a6354f1d	7a7ae5fe-05bf-4bba-9471-08234d4a0188	MESSAGE_SENT	Nuevo mensaje en el chat	{"messageId": "5b523613-8775-4263-a39e-a1fa9b8fba13"}	2026-08-05 02:39:02.735
fceb3a1c-8dfc-42cf-9e31-dcd0c9a54161	773a9539-c929-4b32-99e1-a587a6354f1d	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INVESTIGATOR_ASSIGNED	Investigador asignado: Grant Mercer	{"characterId": "7a7ae5fe-05bf-4bba-9471-08234d4a0188"}	2026-08-05 02:39:43.929
1ce27300-7f28-44d2-9726-5e1de378e9ef	773a9539-c929-4b32-99e1-a587a6354f1d	7a7ae5fe-05bf-4bba-9471-08234d4a0188	STATUS_CHANGED	Estado cambiado a UNDER_INVESTIGATION	{"to": "UNDER_INVESTIGATION", "from": "PENDING"}	2026-08-05 02:39:43.939
a5a468f5-9d12-4226-be3d-88a0b28e420d	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	INTERNAL_NOTE_ADDED	Nota interna agregada	{"noteId": "b6ffe733-3d2e-4355-afc1-8a926ab5f25f"}	2026-08-05 02:49:50.679
\.


--
-- Data for Name: ComplaintEvidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ComplaintEvidence" (id, "complaintId", type, label, value, "createdAt") FROM stdin;
a48d134c-6bfe-4ccd-a458-1bbeaf233a25	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	IMAGE	Evidencia fotográfica	/uploads/complaint-evidence/cc64f95b-ba6e-4b4c-b21c-0c05162c7b1f-bb8ab46faf17.jpg	2026-08-05 02:11:30.748
\.


--
-- Data for Name: ComplaintInternalNote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ComplaintInternalNote" (id, "complaintId", "authorId", body, "createdAt") FROM stdin;
5cc24ade-ea79-47eb-a8a4-aee0b9e38f09	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	Este es un tarado	2026-08-05 02:12:57.216
b6ffe733-3d2e-4355-afc1-8a926ab5f25f	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	Si lo es JAJAJA	2026-08-05 02:49:50.641
\.


--
-- Data for Name: ComplaintMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ComplaintMessage" (id, "complaintId", "authorId", body, "createdAt") FROM stdin;
d37faaed-7104-4fde-a635-3f5cfa15c81e	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	37c5198e-24b2-47ab-9f0a-9d4c17093b41	¿Hola?	2026-08-05 02:11:52.562
89076219-188a-4a5e-bddd-fb5de02cae22	c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	7a7ae5fe-05bf-4bba-9471-08234d4a0188	Buenas, evaluaremos el caso.	2026-08-05 02:12:06.737
5b523613-8775-4263-a39e-a1fa9b8fba13	773a9539-c929-4b32-99e1-a587a6354f1d	7a7ae5fe-05bf-4bba-9471-08234d4a0188	Test	2026-08-05 02:39:02.732
\.


--
-- Data for Name: Decoration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Decoration" (id, name, description, "imageUrl", "isActive", "createdAt", "updatedAt") FROM stdin;
f04f4b52-98fd-4041-84ec-166f389c2c6a	Medalla al Valor	Esta medalla se otorga por valentia en un procedimiento.	/uploads/decorations/f04f4b52-98fd-4041-84ec-166f389c2c6a-bb8ab46faf17.jpg	t	2026-08-05 02:07:05.387	2026-08-05 02:07:05.387
\.


--
-- Data for Name: Division; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Division" (id, name, slug, description, "isActive", "createdAt", "updatedAt", "imageUrl") FROM stdin;
f6be7c6f-2a8e-4b80-9cee-8fc2c96266a5	Patrol	patrol	Uniformed patrol division	t	2026-08-04 23:17:16.581	2026-08-05 04:59:43.813	\N
aaa46fab-0265-476b-aecd-81372126b135	SWAT	swat	Special Weapons and Tactics	t	2026-08-04 23:17:16.585	2026-08-05 04:59:43.815	/uploads/divisions/aaa46fab-0265-476b-aecd-81372126b135-d606ecf7d897.jpg
8f2dc628-f2b4-4c32-964b-31fb1e8528f4	Detectives	detectives	Investigative division	t	2026-08-04 23:17:16.587	2026-08-05 04:59:43.818	\N
001d2157-5deb-4ab9-8fb6-bb3fcf845f29	Internal Affairs	internal-affairs	Professional standards and internal affairs	t	2026-08-04 23:17:16.588	2026-08-05 04:59:43.824	\N
d2291926-b1e7-4ec4-823b-5fdf59fac235	Recruitment and Training Division	rtd	Recruitment, academy training and intake (RTD)	t	2026-08-05 04:32:09.385	2026-08-05 04:59:43.826	\N
\.


--
-- Data for Name: DivisionOpening; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DivisionOpening" (id, "divisionId", title, description, "minRankId", status, "createdByCharacterId", "openedAt", "closedAt", "createdAt", "updatedAt") FROM stdin;
c46ca8a4-6399-4b46-aae2-d0c17ca4e356	aaa46fab-0265-476b-aecd-81372126b135	SE ABREN LAS CONVOS	OPOSITEN MUCHACHOS	11a69851-576a-4216-a1fc-2280b7d404cc	OPEN	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 03:31:45.065	\N	2026-08-05 03:31:45.065	2026-08-05 03:31:45.065
\.


--
-- Data for Name: DivisionSupervisor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DivisionSupervisor" (id, "divisionId", "officerProfileId", "assignedAt", "createdAt") FROM stdin;
79817c06-efc4-4880-815f-ea79f3cacd3f	aaa46fab-0265-476b-aecd-81372126b135	aeb68825-86e6-4f71-b362-643d0a3c4bb5	2026-08-05 03:32:16.993	2026-08-05 03:32:16.993
\.


--
-- Data for Name: GalleryItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GalleryItem" (id, "imageUrl", title, description, "sortOrder", status, "createdAt", "updatedAt") FROM stdin;
3b5d5cef-5b33-43e2-bbd6-70fa3ff46163	/uploads/gallery/3b5d5cef-5b33-43e2-bbd6-70fa3ff46163-b54cb3b3a989.jpg	\N	\N	0	ACTIVE	2026-08-05 05:03:24.944	2026-08-05 05:03:24.944
733c467e-77a8-44f0-81fa-23c33f0ec007	/uploads/gallery/733c467e-77a8-44f0-81fa-23c33f0ec007-4c53f29c9169.png	\N	\N	1	ACTIVE	2026-08-05 05:12:37.366	2026-08-05 05:12:37.366
f1a352db-dd7d-41e5-8097-452721139285	/uploads/gallery/f1a352db-dd7d-41e5-8097-452721139285-eddd01e13359.png	\N	\N	2	ACTIVE	2026-08-05 05:12:49.935	2026-08-05 05:12:49.935
294117d7-3159-4a41-910e-5a1edd4b8ef5	/uploads/gallery/294117d7-3159-4a41-910e-5a1edd4b8ef5-48192b119fbd.png	\N	\N	3	ACTIVE	2026-08-05 05:12:53.937	2026-08-05 05:12:53.937
\.


--
-- Data for Name: InterestLetter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InterestLetter" (id, "openingId", "divisionId", "officerProfileId", motivation, experience, "additionalInfo", status, "reviewNotes", "reviewedByCharacterId", "reviewedAt", "createdAt", "updatedAt") FROM stdin;
96b1861a-e9ec-43a3-be12-35b06981eb47	c46ca8a4-6399-4b46-aae2-d0c17ca4e356	aaa46fab-0265-476b-aecd-81372126b135	1da7678a-ac6a-4536-af2a-ebe7f55559f1	ASDASDASDASDASDASDASDASDASDASDASDASDASD	ASDASDASDASDASDASDASDASDASDASDASDASDASD	ASDASDASDASDASDASDASDASDASDASDASDASDASD	ACCEPTED	\N	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 03:32:58.482	2026-08-05 03:32:33.46	2026-08-05 03:32:58.484
\.


--
-- Data for Name: NewsArticle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NewsArticle" (id, title, summary, content, "coverImageUrl", "authorName", "authorCharacterId", status, "publishedAt", "createdAt", "updatedAt") FROM stdin;
d5f84564-a50e-48b3-a82e-18bd4d44253d	Testeo	TesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteo	TesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteoTesteo	/uploads/news/d5f84564-a50e-48b3-a82e-18bd4d44253d-b54cb3b3a989.jpg	Grant Mercer	7a7ae5fe-05bf-4bba-9471-08234d4a0188	PUBLISHED	2026-08-05 05:05:20.051	2026-08-05 05:05:17.643	2026-08-05 05:05:20.052
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "accountId", "characterId", type, title, body, href, metadata, "isRead", "readAt", "createdAt") FROM stdin;
920e5f9f-e775-4cf4-b565-7e522abd373f	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_MESSAGE	Denuncia #1	Nuevo mensaje en el chat de la denuncia.	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:12:35.629	2026-08-05 02:11:52.567
74012ca2-81a8-43a3-9f7e-f96055bf9599	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_CREATED	Nueva denuncia #1	Evasion de Responsabilidad	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:12:43.01	2026-08-05 02:11:30.768
952f4805-7096-44bc-9483-c8356278ce88	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	COMPLAINT_STATUS	Denuncia #1	Estado actualizado: UNDER_INVESTIGATION	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"status": "UNDER_INVESTIGATION", "complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:13:17.045	2026-08-05 02:13:12.431
fac81426-2b7d-4cc7-8514-3e69d9488e53	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	COMPLAINT_MESSAGE	Denuncia #1	Nuevo mensaje en el chat de la denuncia.	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:38:48.311	2026-08-05 02:12:06.742
0ccb2e68-b126-4227-ab98-3240a9b75337	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_ASSIGNED	Denuncia #2	Se te ha asignado como investigador.	/complaints/773a9539-c929-4b32-99e1-a587a6354f1d	{"complaintId": "773a9539-c929-4b32-99e1-a587a6354f1d"}	t	2026-08-05 02:41:16.604	2026-08-05 02:39:43.936
540ea036-c2b0-4d74-9458-edea6a33853a	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_ASSIGNED	Denuncia #1	Se te ha asignado como investigador.	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:45:53.872	2026-08-05 02:13:48.972
ca858b64-96fe-4838-9e95-a5fee50003c5	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_ASSIGNED	Denuncia #1	Se te ha asignado como investigador.	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:45:53.872	2026-08-05 02:13:55.388
4ed75ddf-65d0-431e-9b75-43f1292841cb	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_ASSIGNED	Denuncia #1	Se te ha asignado como investigador.	/complaints/c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4	{"complaintId": "c2934077-cbb7-4a3e-84d0-b3e3a9dbd9d4"}	t	2026-08-05 02:45:53.872	2026-08-05 02:13:57.807
6b66b418-6e24-4a0f-b8b5-b9629a39b0b7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	COMPLAINT_CREATED	Nueva denuncia #2	test	/complaints/773a9539-c929-4b32-99e1-a587a6354f1d	{"complaintId": "773a9539-c929-4b32-99e1-a587a6354f1d"}	t	2026-08-05 02:45:53.872	2026-08-05 02:17:37.638
8006993b-09f8-4fca-9302-d1a62a3fa388	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	COMPLAINT_MESSAGE	Denuncia #2	Nuevo mensaje en el chat de la denuncia.	/complaints/773a9539-c929-4b32-99e1-a587a6354f1d	{"complaintId": "773a9539-c929-4b32-99e1-a587a6354f1d"}	t	2026-08-05 02:45:53.872	2026-08-05 02:39:02.739
d2cd6bc3-22f7-452d-be2d-90b2ad758c52	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	DIVISION_OPENING	Convocatoria: SWAT	SE ABREN LAS CONVOS	/divisions?id=aaa46fab-0265-476b-aecd-81372126b135	{"openingId": "c46ca8a4-6399-4b46-aae2-d0c17ca4e356", "divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 03:32:45.343	2026-08-05 03:31:45.071
c12da34b-5161-471e-a917-41d09de27b6f	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	REPORT_EVIDENCE	Nueva evidencia · informe #1	Sangre	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	\N	t	2026-08-05 03:59:15.136	2026-08-05 03:57:46.898
a01d70a2-f2c4-479a-a06a-e6e515e9b650	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	DIVISION_ASSIGNED	Cambio de división	Ahora perteneces a SWAT.	/divisions?id=aaa46fab-0265-476b-aecd-81372126b135	{"divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 03:59:23.412	2026-08-05 03:32:58.499
d2ad1d82-df0a-4acf-8742-840ab23e78c1	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	DIVISION_OPENING	Convocatoria: SWAT	SE ABREN LAS CONVOS	/divisions?id=aaa46fab-0265-476b-aecd-81372126b135	{"openingId": "c46ca8a4-6399-4b46-aae2-d0c17ca4e356", "divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 04:22:48.27	2026-08-05 03:31:45.073
a1f5e573-0cab-4eda-a6c1-f8c9ea42411d	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	DIVISION_INTEREST_LETTER	Nueva carta de interés · SWAT	Thomas Graves ha postulado.	/divisions?id=aaa46fab-0265-476b-aecd-81372126b135&tab=applications	{"letterId": "96b1861a-e9ec-43a3-be12-35b06981eb47", "divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 04:22:48.27	2026-08-05 03:32:33.467
a5d3ac06-5ebd-4abd-b007-584b3d5a069c	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	DIVISION_APPLICATION_ACCEPTED	Aceptado en SWAT	Tu carta de interés ha sido aceptada. Has sido asignado a la división.	/divisions?id=aaa46fab-0265-476b-aecd-81372126b135	{"letterId": "96b1861a-e9ec-43a3-be12-35b06981eb47", "divisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 04:22:48.27	2026-08-05 03:32:58.496
56404fcb-f8bd-436e-8ba9-f6eb2b228f92	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	REPORT_PARTICIPANT	Involucrado en informe #1	Test	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	\N	t	2026-08-05 04:22:48.27	2026-08-05 03:46:22.035
cd442fa9-e3ce-43d8-a9c5-4f18df808143	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	REPORT_TRANSFERRED	Informe derivado #1	Test	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	{"reportId": "7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e", "toDivisionId": "aaa46fab-0265-476b-aecd-81372126b135"}	t	2026-08-05 04:22:48.27	2026-08-05 03:47:40.196
47493838-d8ed-4175-906d-6cf6133a1d5d	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	REPORT_EVIDENCE	Nueva evidencia · informe #1	Armas	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	\N	t	2026-08-05 04:22:48.27	2026-08-05 03:57:35.654
7a4ecefb-69df-4f33-b498-b73096cac7f5	bb3a40d5-7a51-4861-84a4-67048b4a40b8	626c5381-191d-4d16-b4d0-30a69cad7a23	REPORT_EVIDENCE	Nueva evidencia · informe #1	Armas	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	\N	t	2026-08-05 04:22:48.27	2026-08-05 03:57:35.66
9ebdb7e9-1cca-4d4b-8a76-c8a4da7ab9bf	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	REPORT_EVIDENCE	Nueva evidencia · informe #1	Sangre	/reports?id=7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	\N	t	2026-08-05 04:22:48.27	2026-08-05 03:57:46.888
e6f440ad-07cc-4215-9106-4e608dcb3af5	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	ACADEMY_APPLICATION_SUBMITTED	Postulación enviada	Tu postulación a la Academia LSPD ha sido recibida.	/academy/applications	\N	t	2026-08-05 04:22:48.27	2026-08-05 04:22:38.443
53a782b2-9fe6-4a2a-aa79-4af28e9bd033	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	ACADEMY_APPLICATION_ACCEPTED	Bienvenido a la Academia LSPD	Tu postulación fue aceptada. Ya eres Cadete.	/academy	\N	f	\N	2026-08-05 04:35:30.411
62429450-bebd-4c69-b05a-685acf909b28	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	ACADEMY_TRAINING_CREATED	Nuevo entrenamiento · Testing	2026-08-05T15:10:00.000Z · Academia LSPD	/academy	\N	t	2026-08-05 04:48:16.124	2026-08-05 04:37:06.899
c9f7e0cb-83a8-41d0-8342-52ea010ffdbd	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	ACADEMY_ATTENDANCE	Asistencia · Testing	Test Test: CONFIRMED	/academy?trainingId=f3a16436-93fb-4724-9ce0-5d4a085a6395	\N	t	2026-08-05 05:12:06.862	2026-08-05 04:47:14.154
b4ec93ab-bba6-4cae-baca-f87591fa5c96	bb3a40d5-7a51-4861-84a4-67048b4a40b8	37c5198e-24b2-47ab-9f0a-9d4c17093b41	ACADEMY_ANNOUNCEMENT	Anuncio · ASCENSOS EL VIERNES	ASCENSOS PARA EL DIA VIERNES POR SU INCREIBLE DESEMPEÑO DE GENERACION Z	/academy	\N	t	2026-08-05 05:19:48.181	2026-08-05 04:49:01.531
ac0cf2ff-ae4a-4899-b529-de2febbb5f5b	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7a7ae5fe-05bf-4bba-9471-08234d4a0188	ACADEMY_ATTENDANCE	Asistencia · Testing	Test Test: CONFIRMED	/academy	\N	t	2026-08-05 14:53:28.513	2026-08-05 04:37:27.363
\.


--
-- Data for Name: Occupation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Occupation" (id, "characterId", type, organization, "position", "isPrimary", "isActive", "startedAt", "endedAt", "createdAt", "updatedAt") FROM stdin;
5c91084c-d4c0-485f-8f82-9bcb3fe17db6	626c5381-191d-4d16-b4d0-30a69cad7a23	DEPARTMENT	LSPD	Oficial I	t	t	2026-08-05	\N	2026-08-05 02:10:16.473	2026-08-05 02:10:16.473
9785f0a9-6012-4926-b853-9332b8e454e6	7a7ae5fe-05bf-4bba-9471-08234d4a0188	DEPARTMENT	LSPD	Jefe	t	t	2026-08-05	\N	2026-08-05 01:15:06.5	2026-08-05 03:16:23.021
1684e8ad-8843-43eb-80af-43a9b2708f21	37c5198e-24b2-47ab-9f0a-9d4c17093b41	BUSINESS	Los Santos Customs	Empleado	f	f	2026-08-05	2026-08-05	2026-08-05 01:09:58.081	2026-08-05 04:35:30.393
4247c50f-fb4d-4e28-bda5-ed4cfb5ac319	37c5198e-24b2-47ab-9f0a-9d4c17093b41	DEPARTMENT	LSPD	Cadete	t	t	2026-08-05	\N	2026-08-05 04:35:30.394	2026-08-05 04:35:30.394
\.


--
-- Data for Name: OfficerDecoration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OfficerDecoration" (id, "officerProfileId", "decorationId", "awardedAt", notes, "createdAt") FROM stdin;
163c0391-e54e-4ee7-bed6-041b93af6f66	aeb68825-86e6-4f71-b362-643d0a3c4bb5	f04f4b52-98fd-4041-84ec-166f389c2c6a	2026-08-05	\N	2026-08-05 02:07:18.63
a624f72f-d4cd-4ca7-bf10-b4128fdaecea	1da7678a-ac6a-4536-af2a-ebe7f55559f1	f04f4b52-98fd-4041-84ec-166f389c2c6a	2026-08-05	\N	2026-08-05 03:15:20.1
\.


--
-- Data for Name: OfficerProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OfficerProfile" (id, "characterId", "badgeNumber", "rankId", "divisionId", status, callsign, "joinedAt", "createdAt", "updatedAt") FROM stdin;
aeb68825-86e6-4f71-b362-643d0a3c4bb5	7a7ae5fe-05bf-4bba-9471-08234d4a0188	1709	8c7a881a-64d3-4b15-be49-3e7838065ed4	aaa46fab-0265-476b-aecd-81372126b135	ACTIVE	1709	2026-08-05	2026-08-05 01:15:06.484	2026-08-05 03:16:23.013
1da7678a-ac6a-4536-af2a-ebe7f55559f1	626c5381-191d-4d16-b4d0-30a69cad7a23	0001	11a69851-576a-4216-a1fc-2280b7d404cc	aaa46fab-0265-476b-aecd-81372126b135	ACTIVE	0001	2026-08-05	2026-08-05 02:10:16.466	2026-08-05 03:32:58.488
f222fa14-6d78-4a88-b047-03be84bd2557	37c5198e-24b2-47ab-9f0a-9d4c17093b41	C-3992	e3ae6686-4ce4-4311-ae25-2b40cfa2d039	\N	ACTIVE	\N	2026-08-05	2026-08-05 04:35:30.387	2026-08-05 04:35:30.387
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permission" (id, key, description, "createdAt", "updatedAt") FROM stdin;
a9e569ff-4fa8-46b9-b398-78e180e1706e	roles.read	List roles	2026-08-04 22:38:59.433	2026-08-05 04:59:43.182
74cb563f-a90c-4cf6-b592-b59b7c854832	officers.read	View officers directory	2026-08-04 22:38:59.441	2026-08-05 04:59:43.229
9e7b9494-234f-43a6-bc59-6b51367ad270	officers.create	Promote characters to officers	2026-08-04 23:17:15.848	2026-08-05 04:59:43.231
5cce4e25-a418-49c9-8989-4c6cdf5c7e0f	officers.update	Edit officer profiles	2026-08-04 22:38:59.442	2026-08-05 04:59:43.233
aab78e1b-14ed-44bc-880f-4264c0b9f9ba	decorations.read	View decorations	2026-08-05 02:04:37.848	2026-08-05 04:59:43.264
d3d88826-0dc3-4c65-bc64-64200f0bc71b	roles.assign	Assign roles to characters	2026-08-04 23:54:53.959	2026-08-05 04:59:43.184
dbe71d48-dab0-4aaf-a7ec-bc1acd855d59	occupations.read	Read character occupations	2026-08-04 23:54:53.961	2026-08-05 04:59:43.186
ae04b364-3b2b-4e38-ba77-f3a02ed578db	occupations.manage	Manage character occupations	2026-08-04 23:54:53.964	2026-08-05 04:59:43.188
41896871-649f-4adb-a878-351bc575733b	ranks.read	List ranks	2026-08-04 22:38:59.433	2026-08-05 04:59:43.19
e4bd91f4-7a09-4788-86a3-d70126ea06d7	ranks.create	Create ranks	2026-08-04 23:17:15.586	2026-08-05 04:59:43.192
ebf8d775-09f6-4597-bcd4-9a70b95a0cb2	ranks.update	Update ranks	2026-08-04 23:17:15.595	2026-08-05 04:59:43.201
ed2278db-810b-482a-88cc-3c9b69a2c3a4	officers.delete	Retire / remove officer profiles	2026-08-04 23:17:15.863	2026-08-05 04:59:43.236
7b11c2b2-9658-43dc-b9cf-830bca663568	divisions.read	View divisions	2026-08-04 22:38:59.442	2026-08-05 04:59:43.238
520ca8ed-101a-4a65-a0cc-b0aac4767e34	divisions.create	Create divisions	2026-08-04 23:17:15.873	2026-08-05 04:59:43.24
633d48a3-2dd5-4e23-9f34-35a317676c9c	divisions.update	Update divisions	2026-08-04 23:17:15.875	2026-08-05 04:59:43.242
c23ff997-9248-4a40-98e2-783fedcca43e	admin.access	Access administrative section	2026-08-04 23:17:15.876	2026-08-05 04:59:43.244
df34b7ca-ad45-4535-b50c-cb2b003b957a	reports.read	View reports	2026-08-04 22:38:59.443	2026-08-05 04:59:43.246
c465f33b-79b9-4704-867f-67f3e67ed632	reports.create	Create reports	2026-08-04 22:38:59.443	2026-08-05 04:59:43.248
5238a7db-e0d6-42f1-8e4c-23a3c2de7a4f	decorations.manage	Manage decorations catalog and awards	2026-08-05 02:04:37.85	2026-08-05 04:59:43.266
d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	academy.read	Access academy cadet portal	2026-08-04 22:38:59.447	2026-08-05 04:59:43.268
a63275f9-0692-49d1-9365-e9e384c0962d	academy.manage	Manage academy trainings and announcements	2026-08-05 04:19:37.058	2026-08-05 04:59:43.27
c640da11-2285-4f3d-92f7-acfd53579e60	academy.apply	Submit academy or transfer applications	2026-08-05 04:19:37.062	2026-08-05 04:59:43.272
3d7fa75e-a87f-43f8-93c0-dd4ab287ef10	academy.applications	Review academy applications	2026-08-05 04:19:37.064	2026-08-05 04:59:43.276
40b0c91c-9b38-48b4-87bf-e56784366bf0	news.manage	Manage landing page news CMS	2026-08-05 04:59:43.277	2026-08-05 04:59:43.277
c0543209-74d5-46c0-959c-d3625d279dd4	gallery.manage	Manage landing page gallery CMS	2026-08-05 04:59:43.279	2026-08-05 04:59:43.279
7ae7954c-592a-4f81-8a71-d4877dbfcb71	audit.read	Read administrative audit logs	2026-08-04 23:17:15.896	2026-08-05 04:59:43.281
58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	reports.approve	Approve reports	2026-08-04 22:38:59.444	2026-08-05 04:59:43.251
d30fd839-83f3-4b52-92ed-6b829a862c13	reports.transfer	Transfer reports between divisions	2026-08-05 03:43:24.754	2026-08-05 04:59:43.253
cf3bbf58-4cc8-4e89-b745-3060a589e86e	complaints.read	View complaints	2026-08-04 22:38:59.445	2026-08-05 04:59:43.255
4278bfe5-b788-4540-8059-9b29de39e47c	complaints.create	Create complaints	2026-08-04 22:38:59.446	2026-08-05 04:59:43.257
adb440fb-8249-466e-ae80-93262e2987b1	evidence.read	View evidence	2026-08-04 22:38:59.445	2026-08-05 03:43:24.756
c5d22b57-b85d-4336-accb-b116f82dbcd9	complaints.manage	Manage complaints (IA / Chief)	2026-08-05 02:04:37.843	2026-08-05 04:59:43.259
9396d055-ea6d-495f-a59d-d1dffdbbb3fb	complaints.assign	Assign complaint investigators	2026-08-05 02:04:37.845	2026-08-05 04:59:43.261
fee7850a-58bd-4211-a4d1-a6939f24eb9d	*	Global access	2026-08-04 22:38:59.428	2026-08-05 04:59:43.143
3df4ce13-41a5-4d7f-a0e1-9c29312ddf25	permissions.read	List permissions	2026-08-04 22:38:59.432	2026-08-05 04:59:43.181
0822cca0-d78d-47a5-ba58-67daa26c4c63	ranks.delete	Delete unused ranks	2026-08-04 23:17:15.604	2026-08-05 04:59:43.205
0c362479-c1ba-4c83-b016-8a0badab59ed	characters.read	Read own characters	2026-08-04 22:38:59.434	2026-08-05 04:59:43.211
c83c3db3-e660-4a95-b3bf-38b073f6596f	characters.create	Create characters	2026-08-04 22:38:59.435	2026-08-05 04:59:43.213
2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	characters.update	Update own characters	2026-08-04 22:38:59.436	2026-08-05 04:59:43.215
27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	characters.switch	Switch active character	2026-08-04 22:38:59.437	2026-08-05 04:59:43.218
598c832f-8cba-4dfc-9b32-e06d004da954	characters.search	Search characters for admin actions	2026-08-04 23:17:15.768	2026-08-05 04:59:43.219
654c9c6c-aa0d-40e2-bdd7-059a1617e89b	auth.session	Manage own session	2026-08-04 22:38:59.438	2026-08-05 04:59:43.221
6dc57098-b812-4ab4-b404-9272cf478c80	dashboard.read	View dashboard	2026-08-04 22:38:59.439	2026-08-05 04:59:43.224
98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	profile.read	View own profile	2026-08-04 22:38:59.44	2026-08-05 04:59:43.225
e3226ec3-bd68-491f-a08c-977d6f11f680	settings.read	View settings	2026-08-04 22:38:59.44	2026-08-05 04:59:43.227
\.


--
-- Data for Name: Rank; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Rank" (id, name, slug, description, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
8f1f779d-07f6-44f0-92f4-1543f54fc88f	Ciudadano	civilian	Civilian hierarchy label	0	t	2026-08-04 22:38:59.754	2026-08-05 04:59:43.777
e3ae6686-4ce4-4311-ae25-2b40cfa2d039	Cadete	cadet	Police academy cadet	10	t	2026-08-04 22:38:59.757	2026-08-05 04:59:43.785
11a69851-576a-4216-a1fc-2280b7d404cc	Oficial I	officer-i	Officer grade I	20	t	2026-08-04 22:38:59.758	2026-08-05 04:59:43.787
6776b073-d278-4522-9efb-eee4a6dcd811	Oficial II	officer-ii	Officer grade II	30	t	2026-08-04 22:38:59.758	2026-08-05 04:59:43.788
6a926d38-2029-44ce-aa4b-0062a4e56433	Sargento I	sergeant-i	Sergeant grade I	40	t	2026-08-04 22:38:59.759	2026-08-05 04:59:43.791
97d50427-9102-4461-9d4b-ecc38e1fec0d	Sargento II	sergeant-ii	Sergeant grade II	50	t	2026-08-04 22:38:59.76	2026-08-05 04:59:43.793
c0be1815-ac62-464b-bc9d-311ee414f41e	Teniente	lieutenant	Lieutenant	60	t	2026-08-04 22:38:59.76	2026-08-05 04:59:43.796
569155a8-68c4-4a1a-a292-2b76a4be23b2	Capitán	captain	Captain	70	t	2026-08-04 22:38:59.761	2026-08-05 04:59:43.802
b6e71968-9e16-41ce-9b33-9bfda5a69c16	Comandante	commander	Commander	80	t	2026-08-04 22:38:59.762	2026-08-05 04:59:43.804
8c7a881a-64d3-4b15-be49-3e7838065ed4	Jefe	chief	Chief of Police	100	t	2026-08-04 22:38:59.763	2026-08-05 04:59:43.808
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RefreshToken" (id, "accountId", "tokenHash", "expiresAt", "revokedAt", "replacedById", "userAgent", "ipAddress", "createdAt") FROM stdin;
9f12f0df-428c-46e3-9bcf-451f2837a103	bb3a40d5-7a51-4861-84a4-67048b4a40b8	891a629ea8893e1779ed5f4f3c5a682356602959bf600b6e8be434f840cf4c53	2026-08-11 22:57:05.237	2026-08-04 22:57:56.677	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 22:57:05.239
8ea5de74-bcb8-4191-9087-56b9a4f6ac5a	bb3a40d5-7a51-4861-84a4-67048b4a40b8	ef9054214abdc718dbaf07ce61902361b53187eb35c32154542f20db84995c5b	2026-08-11 22:58:01.947	2026-08-04 22:58:51.43	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 22:58:01.949
87300140-aac8-4735-be61-ea4670d22e52	bb3a40d5-7a51-4861-84a4-67048b4a40b8	2e10115a28d40b625c677dc763f103c104c160f67ea7cad2be3191d3e8b72d65	2026-08-11 22:58:54.763	2026-08-04 22:59:19.792	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 22:58:54.764
d26dcd11-8d51-47ee-8d96-6b648e3eecc9	bb3a40d5-7a51-4861-84a4-67048b4a40b8	b81c3a94a2da7713fca8acca032321c1e007cb4a00ad1a02b0282081646dd084	2026-08-11 23:01:55.742	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 23:01:55.743
0dce543d-434a-4484-a598-cf57580dff8b	bb3a40d5-7a51-4861-84a4-67048b4a40b8	a244c79c0caea3b934a24e8c558f3f588d3d9a992fb66a560e9da729f228a075	2026-08-11 23:20:36.787	2026-08-04 23:20:43.624	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 23:20:36.789
4a363c39-ebeb-4dc5-8796-d6564fa8b498	bb3a40d5-7a51-4861-84a4-67048b4a40b8	27a448218af0cf61d2c5e6cee809bbc240c944c5e974c9a5bb980e61c5d2b9a5	2026-08-11 23:27:16.191	2026-08-04 23:34:18.112	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 23:27:16.193
c0cb249b-3a5f-486c-bbfe-484c4c6944f3	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7451d2cd5c43289f3d901cddccc79ff327bed72495da179bd8cd811d3e5c6f93	2026-08-11 23:34:23.816	2026-08-04 23:37:34.94	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 23:34:23.817
917867f1-864b-4408-aa27-4055f5755b56	bb3a40d5-7a51-4861-84a4-67048b4a40b8	b13ecd2b59054a8d163a55a5a90e38b351d669d7fa51507815e6d3bdad7f1719	2026-08-12 00:42:57.158	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 00:42:57.163
44e41597-ee8a-4046-a917-e8b45747b528	bb3a40d5-7a51-4861-84a4-67048b4a40b8	244d58751add5b580086dad25cb6ed89c133556e31259eff906afd04b0b07481	2026-08-11 23:37:39.693	2026-08-05 00:42:57.175	917867f1-864b-4408-aa27-4055f5755b56	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-04 23:37:39.694
ab642cc2-1a0b-4b4b-b30e-e5a7a3f4e5c1	bb3a40d5-7a51-4861-84a4-67048b4a40b8	c308f6c51252ba3600497e554326fe561f1376f52dd64f1401776997be169205	2026-08-12 01:41:35.139	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 01:41:35.141
476e9b3e-bac2-48f7-9945-c9cf66c6a1e7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	288175ac8c6a3236bce324f854200f1efbf3fd34276672b4dfa4905d8e1010ce	2026-08-12 01:04:06.538	2026-08-05 01:41:35.143	ab642cc2-1a0b-4b4b-b30e-e5a7a3f4e5c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 01:04:06.54
dbd4248a-d421-406a-b9f1-53d7d05fbe3d	bb3a40d5-7a51-4861-84a4-67048b4a40b8	9d30d5469c789ef89bebb45734eb80e08d92284a0e8977b78565c119ceb397f6	2026-08-12 02:05:42.349	2026-08-05 02:38:29.742	0ddd4232-da87-4545-b41d-37292306c48a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 02:05:42.35
baa9deb4-b7ad-4f9b-a5b5-f9ca90013384	bb3a40d5-7a51-4861-84a4-67048b4a40b8	bacd47999d0025d1108601c086577f8aa4383eb3452665a8e3cde8e896d0d178	2026-08-12 03:14:56.138	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 03:14:56.14
0ddd4232-da87-4545-b41d-37292306c48a	bb3a40d5-7a51-4861-84a4-67048b4a40b8	82c648b5b8db4bf7002d314fe39708693ca48c4e57a2603b299399cc2274fba5	2026-08-12 02:38:29.738	2026-08-05 03:14:56.157	baa9deb4-b7ad-4f9b-a5b5-f9ca90013384	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 02:38:29.739
03e7e525-4101-4e0f-bcc0-9170691add8b	bb3a40d5-7a51-4861-84a4-67048b4a40b8	ea30c5510eb42d80e004b9bef8df29ebc329e558f06c38d76b1ee927c483be7e	2026-08-12 03:47:46.506	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 03:47:46.508
bff92ec5-50a3-42b4-abc0-5eb2a519679d	bb3a40d5-7a51-4861-84a4-67048b4a40b8	72414aba02886380c5c4d70988fcbe16bf55cdb2a26faf748b471e5f8eb7e5af	2026-08-12 03:30:53.898	2026-08-05 03:47:46.54	03e7e525-4101-4e0f-bcc0-9170691add8b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 03:30:53.9
c80ecec9-1180-4d86-a23d-1eed8405fab3	bb3a40d5-7a51-4861-84a4-67048b4a40b8	1655176ffabc5985fd54e561dc1d7674730d7cb340a88cb8adaea88e873877a4	2026-08-12 04:33:25.312	2026-08-05 04:51:24.047	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 04:33:25.313
9a2f8dca-8882-478c-b8ae-77178f975311	bb3a40d5-7a51-4861-84a4-67048b4a40b8	738f8f1eb8685eaff7d1aa77d9b36a4e1013fe46dea55786537f4e900868ef91	2026-08-12 05:03:08.586	2026-08-05 05:03:33.301	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 05:03:08.588
954d11b3-6619-4899-8eab-617753ce4e52	bb3a40d5-7a51-4861-84a4-67048b4a40b8	baf98d14428dd159774af26583627aa6898efa158d7a29f62e3adbc1c72a0a76	2026-08-12 05:03:46.611	2026-08-05 05:05:22.723	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 05:03:46.613
d5b6b4dd-f7f9-4909-a52e-bd9347c51fc1	bb3a40d5-7a51-4861-84a4-67048b4a40b8	54acc2c541f1de35a1f4c91cca71e21d0342eb4078c6e7ab50b115c45ccbec80	2026-08-12 05:11:59.302	2026-08-05 05:13:03.493	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 05:11:59.304
b9cfdb0c-b660-4ccd-b79c-8c6d9c986735	bb3a40d5-7a51-4861-84a4-67048b4a40b8	7b83cd6f2f10ca33feeac7d6914f5e6290cb4529637ea2536202a97e1ee95bd2	2026-08-12 05:16:03.831	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 05:16:03.833
8d2b04b9-dfb0-407e-ba49-2db73c3d06f7	bb3a40d5-7a51-4861-84a4-67048b4a40b8	1eac8a90057da6df83304fac79424660b2a0afd466db1b47674a7c74805361e6	2026-08-12 14:45:41.413	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 14:45:41.414
86ddda7a-202d-4c2a-9ff6-fb2252512bd9	bb3a40d5-7a51-4861-84a4-67048b4a40b8	a4a349772c9e6c2d64d958f387c89a6d2086a665755b459c757e7f03487e032f	2026-08-12 14:52:37.053	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	::1	2026-08-05 14:52:37.054
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Report" (id, "reportNumber", title, type, description, "incidentDate", location, status, priority, "divisionId", "leadOfficerId", "createdByCharacterId", "createdAt", "updatedAt") FROM stdin;
7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	1	Test	ACTIVITY	TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest	2000-09-03	VTest	IN_PROGRESS	CRITICAL	aaa46fab-0265-476b-aecd-81372126b135	aeb68825-86e6-4f71-b362-643d0a3c4bb5	7a7ae5fe-05bf-4bba-9471-08234d4a0188	2026-08-05 03:46:22.02	2026-08-05 03:47:40.186
\.


--
-- Data for Name: ReportEvidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportEvidence" (id, "reportId", type, value, label, "createdAt", "originalName", "uploadedByCharacterId") FROM stdin;
64437181-b0d1-4439-9362-0b7f9a27ed63	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	IMAGE	/uploads/reports/7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e-b54cb3b3a989.jpg	Armas	2026-08-05 03:57:35.645	descarga.jpg	7a7ae5fe-05bf-4bba-9471-08234d4a0188
b0cf1338-5f3c-4d0f-93ac-bd3684a54a37	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	IMAGE	/uploads/reports/7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e-4c53f29c9169.png	Sangre	2026-08-05 03:57:46.861	foton3.png	7a7ae5fe-05bf-4bba-9471-08234d4a0188
\.


--
-- Data for Name: ReportParticipant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportParticipant" (id, "reportId", "officerProfileId", "createdAt") FROM stdin;
3e6f2c4c-85a7-4739-a6bc-89735a00382c	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	1da7678a-ac6a-4536-af2a-ebe7f55559f1	2026-08-05 03:46:22.02
\.


--
-- Data for Name: ReportTransfer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportTransfer" (id, "reportId", "fromDivisionId", "toDivisionId", "transferredByCharacterId", notes, "createdAt") FROM stdin;
3dfec281-a86c-4f2c-abf9-2949077f52de	7ba6d0c0-25c7-4d70-a91c-8f9766d6e15e	8f2dc628-f2b4-4c32-964b-31fb1e8528f4	aaa46fab-0265-476b-aecd-81372126b135	7a7ae5fe-05bf-4bba-9471-08234d4a0188	Trabajen	2026-08-05 03:47:40.184
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, name, slug, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
56c189af-1afe-456c-b85e-49894501598e	Citizen	citizen	Default civilian role	t	2026-08-04 22:38:59.447	2026-08-05 04:59:43.284
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	Cadet	cadet	LSPD cadet	t	2026-08-04 22:38:59.467	2026-08-05 04:59:43.331
e1ddf573-b680-4001-b6c5-42cb52e5a614	Officer	officer	LSPD officer authorization role	t	2026-08-04 22:38:59.504	2026-08-05 04:59:43.359
d49babff-a5a6-4735-b739-38a612dffd4a	Sergeant	sergeant	LSPD sergeant authorization role	t	2026-08-04 22:38:59.534	2026-08-05 04:59:43.382
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	Lieutenant	lieutenant	LSPD lieutenant authorization role	t	2026-08-04 22:38:59.568	2026-08-05 04:59:43.414
367a9d56-a600-4b53-85a5-32380f4e8420	Captain	captain	LSPD captain authorization role	t	2026-08-04 22:38:59.608	2026-08-05 04:59:43.453
d2c89448-75ff-438a-9918-bfbeedf1055b	Commander	commander	LSPD commander authorization role	t	2026-08-04 22:38:59.66	2026-08-05 04:59:43.551
b165be01-0d24-483a-bdb8-da559af61d4c	Chief	chief	LSPD chief authorization role	t	2026-08-04 22:38:59.712	2026-08-05 04:59:43.634
92dbaf50-0095-4b55-8395-545647c7f7d3	Internal Affairs	internal-affairs	Internal Affairs investigators	t	2026-08-05 02:04:38.535	2026-08-05 04:59:43.728
cb0a892f-8984-4257-9db0-dbffa7566499	Administrator	administrator	System administrator	t	2026-08-04 22:38:59.751	2026-08-05 04:59:43.773
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermission" ("roleId", "permissionId", "assignedAt") FROM stdin;
56c189af-1afe-456c-b85e-49894501598e	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.45
56c189af-1afe-456c-b85e-49894501598e	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.454
56c189af-1afe-456c-b85e-49894501598e	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.456
56c189af-1afe-456c-b85e-49894501598e	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.457
56c189af-1afe-456c-b85e-49894501598e	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.459
56c189af-1afe-456c-b85e-49894501598e	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.46
56c189af-1afe-456c-b85e-49894501598e	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.462
56c189af-1afe-456c-b85e-49894501598e	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.463
56c189af-1afe-456c-b85e-49894501598e	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.464
56c189af-1afe-456c-b85e-49894501598e	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.466
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.469
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.471
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.473
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.475
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.477
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.478
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.48
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.482
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.483
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.486
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.489
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.491
a635d0df-e329-4ce0-83aa-2e5d86bba5a5	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.501
e1ddf573-b680-4001-b6c5-42cb52e5a614	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.505
e1ddf573-b680-4001-b6c5-42cb52e5a614	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.507
e1ddf573-b680-4001-b6c5-42cb52e5a614	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.509
e1ddf573-b680-4001-b6c5-42cb52e5a614	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.511
e1ddf573-b680-4001-b6c5-42cb52e5a614	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.513
e1ddf573-b680-4001-b6c5-42cb52e5a614	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.514
e1ddf573-b680-4001-b6c5-42cb52e5a614	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.516
e1ddf573-b680-4001-b6c5-42cb52e5a614	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.519
e1ddf573-b680-4001-b6c5-42cb52e5a614	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.521
e1ddf573-b680-4001-b6c5-42cb52e5a614	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.523
e1ddf573-b680-4001-b6c5-42cb52e5a614	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.524
e1ddf573-b680-4001-b6c5-42cb52e5a614	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.526
e1ddf573-b680-4001-b6c5-42cb52e5a614	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.527
e1ddf573-b680-4001-b6c5-42cb52e5a614	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.529
d49babff-a5a6-4735-b739-38a612dffd4a	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.536
d49babff-a5a6-4735-b739-38a612dffd4a	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.538
d49babff-a5a6-4735-b739-38a612dffd4a	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.54
d49babff-a5a6-4735-b739-38a612dffd4a	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.542
d49babff-a5a6-4735-b739-38a612dffd4a	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.543
d49babff-a5a6-4735-b739-38a612dffd4a	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.544
d49babff-a5a6-4735-b739-38a612dffd4a	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.546
d49babff-a5a6-4735-b739-38a612dffd4a	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.548
d49babff-a5a6-4735-b739-38a612dffd4a	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.55
d49babff-a5a6-4735-b739-38a612dffd4a	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.552
d49babff-a5a6-4735-b739-38a612dffd4a	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.554
d49babff-a5a6-4735-b739-38a612dffd4a	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.556
d49babff-a5a6-4735-b739-38a612dffd4a	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.557
d49babff-a5a6-4735-b739-38a612dffd4a	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.559
d49babff-a5a6-4735-b739-38a612dffd4a	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.562
d49babff-a5a6-4735-b739-38a612dffd4a	58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	2026-08-04 22:38:59.564
d49babff-a5a6-4735-b739-38a612dffd4a	a9e569ff-4fa8-46b9-b398-78e180e1706e	2026-08-04 22:38:59.566
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.57
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.572
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.573
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.575
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.577
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.579
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.581
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.582
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.585
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.587
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.589
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.592
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.594
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.596
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.6
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	2026-08-04 22:38:59.602
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	a9e569ff-4fa8-46b9-b398-78e180e1706e	2026-08-04 22:38:59.605
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	5cce4e25-a418-49c9-8989-4c6cdf5c7e0f	2026-08-04 22:38:59.607
367a9d56-a600-4b53-85a5-32380f4e8420	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.609
367a9d56-a600-4b53-85a5-32380f4e8420	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.612
367a9d56-a600-4b53-85a5-32380f4e8420	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.614
367a9d56-a600-4b53-85a5-32380f4e8420	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.617
367a9d56-a600-4b53-85a5-32380f4e8420	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.62
367a9d56-a600-4b53-85a5-32380f4e8420	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.623
367a9d56-a600-4b53-85a5-32380f4e8420	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.624
367a9d56-a600-4b53-85a5-32380f4e8420	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.627
367a9d56-a600-4b53-85a5-32380f4e8420	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.629
367a9d56-a600-4b53-85a5-32380f4e8420	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.631
367a9d56-a600-4b53-85a5-32380f4e8420	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.633
367a9d56-a600-4b53-85a5-32380f4e8420	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.635
367a9d56-a600-4b53-85a5-32380f4e8420	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.638
367a9d56-a600-4b53-85a5-32380f4e8420	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.64
367a9d56-a600-4b53-85a5-32380f4e8420	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.644
367a9d56-a600-4b53-85a5-32380f4e8420	58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	2026-08-04 22:38:59.647
367a9d56-a600-4b53-85a5-32380f4e8420	a9e569ff-4fa8-46b9-b398-78e180e1706e	2026-08-04 22:38:59.649
367a9d56-a600-4b53-85a5-32380f4e8420	3df4ce13-41a5-4d7f-a0e1-9c29312ddf25	2026-08-04 22:38:59.653
367a9d56-a600-4b53-85a5-32380f4e8420	5cce4e25-a418-49c9-8989-4c6cdf5c7e0f	2026-08-04 22:38:59.656
367a9d56-a600-4b53-85a5-32380f4e8420	41896871-649f-4adb-a878-351bc575733b	2026-08-04 22:38:59.658
d2c89448-75ff-438a-9918-bfbeedf1055b	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.661
d2c89448-75ff-438a-9918-bfbeedf1055b	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.664
d2c89448-75ff-438a-9918-bfbeedf1055b	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.665
d2c89448-75ff-438a-9918-bfbeedf1055b	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.669
d2c89448-75ff-438a-9918-bfbeedf1055b	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.673
d2c89448-75ff-438a-9918-bfbeedf1055b	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.675
d2c89448-75ff-438a-9918-bfbeedf1055b	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.678
d2c89448-75ff-438a-9918-bfbeedf1055b	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.68
d2c89448-75ff-438a-9918-bfbeedf1055b	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.682
d2c89448-75ff-438a-9918-bfbeedf1055b	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.686
d2c89448-75ff-438a-9918-bfbeedf1055b	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.689
d2c89448-75ff-438a-9918-bfbeedf1055b	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.692
d2c89448-75ff-438a-9918-bfbeedf1055b	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.693
d2c89448-75ff-438a-9918-bfbeedf1055b	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.696
d2c89448-75ff-438a-9918-bfbeedf1055b	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.699
d2c89448-75ff-438a-9918-bfbeedf1055b	58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	2026-08-04 22:38:59.703
d2c89448-75ff-438a-9918-bfbeedf1055b	a9e569ff-4fa8-46b9-b398-78e180e1706e	2026-08-04 22:38:59.705
d2c89448-75ff-438a-9918-bfbeedf1055b	3df4ce13-41a5-4d7f-a0e1-9c29312ddf25	2026-08-04 22:38:59.707
d2c89448-75ff-438a-9918-bfbeedf1055b	5cce4e25-a418-49c9-8989-4c6cdf5c7e0f	2026-08-04 22:38:59.709
d2c89448-75ff-438a-9918-bfbeedf1055b	41896871-649f-4adb-a878-351bc575733b	2026-08-04 22:38:59.711
b165be01-0d24-483a-bdb8-da559af61d4c	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-04 22:38:59.713
b165be01-0d24-483a-bdb8-da559af61d4c	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-04 22:38:59.715
b165be01-0d24-483a-bdb8-da559af61d4c	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-04 22:38:59.716
b165be01-0d24-483a-bdb8-da559af61d4c	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-04 22:38:59.719
b165be01-0d24-483a-bdb8-da559af61d4c	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-04 22:38:59.721
b165be01-0d24-483a-bdb8-da559af61d4c	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-04 22:38:59.723
b165be01-0d24-483a-bdb8-da559af61d4c	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-04 22:38:59.725
b165be01-0d24-483a-bdb8-da559af61d4c	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-04 22:38:59.726
b165be01-0d24-483a-bdb8-da559af61d4c	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-04 22:38:59.728
b165be01-0d24-483a-bdb8-da559af61d4c	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-04 22:38:59.729
b165be01-0d24-483a-bdb8-da559af61d4c	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-04 22:38:59.731
b165be01-0d24-483a-bdb8-da559af61d4c	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-04 22:38:59.732
b165be01-0d24-483a-bdb8-da559af61d4c	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-04 22:38:59.735
b165be01-0d24-483a-bdb8-da559af61d4c	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-04 22:38:59.737
b165be01-0d24-483a-bdb8-da559af61d4c	d5075c5b-f6cf-47aa-bb66-7bbfa3aba538	2026-08-04 22:38:59.741
b165be01-0d24-483a-bdb8-da559af61d4c	58bb5fa2-8c60-4b0e-9c4b-a214eabe3855	2026-08-04 22:38:59.743
b165be01-0d24-483a-bdb8-da559af61d4c	a9e569ff-4fa8-46b9-b398-78e180e1706e	2026-08-04 22:38:59.744
b165be01-0d24-483a-bdb8-da559af61d4c	3df4ce13-41a5-4d7f-a0e1-9c29312ddf25	2026-08-04 22:38:59.746
b165be01-0d24-483a-bdb8-da559af61d4c	5cce4e25-a418-49c9-8989-4c6cdf5c7e0f	2026-08-04 22:38:59.747
b165be01-0d24-483a-bdb8-da559af61d4c	41896871-649f-4adb-a878-351bc575733b	2026-08-04 22:38:59.749
cb0a892f-8984-4257-9db0-dbffa7566499	fee7850a-58bd-4211-a4d1-a6939f24eb9d	2026-08-04 22:38:59.753
367a9d56-a600-4b53-85a5-32380f4e8420	9e7b9494-234f-43a6-bc59-6b51367ad270	2026-08-04 23:17:16.27
367a9d56-a600-4b53-85a5-32380f4e8420	ed2278db-810b-482a-88cc-3c9b69a2c3a4	2026-08-04 23:17:16.301
367a9d56-a600-4b53-85a5-32380f4e8420	598c832f-8cba-4dfc-9b32-e06d004da954	2026-08-04 23:17:16.308
367a9d56-a600-4b53-85a5-32380f4e8420	e4bd91f4-7a09-4788-86a3-d70126ea06d7	2026-08-04 23:17:16.316
367a9d56-a600-4b53-85a5-32380f4e8420	ebf8d775-09f6-4597-bcd4-9a70b95a0cb2	2026-08-04 23:17:16.318
367a9d56-a600-4b53-85a5-32380f4e8420	0822cca0-d78d-47a5-ba58-67daa26c4c63	2026-08-04 23:17:16.32
367a9d56-a600-4b53-85a5-32380f4e8420	520ca8ed-101a-4a65-a0cc-b0aac4767e34	2026-08-04 23:17:16.326
367a9d56-a600-4b53-85a5-32380f4e8420	633d48a3-2dd5-4e23-9f34-35a317676c9c	2026-08-04 23:17:16.329
367a9d56-a600-4b53-85a5-32380f4e8420	c23ff997-9248-4a40-98e2-783fedcca43e	2026-08-04 23:17:16.331
367a9d56-a600-4b53-85a5-32380f4e8420	7ae7954c-592a-4f81-8a71-d4877dbfcb71	2026-08-04 23:17:16.334
d2c89448-75ff-438a-9918-bfbeedf1055b	9e7b9494-234f-43a6-bc59-6b51367ad270	2026-08-04 23:17:16.392
d2c89448-75ff-438a-9918-bfbeedf1055b	ed2278db-810b-482a-88cc-3c9b69a2c3a4	2026-08-04 23:17:16.399
d2c89448-75ff-438a-9918-bfbeedf1055b	598c832f-8cba-4dfc-9b32-e06d004da954	2026-08-04 23:17:16.401
d2c89448-75ff-438a-9918-bfbeedf1055b	e4bd91f4-7a09-4788-86a3-d70126ea06d7	2026-08-04 23:17:16.41
d2c89448-75ff-438a-9918-bfbeedf1055b	ebf8d775-09f6-4597-bcd4-9a70b95a0cb2	2026-08-04 23:17:16.413
d2c89448-75ff-438a-9918-bfbeedf1055b	0822cca0-d78d-47a5-ba58-67daa26c4c63	2026-08-04 23:17:16.419
d2c89448-75ff-438a-9918-bfbeedf1055b	520ca8ed-101a-4a65-a0cc-b0aac4767e34	2026-08-04 23:17:16.425
d2c89448-75ff-438a-9918-bfbeedf1055b	633d48a3-2dd5-4e23-9f34-35a317676c9c	2026-08-04 23:17:16.428
d2c89448-75ff-438a-9918-bfbeedf1055b	c23ff997-9248-4a40-98e2-783fedcca43e	2026-08-04 23:17:16.43
d2c89448-75ff-438a-9918-bfbeedf1055b	7ae7954c-592a-4f81-8a71-d4877dbfcb71	2026-08-04 23:17:16.434
b165be01-0d24-483a-bdb8-da559af61d4c	9e7b9494-234f-43a6-bc59-6b51367ad270	2026-08-04 23:17:16.502
b165be01-0d24-483a-bdb8-da559af61d4c	ed2278db-810b-482a-88cc-3c9b69a2c3a4	2026-08-04 23:17:16.51
b165be01-0d24-483a-bdb8-da559af61d4c	598c832f-8cba-4dfc-9b32-e06d004da954	2026-08-04 23:17:16.513
b165be01-0d24-483a-bdb8-da559af61d4c	e4bd91f4-7a09-4788-86a3-d70126ea06d7	2026-08-04 23:17:16.518
b165be01-0d24-483a-bdb8-da559af61d4c	ebf8d775-09f6-4597-bcd4-9a70b95a0cb2	2026-08-04 23:17:16.521
b165be01-0d24-483a-bdb8-da559af61d4c	0822cca0-d78d-47a5-ba58-67daa26c4c63	2026-08-04 23:17:16.527
b165be01-0d24-483a-bdb8-da559af61d4c	520ca8ed-101a-4a65-a0cc-b0aac4767e34	2026-08-04 23:17:16.53
b165be01-0d24-483a-bdb8-da559af61d4c	633d48a3-2dd5-4e23-9f34-35a317676c9c	2026-08-04 23:17:16.535
b165be01-0d24-483a-bdb8-da559af61d4c	c23ff997-9248-4a40-98e2-783fedcca43e	2026-08-04 23:17:16.54
b165be01-0d24-483a-bdb8-da559af61d4c	7ae7954c-592a-4f81-8a71-d4877dbfcb71	2026-08-04 23:17:16.544
367a9d56-a600-4b53-85a5-32380f4e8420	d3d88826-0dc3-4c65-bc64-64200f0bc71b	2026-08-04 23:54:54.312
367a9d56-a600-4b53-85a5-32380f4e8420	dbe71d48-dab0-4aaf-a7ec-bc1acd855d59	2026-08-04 23:54:54.357
367a9d56-a600-4b53-85a5-32380f4e8420	ae04b364-3b2b-4e38-ba77-f3a02ed578db	2026-08-04 23:54:54.359
d2c89448-75ff-438a-9918-bfbeedf1055b	d3d88826-0dc3-4c65-bc64-64200f0bc71b	2026-08-04 23:54:54.419
d2c89448-75ff-438a-9918-bfbeedf1055b	dbe71d48-dab0-4aaf-a7ec-bc1acd855d59	2026-08-04 23:54:54.457
d2c89448-75ff-438a-9918-bfbeedf1055b	ae04b364-3b2b-4e38-ba77-f3a02ed578db	2026-08-04 23:54:54.459
b165be01-0d24-483a-bdb8-da559af61d4c	d3d88826-0dc3-4c65-bc64-64200f0bc71b	2026-08-04 23:54:54.538
b165be01-0d24-483a-bdb8-da559af61d4c	dbe71d48-dab0-4aaf-a7ec-bc1acd855d59	2026-08-04 23:54:54.58
b165be01-0d24-483a-bdb8-da559af61d4c	ae04b364-3b2b-4e38-ba77-f3a02ed578db	2026-08-04 23:54:54.585
367a9d56-a600-4b53-85a5-32380f4e8420	c5d22b57-b85d-4336-accb-b116f82dbcd9	2026-08-05 02:04:38.028
367a9d56-a600-4b53-85a5-32380f4e8420	9396d055-ea6d-495f-a59d-d1dffdbbb3fb	2026-08-05 02:04:38.157
367a9d56-a600-4b53-85a5-32380f4e8420	aab78e1b-14ed-44bc-880f-4264c0b9f9ba	2026-08-05 02:04:38.18
367a9d56-a600-4b53-85a5-32380f4e8420	5238a7db-e0d6-42f1-8e4c-23a3c2de7a4f	2026-08-05 02:04:38.183
d2c89448-75ff-438a-9918-bfbeedf1055b	c5d22b57-b85d-4336-accb-b116f82dbcd9	2026-08-05 02:04:38.238
d2c89448-75ff-438a-9918-bfbeedf1055b	9396d055-ea6d-495f-a59d-d1dffdbbb3fb	2026-08-05 02:04:38.245
d2c89448-75ff-438a-9918-bfbeedf1055b	aab78e1b-14ed-44bc-880f-4264c0b9f9ba	2026-08-05 02:04:38.363
d2c89448-75ff-438a-9918-bfbeedf1055b	5238a7db-e0d6-42f1-8e4c-23a3c2de7a4f	2026-08-05 02:04:38.383
b165be01-0d24-483a-bdb8-da559af61d4c	c5d22b57-b85d-4336-accb-b116f82dbcd9	2026-08-05 02:04:38.524
b165be01-0d24-483a-bdb8-da559af61d4c	9396d055-ea6d-495f-a59d-d1dffdbbb3fb	2026-08-05 02:04:38.525
b165be01-0d24-483a-bdb8-da559af61d4c	aab78e1b-14ed-44bc-880f-4264c0b9f9ba	2026-08-05 02:04:38.526
b165be01-0d24-483a-bdb8-da559af61d4c	5238a7db-e0d6-42f1-8e4c-23a3c2de7a4f	2026-08-05 02:04:38.528
92dbaf50-0095-4b55-8395-545647c7f7d3	0c362479-c1ba-4c83-b016-8a0badab59ed	2026-08-05 02:04:38.537
92dbaf50-0095-4b55-8395-545647c7f7d3	c83c3db3-e660-4a95-b3bf-38b073f6596f	2026-08-05 02:04:38.54
92dbaf50-0095-4b55-8395-545647c7f7d3	2dd250a4-23f9-42a7-9b6d-6eab5cde77e2	2026-08-05 02:04:38.542
92dbaf50-0095-4b55-8395-545647c7f7d3	27b09b1a-4cb7-4b4e-a25c-2a9b33b9b97e	2026-08-05 02:04:38.55
92dbaf50-0095-4b55-8395-545647c7f7d3	654c9c6c-aa0d-40e2-bdd7-059a1617e89b	2026-08-05 02:04:38.555
92dbaf50-0095-4b55-8395-545647c7f7d3	6dc57098-b812-4ab4-b404-9272cf478c80	2026-08-05 02:04:38.561
92dbaf50-0095-4b55-8395-545647c7f7d3	98fb2ce7-fed9-49e3-a231-5ba7e35ad5b0	2026-08-05 02:04:38.563
92dbaf50-0095-4b55-8395-545647c7f7d3	e3226ec3-bd68-491f-a08c-977d6f11f680	2026-08-05 02:04:38.567
92dbaf50-0095-4b55-8395-545647c7f7d3	cf3bbf58-4cc8-4e89-b745-3060a589e86e	2026-08-05 02:04:38.569
92dbaf50-0095-4b55-8395-545647c7f7d3	4278bfe5-b788-4540-8059-9b29de39e47c	2026-08-05 02:04:38.575
92dbaf50-0095-4b55-8395-545647c7f7d3	74cb563f-a90c-4cf6-b592-b59b7c854832	2026-08-05 02:04:38.579
92dbaf50-0095-4b55-8395-545647c7f7d3	7b11c2b2-9658-43dc-b9cf-830bca663568	2026-08-05 02:04:38.586
92dbaf50-0095-4b55-8395-545647c7f7d3	df34b7ca-ad45-4535-b50c-cb2b003b957a	2026-08-05 02:04:38.588
92dbaf50-0095-4b55-8395-545647c7f7d3	c465f33b-79b9-4704-867f-67f3e67ed632	2026-08-05 02:04:38.592
92dbaf50-0095-4b55-8395-545647c7f7d3	c5d22b57-b85d-4336-accb-b116f82dbcd9	2026-08-05 02:04:38.598
92dbaf50-0095-4b55-8395-545647c7f7d3	9396d055-ea6d-495f-a59d-d1dffdbbb3fb	2026-08-05 02:04:38.6
92dbaf50-0095-4b55-8395-545647c7f7d3	aab78e1b-14ed-44bc-880f-4264c0b9f9ba	2026-08-05 02:04:38.602
367a9d56-a600-4b53-85a5-32380f4e8420	d30fd839-83f3-4b52-92ed-6b829a862c13	2026-08-05 03:43:24.969
d2c89448-75ff-438a-9918-bfbeedf1055b	d30fd839-83f3-4b52-92ed-6b829a862c13	2026-08-05 03:43:25.041
b165be01-0d24-483a-bdb8-da559af61d4c	d30fd839-83f3-4b52-92ed-6b829a862c13	2026-08-05 03:43:25.238
56c189af-1afe-456c-b85e-49894501598e	c640da11-2285-4f3d-92f7-acfd53579e60	2026-08-05 04:19:37.095
d49babff-a5a6-4735-b739-38a612dffd4a	a63275f9-0692-49d1-9365-e9e384c0962d	2026-08-05 04:19:37.181
08e5f2ff-4d6f-4b7d-a9d8-ab0b58e36b3d	a63275f9-0692-49d1-9365-e9e384c0962d	2026-08-05 04:19:37.223
367a9d56-a600-4b53-85a5-32380f4e8420	a63275f9-0692-49d1-9365-e9e384c0962d	2026-08-05 04:19:37.292
367a9d56-a600-4b53-85a5-32380f4e8420	3d7fa75e-a87f-43f8-93c0-dd4ab287ef10	2026-08-05 04:19:37.294
d2c89448-75ff-438a-9918-bfbeedf1055b	a63275f9-0692-49d1-9365-e9e384c0962d	2026-08-05 04:19:37.365
d2c89448-75ff-438a-9918-bfbeedf1055b	3d7fa75e-a87f-43f8-93c0-dd4ab287ef10	2026-08-05 04:19:37.367
b165be01-0d24-483a-bdb8-da559af61d4c	a63275f9-0692-49d1-9365-e9e384c0962d	2026-08-05 04:19:37.436
b165be01-0d24-483a-bdb8-da559af61d4c	3d7fa75e-a87f-43f8-93c0-dd4ab287ef10	2026-08-05 04:19:37.437
367a9d56-a600-4b53-85a5-32380f4e8420	40b0c91c-9b38-48b4-87bf-e56784366bf0	2026-08-05 04:59:43.53
367a9d56-a600-4b53-85a5-32380f4e8420	c0543209-74d5-46c0-959c-d3625d279dd4	2026-08-05 04:59:43.546
d2c89448-75ff-438a-9918-bfbeedf1055b	40b0c91c-9b38-48b4-87bf-e56784366bf0	2026-08-05 04:59:43.628
d2c89448-75ff-438a-9918-bfbeedf1055b	c0543209-74d5-46c0-959c-d3625d279dd4	2026-08-05 04:59:43.631
b165be01-0d24-483a-bdb8-da559af61d4c	40b0c91c-9b38-48b4-87bf-e56784366bf0	2026-08-05 04:59:43.722
b165be01-0d24-483a-bdb8-da559af61d4c	c0543209-74d5-46c0-959c-d3625d279dd4	2026-08-05 04:59:43.724
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4f1dd6ca-0550-4f03-8e4f-b128eb6f100e	124c1e3eb39fbab2bbd5ad3600c17f2853741fdf455e8f628f1b9dca9bff6853	2026-08-04 17:38:57.845526-05	20260804120000_auth_foundation	\N	\N	2026-08-04 17:38:57.803624-05	1
a66905fd-e43c-4239-8a26-03eec42350c4	24559de56e6b4fed8f94620f25738b44c78f61ec4c1366b6bd049305b0054a2e	2026-08-04 17:38:57.856101-05	20260804210000_character_identity_ranks	\N	\N	2026-08-04 17:38:57.846096-05	1
37a36c63-be44-4b2e-b247-d38a8d658074	0538c1c245a18fd32c53a53526fa464e7978f9966f571a9b288cc54e5cab6c4d	2026-08-04 18:16:12.413453-05	20260804230000_officer_division_audit	\N	\N	2026-08-04 18:16:12.147041-05	1
7f823d76-f4d2-44d0-9a4c-b18367a2bda2	f7faacd5139b5a6ac24843360104331afa315f663bea5d82eb3f79f17ca0fd4a	2026-08-04 18:54:52.719828-05	20260804240000_occupations	\N	\N	2026-08-04 18:54:52.552071-05	1
8ded9aa4-abee-4086-a185-fcc123923b7c	34a3edbef898a213a8790ffc5e41d94966fb4c626d872207781a94ec31516a64	2026-08-04 21:04:36.711489-05	20260805010000_divisions_decorations_complaints	\N	\N	2026-08-04 21:04:36.50393-05	1
43d6cdf1-a704-446b-89fa-494fc7073d78	da75c834a091a508d9314de8373d050adb26e9f8b39e90395c38f3fbd7f65b7b	2026-08-04 22:13:28.558741-05	20260805020000_audit_log_target_index	\N	\N	2026-08-04 22:13:28.536573-05	1
3908fbfd-936d-4efb-badc-1b7530e1b63e	341e3cc5deba8adf04c88220b4fed88f4aef09b5a49a9a84b1c366341c74f10d	2026-08-04 22:27:58.581304-05	20260805030000_divisions_recruitment	\N	\N	2026-08-04 22:27:58.463463-05	1
52375e87-c9b2-4a21-aec3-874f9de1816c	52ada3b56c30e2ddf29e56cb84d4af2eedf9a85e2980088203ffaa42903b0eab	2026-08-04 22:42:52.691696-05	20260805040000_reports_module	\N	\N	2026-08-04 22:42:52.517912-05	1
1d1c3e57-6776-4b9e-aa9d-ab8fd06683c1	49999a7d7a0d0fb8618b48e6b2bcae288cf00bb5b1f08b378fc823bbb84ae36f	2026-08-04 22:55:08.628663-05	20260805050000_report_evidence_upload_meta	\N	\N	2026-08-04 22:55:08.567104-05	1
b2491d83-635e-466c-a4e1-d73240b23dc6	944cc76568f3126b70c942333f8dcc4acbea5511fef6cff0568868fc64654ea3	2026-08-04 23:19:36.256459-05	20260805060000_academy_module	\N	\N	2026-08-04 23:19:36.183751-05	1
cc29e3ec-a0ff-452f-985e-d0b2e26bb902	38d1ffe6e0929a4f6e870595191dd4ab147246b309eea2adb8af2a8e499a0fb9	2026-08-04 23:43:50.569398-05	20260805070000_academy_training_support_officers	\N	\N	2026-08-04 23:43:50.489398-05	1
75197d28-e4ff-4b36-8c4d-61a0da04e259	6c4f5ee1ba9f069aaf9ebf71157df59dadf8d3e09e05a673ae9581c4bb343a1b	2026-08-04 23:59:38.718428-05	20260805080000_landing_news_gallery	\N	\N	2026-08-04 23:59:38.598274-05	1
a0c88fa2-203b-4546-a03f-972e098a6d56	1236a88bb1f551becc3731bdceef84c29cfceb84af488532eb5f5ba49d150221	2026-08-05 09:50:23.574554-05	20260805120000_character_phone_biography	\N	\N	2026-08-05 09:50:23.561873-05	1
\.


--
-- Name: Complaint_caseNumber_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Complaint_caseNumber_seq"', 2, true);


--
-- Name: Report_reportNumber_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Report_reportNumber_seq"', 1, true);


--
-- Name: AcademyAnnouncement AcademyAnnouncement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyAnnouncement"
    ADD CONSTRAINT "AcademyAnnouncement_pkey" PRIMARY KEY (id);


--
-- Name: AcademyApplication AcademyApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyApplication"
    ADD CONSTRAINT "AcademyApplication_pkey" PRIMARY KEY (id);


--
-- Name: AcademyTrainingAttendance AcademyTrainingAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingAttendance"
    ADD CONSTRAINT "AcademyTrainingAttendance_pkey" PRIMARY KEY (id);


--
-- Name: AcademyTrainingSupportOfficer AcademyTrainingSupportOfficer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingSupportOfficer"
    ADD CONSTRAINT "AcademyTrainingSupportOfficer_pkey" PRIMARY KEY (id);


--
-- Name: AcademyTraining AcademyTraining_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTraining"
    ADD CONSTRAINT "AcademyTraining_pkey" PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AuthIdentity AuthIdentity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY (id);


--
-- Name: CharacterRole CharacterRole_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CharacterRole"
    ADD CONSTRAINT "CharacterRole_pkey" PRIMARY KEY ("characterId", "roleId");


--
-- Name: Character Character_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Character"
    ADD CONSTRAINT "Character_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintAssignment ComplaintAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintAssignment"
    ADD CONSTRAINT "ComplaintAssignment_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintEvent ComplaintEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintEvent"
    ADD CONSTRAINT "ComplaintEvent_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintEvidence ComplaintEvidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintEvidence"
    ADD CONSTRAINT "ComplaintEvidence_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintInternalNote ComplaintInternalNote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintInternalNote"
    ADD CONSTRAINT "ComplaintInternalNote_pkey" PRIMARY KEY (id);


--
-- Name: ComplaintMessage ComplaintMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintMessage"
    ADD CONSTRAINT "ComplaintMessage_pkey" PRIMARY KEY (id);


--
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY (id);


--
-- Name: Decoration Decoration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Decoration"
    ADD CONSTRAINT "Decoration_pkey" PRIMARY KEY (id);


--
-- Name: DivisionOpening DivisionOpening_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionOpening"
    ADD CONSTRAINT "DivisionOpening_pkey" PRIMARY KEY (id);


--
-- Name: DivisionSupervisor DivisionSupervisor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionSupervisor"
    ADD CONSTRAINT "DivisionSupervisor_pkey" PRIMARY KEY (id);


--
-- Name: Division Division_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Division"
    ADD CONSTRAINT "Division_pkey" PRIMARY KEY (id);


--
-- Name: GalleryItem GalleryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_pkey" PRIMARY KEY (id);


--
-- Name: InterestLetter InterestLetter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InterestLetter"
    ADD CONSTRAINT "InterestLetter_pkey" PRIMARY KEY (id);


--
-- Name: NewsArticle NewsArticle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NewsArticle"
    ADD CONSTRAINT "NewsArticle_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Occupation Occupation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Occupation"
    ADD CONSTRAINT "Occupation_pkey" PRIMARY KEY (id);


--
-- Name: OfficerDecoration OfficerDecoration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerDecoration"
    ADD CONSTRAINT "OfficerDecoration_pkey" PRIMARY KEY (id);


--
-- Name: OfficerProfile OfficerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerProfile"
    ADD CONSTRAINT "OfficerProfile_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Rank Rank_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rank"
    ADD CONSTRAINT "Rank_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: ReportEvidence ReportEvidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportEvidence"
    ADD CONSTRAINT "ReportEvidence_pkey" PRIMARY KEY (id);


--
-- Name: ReportParticipant ReportParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportParticipant"
    ADD CONSTRAINT "ReportParticipant_pkey" PRIMARY KEY (id);


--
-- Name: ReportTransfer ReportTransfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTransfer"
    ADD CONSTRAINT "ReportTransfer_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AcademyAnnouncement_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyAnnouncement_priority_idx" ON public."AcademyAnnouncement" USING btree (priority);


--
-- Name: AcademyAnnouncement_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyAnnouncement_publishedAt_idx" ON public."AcademyAnnouncement" USING btree ("publishedAt");


--
-- Name: AcademyApplication_characterId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyApplication_characterId_createdAt_idx" ON public."AcademyApplication" USING btree ("characterId", "createdAt");


--
-- Name: AcademyApplication_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyApplication_status_createdAt_idx" ON public."AcademyApplication" USING btree (status, "createdAt");


--
-- Name: AcademyApplication_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyApplication_type_status_idx" ON public."AcademyApplication" USING btree (type, status);


--
-- Name: AcademyTrainingAttendance_characterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTrainingAttendance_characterId_idx" ON public."AcademyTrainingAttendance" USING btree ("characterId");


--
-- Name: AcademyTrainingAttendance_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTrainingAttendance_status_idx" ON public."AcademyTrainingAttendance" USING btree (status);


--
-- Name: AcademyTrainingAttendance_trainingId_characterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AcademyTrainingAttendance_trainingId_characterId_key" ON public."AcademyTrainingAttendance" USING btree ("trainingId", "characterId");


--
-- Name: AcademyTrainingSupportOfficer_officerProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTrainingSupportOfficer_officerProfileId_idx" ON public."AcademyTrainingSupportOfficer" USING btree ("officerProfileId");


--
-- Name: AcademyTrainingSupportOfficer_trainingId_officerProfileId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AcademyTrainingSupportOfficer_trainingId_officerProfileId_key" ON public."AcademyTrainingSupportOfficer" USING btree ("trainingId", "officerProfileId");


--
-- Name: AcademyTraining_instructorCharacterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTraining_instructorCharacterId_idx" ON public."AcademyTraining" USING btree ("instructorCharacterId");


--
-- Name: AcademyTraining_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTraining_startsAt_idx" ON public."AcademyTraining" USING btree ("startsAt");


--
-- Name: AcademyTraining_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademyTraining_status_idx" ON public."AcademyTraining" USING btree (status);


--
-- Name: Account_activeCharacterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_activeCharacterId_key" ON public."Account" USING btree ("activeCharacterId");


--
-- Name: Account_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_email_key" ON public."Account" USING btree (email);


--
-- Name: Account_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_username_key" ON public."Account" USING btree (username);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_actorAccountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_actorAccountId_idx" ON public."AuditLog" USING btree ("actorAccountId");


--
-- Name: AuditLog_actorCharacterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_actorCharacterId_idx" ON public."AuditLog" USING btree ("actorCharacterId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_targetType_targetId_idx" ON public."AuditLog" USING btree ("targetType", "targetId");


--
-- Name: AuthIdentity_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuthIdentity_accountId_idx" ON public."AuthIdentity" USING btree ("accountId");


--
-- Name: AuthIdentity_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AuthIdentity_provider_providerAccountId_key" ON public."AuthIdentity" USING btree (provider, "providerAccountId");


--
-- Name: Character_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Character_accountId_idx" ON public."Character" USING btree ("accountId");


--
-- Name: Character_fivemCitizenId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Character_fivemCitizenId_key" ON public."Character" USING btree ("fivemCitizenId");


--
-- Name: Character_rankId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Character_rankId_idx" ON public."Character" USING btree ("rankId");


--
-- Name: Character_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Character_status_idx" ON public."Character" USING btree (status);


--
-- Name: ComplaintAssignment_characterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintAssignment_characterId_idx" ON public."ComplaintAssignment" USING btree ("characterId");


--
-- Name: ComplaintAssignment_complaintId_characterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ComplaintAssignment_complaintId_characterId_key" ON public."ComplaintAssignment" USING btree ("complaintId", "characterId");


--
-- Name: ComplaintEvent_complaintId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintEvent_complaintId_createdAt_idx" ON public."ComplaintEvent" USING btree ("complaintId", "createdAt");


--
-- Name: ComplaintEvidence_complaintId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintEvidence_complaintId_idx" ON public."ComplaintEvidence" USING btree ("complaintId");


--
-- Name: ComplaintInternalNote_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintInternalNote_authorId_idx" ON public."ComplaintInternalNote" USING btree ("authorId");


--
-- Name: ComplaintInternalNote_complaintId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintInternalNote_complaintId_createdAt_idx" ON public."ComplaintInternalNote" USING btree ("complaintId", "createdAt");


--
-- Name: ComplaintMessage_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintMessage_authorId_idx" ON public."ComplaintMessage" USING btree ("authorId");


--
-- Name: ComplaintMessage_complaintId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplaintMessage_complaintId_createdAt_idx" ON public."ComplaintMessage" USING btree ("complaintId", "createdAt");


--
-- Name: Complaint_accusedOfficerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Complaint_accusedOfficerId_idx" ON public."Complaint" USING btree ("accusedOfficerId");


--
-- Name: Complaint_caseNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Complaint_caseNumber_key" ON public."Complaint" USING btree ("caseNumber");


--
-- Name: Complaint_complainantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Complaint_complainantId_idx" ON public."Complaint" USING btree ("complainantId");


--
-- Name: Complaint_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Complaint_createdAt_idx" ON public."Complaint" USING btree ("createdAt");


--
-- Name: Complaint_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Complaint_status_idx" ON public."Complaint" USING btree (status);


--
-- Name: Decoration_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Decoration_name_key" ON public."Decoration" USING btree (name);


--
-- Name: DivisionOpening_divisionId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DivisionOpening_divisionId_status_idx" ON public."DivisionOpening" USING btree ("divisionId", status);


--
-- Name: DivisionOpening_minRankId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DivisionOpening_minRankId_idx" ON public."DivisionOpening" USING btree ("minRankId");


--
-- Name: DivisionSupervisor_divisionId_officerProfileId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DivisionSupervisor_divisionId_officerProfileId_key" ON public."DivisionSupervisor" USING btree ("divisionId", "officerProfileId");


--
-- Name: DivisionSupervisor_officerProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DivisionSupervisor_officerProfileId_idx" ON public."DivisionSupervisor" USING btree ("officerProfileId");


--
-- Name: Division_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Division_name_key" ON public."Division" USING btree (name);


--
-- Name: Division_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Division_slug_key" ON public."Division" USING btree (slug);


--
-- Name: GalleryItem_status_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GalleryItem_status_sortOrder_idx" ON public."GalleryItem" USING btree (status, "sortOrder");


--
-- Name: InterestLetter_divisionId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InterestLetter_divisionId_status_idx" ON public."InterestLetter" USING btree ("divisionId", status);


--
-- Name: InterestLetter_officerProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InterestLetter_officerProfileId_idx" ON public."InterestLetter" USING btree ("officerProfileId");


--
-- Name: InterestLetter_openingId_officerProfileId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InterestLetter_openingId_officerProfileId_key" ON public."InterestLetter" USING btree ("openingId", "officerProfileId");


--
-- Name: NewsArticle_authorCharacterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NewsArticle_authorCharacterId_idx" ON public."NewsArticle" USING btree ("authorCharacterId");


--
-- Name: NewsArticle_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NewsArticle_status_publishedAt_idx" ON public."NewsArticle" USING btree (status, "publishedAt");


--
-- Name: Notification_accountId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_accountId_isRead_createdAt_idx" ON public."Notification" USING btree ("accountId", "isRead", "createdAt");


--
-- Name: Notification_characterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_characterId_idx" ON public."Notification" USING btree ("characterId");


--
-- Name: Occupation_characterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Occupation_characterId_idx" ON public."Occupation" USING btree ("characterId");


--
-- Name: Occupation_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Occupation_isActive_idx" ON public."Occupation" USING btree ("isActive");


--
-- Name: Occupation_organization_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Occupation_organization_idx" ON public."Occupation" USING btree (organization);


--
-- Name: OfficerDecoration_decorationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OfficerDecoration_decorationId_idx" ON public."OfficerDecoration" USING btree ("decorationId");


--
-- Name: OfficerDecoration_officerProfileId_decorationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OfficerDecoration_officerProfileId_decorationId_key" ON public."OfficerDecoration" USING btree ("officerProfileId", "decorationId");


--
-- Name: OfficerProfile_badgeNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OfficerProfile_badgeNumber_key" ON public."OfficerProfile" USING btree ("badgeNumber");


--
-- Name: OfficerProfile_characterId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OfficerProfile_characterId_key" ON public."OfficerProfile" USING btree ("characterId");


--
-- Name: OfficerProfile_divisionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OfficerProfile_divisionId_idx" ON public."OfficerProfile" USING btree ("divisionId");


--
-- Name: OfficerProfile_rankId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OfficerProfile_rankId_idx" ON public."OfficerProfile" USING btree ("rankId");


--
-- Name: OfficerProfile_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OfficerProfile_status_idx" ON public."OfficerProfile" USING btree (status);


--
-- Name: Permission_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_key_key" ON public."Permission" USING btree (key);


--
-- Name: Rank_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Rank_name_key" ON public."Rank" USING btree (name);


--
-- Name: Rank_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Rank_slug_key" ON public."Rank" USING btree (slug);


--
-- Name: RefreshToken_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_accountId_idx" ON public."RefreshToken" USING btree ("accountId");


--
-- Name: RefreshToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_expiresAt_idx" ON public."RefreshToken" USING btree ("expiresAt");


--
-- Name: RefreshToken_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON public."RefreshToken" USING btree ("tokenHash");


--
-- Name: ReportEvidence_reportId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportEvidence_reportId_idx" ON public."ReportEvidence" USING btree ("reportId");


--
-- Name: ReportEvidence_uploadedByCharacterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportEvidence_uploadedByCharacterId_idx" ON public."ReportEvidence" USING btree ("uploadedByCharacterId");


--
-- Name: ReportParticipant_officerProfileId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportParticipant_officerProfileId_idx" ON public."ReportParticipant" USING btree ("officerProfileId");


--
-- Name: ReportParticipant_reportId_officerProfileId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReportParticipant_reportId_officerProfileId_key" ON public."ReportParticipant" USING btree ("reportId", "officerProfileId");


--
-- Name: ReportTransfer_fromDivisionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportTransfer_fromDivisionId_idx" ON public."ReportTransfer" USING btree ("fromDivisionId");


--
-- Name: ReportTransfer_reportId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportTransfer_reportId_createdAt_idx" ON public."ReportTransfer" USING btree ("reportId", "createdAt");


--
-- Name: ReportTransfer_toDivisionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportTransfer_toDivisionId_idx" ON public."ReportTransfer" USING btree ("toDivisionId");


--
-- Name: Report_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_createdAt_idx" ON public."Report" USING btree ("createdAt");


--
-- Name: Report_createdByCharacterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_createdByCharacterId_idx" ON public."Report" USING btree ("createdByCharacterId");


--
-- Name: Report_divisionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_divisionId_idx" ON public."Report" USING btree ("divisionId");


--
-- Name: Report_leadOfficerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_leadOfficerId_idx" ON public."Report" USING btree ("leadOfficerId");


--
-- Name: Report_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_priority_idx" ON public."Report" USING btree (priority);


--
-- Name: Report_reportNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Report_reportNumber_key" ON public."Report" USING btree ("reportNumber");


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_status_idx" ON public."Report" USING btree (status);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: Role_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_slug_key" ON public."Role" USING btree (slug);


--
-- Name: AcademyAnnouncement AcademyAnnouncement_authorCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyAnnouncement"
    ADD CONSTRAINT "AcademyAnnouncement_authorCharacterId_fkey" FOREIGN KEY ("authorCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademyApplication AcademyApplication_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyApplication"
    ADD CONSTRAINT "AcademyApplication_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademyApplication AcademyApplication_reviewedByCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyApplication"
    ADD CONSTRAINT "AcademyApplication_reviewedByCharacterId_fkey" FOREIGN KEY ("reviewedByCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AcademyTrainingAttendance AcademyTrainingAttendance_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingAttendance"
    ADD CONSTRAINT "AcademyTrainingAttendance_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademyTrainingAttendance AcademyTrainingAttendance_trainingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingAttendance"
    ADD CONSTRAINT "AcademyTrainingAttendance_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES public."AcademyTraining"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademyTrainingSupportOfficer AcademyTrainingSupportOfficer_officerProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingSupportOfficer"
    ADD CONSTRAINT "AcademyTrainingSupportOfficer_officerProfileId_fkey" FOREIGN KEY ("officerProfileId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademyTrainingSupportOfficer AcademyTrainingSupportOfficer_trainingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTrainingSupportOfficer"
    ADD CONSTRAINT "AcademyTrainingSupportOfficer_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES public."AcademyTraining"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademyTraining AcademyTraining_createdByCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTraining"
    ADD CONSTRAINT "AcademyTraining_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademyTraining AcademyTraining_instructorCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademyTraining"
    ADD CONSTRAINT "AcademyTraining_instructorCharacterId_fkey" FOREIGN KEY ("instructorCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Account Account_activeCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_activeCharacterId_fkey" FOREIGN KEY ("activeCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_actorAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_actorCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorCharacterId_fkey" FOREIGN KEY ("actorCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuthIdentity AuthIdentity_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuthIdentity"
    ADD CONSTRAINT "AuthIdentity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CharacterRole CharacterRole_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CharacterRole"
    ADD CONSTRAINT "CharacterRole_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CharacterRole CharacterRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CharacterRole"
    ADD CONSTRAINT "CharacterRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Character Character_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Character"
    ADD CONSTRAINT "Character_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Character Character_rankId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Character"
    ADD CONSTRAINT "Character_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES public."Rank"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ComplaintAssignment ComplaintAssignment_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintAssignment"
    ADD CONSTRAINT "ComplaintAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintAssignment ComplaintAssignment_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintAssignment"
    ADD CONSTRAINT "ComplaintAssignment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public."Complaint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintEvent ComplaintEvent_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintEvent"
    ADD CONSTRAINT "ComplaintEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ComplaintEvent ComplaintEvent_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintEvent"
    ADD CONSTRAINT "ComplaintEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public."Complaint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintEvidence ComplaintEvidence_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintEvidence"
    ADD CONSTRAINT "ComplaintEvidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public."Complaint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintInternalNote ComplaintInternalNote_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintInternalNote"
    ADD CONSTRAINT "ComplaintInternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComplaintInternalNote ComplaintInternalNote_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintInternalNote"
    ADD CONSTRAINT "ComplaintInternalNote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public."Complaint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ComplaintMessage ComplaintMessage_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintMessage"
    ADD CONSTRAINT "ComplaintMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComplaintMessage ComplaintMessage_complaintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplaintMessage"
    ADD CONSTRAINT "ComplaintMessage_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES public."Complaint"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Complaint Complaint_accusedOfficerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_accusedOfficerId_fkey" FOREIGN KEY ("accusedOfficerId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Complaint Complaint_complainantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DivisionOpening DivisionOpening_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionOpening"
    ADD CONSTRAINT "DivisionOpening_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DivisionOpening DivisionOpening_minRankId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionOpening"
    ADD CONSTRAINT "DivisionOpening_minRankId_fkey" FOREIGN KEY ("minRankId") REFERENCES public."Rank"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DivisionSupervisor DivisionSupervisor_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionSupervisor"
    ADD CONSTRAINT "DivisionSupervisor_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DivisionSupervisor DivisionSupervisor_officerProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DivisionSupervisor"
    ADD CONSTRAINT "DivisionSupervisor_officerProfileId_fkey" FOREIGN KEY ("officerProfileId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InterestLetter InterestLetter_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InterestLetter"
    ADD CONSTRAINT "InterestLetter_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InterestLetter InterestLetter_officerProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InterestLetter"
    ADD CONSTRAINT "InterestLetter_officerProfileId_fkey" FOREIGN KEY ("officerProfileId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InterestLetter InterestLetter_openingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InterestLetter"
    ADD CONSTRAINT "InterestLetter_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES public."DivisionOpening"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NewsArticle NewsArticle_authorCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NewsArticle"
    ADD CONSTRAINT "NewsArticle_authorCharacterId_fkey" FOREIGN KEY ("authorCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Occupation Occupation_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Occupation"
    ADD CONSTRAINT "Occupation_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfficerDecoration OfficerDecoration_decorationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerDecoration"
    ADD CONSTRAINT "OfficerDecoration_decorationId_fkey" FOREIGN KEY ("decorationId") REFERENCES public."Decoration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfficerDecoration OfficerDecoration_officerProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerDecoration"
    ADD CONSTRAINT "OfficerDecoration_officerProfileId_fkey" FOREIGN KEY ("officerProfileId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfficerProfile OfficerProfile_characterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerProfile"
    ADD CONSTRAINT "OfficerProfile_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfficerProfile OfficerProfile_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerProfile"
    ADD CONSTRAINT "OfficerProfile_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OfficerProfile OfficerProfile_rankId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OfficerProfile"
    ADD CONSTRAINT "OfficerProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES public."Rank"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RefreshToken RefreshToken_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportEvidence ReportEvidence_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportEvidence"
    ADD CONSTRAINT "ReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportEvidence ReportEvidence_uploadedByCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportEvidence"
    ADD CONSTRAINT "ReportEvidence_uploadedByCharacterId_fkey" FOREIGN KEY ("uploadedByCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReportParticipant ReportParticipant_officerProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportParticipant"
    ADD CONSTRAINT "ReportParticipant_officerProfileId_fkey" FOREIGN KEY ("officerProfileId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportParticipant ReportParticipant_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportParticipant"
    ADD CONSTRAINT "ReportParticipant_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportTransfer ReportTransfer_fromDivisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTransfer"
    ADD CONSTRAINT "ReportTransfer_fromDivisionId_fkey" FOREIGN KEY ("fromDivisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReportTransfer ReportTransfer_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTransfer"
    ADD CONSTRAINT "ReportTransfer_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportTransfer ReportTransfer_toDivisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTransfer"
    ADD CONSTRAINT "ReportTransfer_toDivisionId_fkey" FOREIGN KEY ("toDivisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReportTransfer ReportTransfer_transferredByCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTransfer"
    ADD CONSTRAINT "ReportTransfer_transferredByCharacterId_fkey" FOREIGN KEY ("transferredByCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_createdByCharacterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES public."Character"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_divisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES public."Division"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_leadOfficerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_leadOfficerId_fkey" FOREIGN KEY ("leadOfficerId") REFERENCES public."OfficerProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict INbrKBppppXJSfShCALTxHFaWGypAb7YFIyXxqO5dV46PNEr5PRe2B56RPCsISt

