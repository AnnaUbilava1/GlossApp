import { apiFetch } from "../utils/api";
import type { User, UserRole } from "../utils/types";

type ApiUser = User & {
  createdAt?: string;
};

type CreateUserPayload = {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
};

export async function getAllUsers(token: string): Promise<ApiUser[]> {
  const res = await apiFetch<{ users: ApiUser[] }>("/api/users", {
    token,
    method: "GET",
  });
  return res.users ?? [];
}

export async function createUser(
  token: string,
  data: CreateUserPayload
): Promise<ApiUser> {
  const res = await apiFetch<{ user: ApiUser }>("/api/users", {
    token,
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.user;
}

export async function resetUserPassword(
  token: string,
  userId: string,
  newPassword: string,
  masterPin: string
): Promise<void> {
  await apiFetch<unknown>(`/api/users/${userId}/password`, {
    token,
    method: "PUT",
    body: JSON.stringify({
      newPassword,
      masterPin,
    }),
  });
}

export async function deleteUser(
  token: string,
  userId: string,
  masterPin: string
): Promise<void> {
  await apiFetch<unknown>(`/api/users/${userId}`, {
    token,
    method: "DELETE",
    body: JSON.stringify({
      masterPin,
    }),
  });
}

