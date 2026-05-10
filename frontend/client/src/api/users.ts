import type { RoleOption, UserManagementItem } from '../domain/types';
import { authRequest } from './client';

export async function fetchUsers(token: string) {
  return authRequest<{ users: UserManagementItem[]; roles: RoleOption[] }>('/api/users', token);
}

export async function updateUserRole(token: string, userId: number, roleId: number) {
  return authRequest<{ message: string }>(`/api/users/${userId}/role`, token, {
    method: 'PATCH',
    body: JSON.stringify({ roleId }),
  });
}
