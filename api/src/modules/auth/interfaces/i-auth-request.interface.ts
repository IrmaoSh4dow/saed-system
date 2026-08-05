export interface IAuthAccount {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  status: string;
  activeCharacterId: string | null;
}

export interface IAuthCharacter {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  permissions: string[];
  birthDate?: string | null;
  sex?: string | null;
  nationality?: string | null;
  avatarUrl?: string | null;
  rankLabel?: string | null;
  rank?: { id: string; name: string; slug: string } | null;
  fivemCitizenId?: string | null;
  joinedAt?: string | null;
}

export interface IAuthRequestUser {
  account: IAuthAccount;
  character: IAuthCharacter | null;
  permissions: string[];
}
