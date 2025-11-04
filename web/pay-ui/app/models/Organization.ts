import type { Contact } from './contact'

export interface Organization {
  id?: number
}

export interface Organizations {
  orgs: Organization[]
}

export interface PADInfo {
  bankAccountNumber: string
  bankInstitutionNumber: string
  bankTransitNumber: string
  isTOSAccepted?: boolean
  isAcknowledged?: boolean
}

export interface CFSAccountDetails {
  bankAccountNumber: string
  bankInstitutionNumber: string
  bankTransitNumber: string
  cfsAccountNumber: string
  cfsPartyNumber: string
  cfsSiteNumber: string
  status: string
}

export interface GLInfo {
  client: string
  responsibilityCentre: string
  serviceLine: string
  stob: string
  projectCode: string
}

export interface OrgPaymentDetails {
  accountId: string
  accountName: string
  bcolAccount: string
  bcolUserId: string
  cfsAccount: CFSAccountDetails
  obCredit: string
  padCredit: string
  paymentMethod: string
  statementNotificationEnabled: true
  padTosAcceptedBy: string
  padTosAcceptedDate: string
  futurePaymentMethod: string
  revenueAccount?: GLInfo
  eftEnable?: boolean
}

export interface RoleInfo {
  icon: string
  name: string
  desc: string
  displayName: string
  displayOrder: number
  label: string
}

export interface AddUserBody {
  username: string
  password: string
  selectedRole?: RoleInfo
  membershipType: string
}

export interface AddUsersToOrgBody {
  users: AddUserBody[]
  orgId: string
}

export interface BulkUserResponse {
  httpStatus: number
  username: string
  created?: string
  error?: string
  firstname?: string
  type?: string
}

export interface BulkUserResponseBody {
  users: BulkUserResponse[]
}

export enum MembershipStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Rejected = 'REJECTED',
  Pending = 'PENDING_APPROVAL',
  PendingStaffReview = 'PENDING_STAFF_REVIEW'
}

export enum MembershipType {
  Admin = 'ADMIN',
  Coordinator = 'COORDINATOR',
  User = 'USER',
  Staff = 'STAFF',
  ExternalStaff = 'EXTERNAL_STAFF'
}

export interface UserTerms {
  isTermsOfUseAccepted: boolean
  termsOfUseAcceptedVersion: string
}

export interface User {
  firstname: string
  lastname: string
  username?: string
  modified?: Date
  userTerms?: UserTerms
  contacts?: Contact[]
  email?: string
  loginSource?: string
  id?: number
  keycloakGuid?: string
  verified?: boolean
}

export interface Member {
  id: number
  membershipTypeCode: MembershipType
  membershipStatus: MembershipStatus
  roleDisplayName?: string
  user: User
}
