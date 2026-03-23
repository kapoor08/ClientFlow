export type TeamMemberItem = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  roleKey: string;
  roleName: string;
  status: string;
  joinedAt: string | null;
  projectCount: number;
};

export type AssignableRole = {
  id: string;
  key: string;
  name: string;
};

export type TeamAccess = {
  canManage: boolean;
  roleKey: string | null;
  currentUserId: string;
};

export type TeamListResponse = {
  access: TeamAccess;
  members: TeamMemberItem[];
  assignableRoles: AssignableRole[];
};
