export type Department = {
  id: string;
  name: string;
  managerUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListDepartmentsResponse = {
  departments: Department[];
};
