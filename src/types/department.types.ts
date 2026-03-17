export interface Department {
  id: string;
  name: string;
  slug: string;
  orgId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    reports: number;
  };
}

export interface DepartmentWithStats extends Department {
  memberCount: number;
  reportCount: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
}

export interface CreateDepartmentInput {
  name: string;
  slug?: string;
  isDefault?: boolean;
}

export interface UpdateDepartmentInput {
  name?: string;
  slug?: string;
}

export interface DepartmentMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "ADMIN" | "MEMBER";
  assignedReports: number;
  completedReports: number;
}

// Default departments for organizations
export const DEFAULT_DEPARTMENTS = [
  { name: "Ventas", slug: "ventas" },
  { name: "Recursos Humanos", slug: "recursos-humanos" },
  { name: "Finanzas", slug: "finanzas" },
  { name: "Operaciones", slug: "operaciones" },
  { name: "Marketing", slug: "marketing" },
  { name: "Control Interno", slug: "control-interno" },
  { name: "Legal", slug: "legal" },
  { name: "Tecnología", slug: "tecnologia" },
  { name: "Administración", slug: "administracion" },
  { name: "General", slug: "general", isDefault: true },
];
