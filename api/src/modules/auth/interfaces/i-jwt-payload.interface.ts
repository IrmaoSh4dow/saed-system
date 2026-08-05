export interface IJwtPayload {
  sub: string;
  characterId: string | null;
  roles: string[];
  permissions: string[];
  type: 'access';
}
