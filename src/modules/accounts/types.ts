export const accountKinds = ['personal', 'organization'] as const;
export type AccountKind = (typeof accountKinds)[number];

export const accountStatuses = ['active', 'suspended', 'closed'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const membershipRoles = ['owner', 'admin', 'member'] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  status: AccountStatus;
};

export type Membership = {
  accountId: string;
  userId: string;
  role: MembershipRole;
};

export const canManageMembers = (role: MembershipRole) => role === 'owner' || role === 'admin';
