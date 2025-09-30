export interface Contact {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ListResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
