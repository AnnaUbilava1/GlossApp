import { apiFetch } from "../utils/api";

export type Washer = {
  id: number;
  username: string;
  name: string | null;
  surname: string | null;
  contact: string | null;
  active: boolean;
  salaryPercentage: number;
};

export type WashersResponse = {
  washers: Washer[];
};

export type CreateWasherPayload = {
  username: string;
  name?: string;
  surname?: string;
  contact?: string;
  salaryPercentage?: number;
};

export type UpdateWasherPayload = {
  name?: string;
  surname?: string;
  contact?: string;
  active?: boolean;
  salaryPercentage?: number;
};

/**
 * Fetch all washers (admin sees all, staff sees only active)
 */
export async function getAllWashers(token: string, includeInactive: boolean = false): Promise<Washer[]> {
  const params = includeInactive ? "?includeInactive=true" : "";
  const response = await apiFetch<WashersResponse>(`/api/washers${params}`, {
    method: "GET",
    token,
  });
  return response.washers;
}

/**
 * Create a new washer
 */
export async function createWasher(token: string, data: CreateWasherPayload): Promise<Washer> {
  const response = await apiFetch<{ washer: Washer }>("/api/washers", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
  return response.washer;
}

/**
 * Update a washer
 */
export async function updateWasher(token: string, washerId: number, data: UpdateWasherPayload): Promise<Washer> {
  const response = await apiFetch<{ washer: Washer }>(`/api/washers/${washerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return response.washer;
}

/**
 * Delete a washer
 */
export async function deleteWasher(token: string, washerId: number, masterPin: string): Promise<void> {
  await apiFetch(`/api/washers/${washerId}`, {
    method: "DELETE",
    body: JSON.stringify({ masterPin }),
    token,
  });
}
