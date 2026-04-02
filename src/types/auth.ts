export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  role: UserRole;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInResponse = {
  token: string;
  user: AuthUser;
};

export type SessionProfileResponse = {
  userId: string;
  departmentId: string;
  role: UserRole;
};
