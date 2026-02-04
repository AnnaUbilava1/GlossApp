import { apiFetch } from "../utils/api";

export type TypeConfig = {
  id: string;
  code: string;
  displayNameKa: string;
  displayNameEn: string;
  isActive: boolean;
  sortOrder: number;
  /** True if used by any vehicle, record, or pricing (admin types page only). Delete is blocked when true. */
  inUse?: boolean;
};

type ListResponse = {
  types: TypeConfig[];
};

export async function getCarTypeConfigs(token: string): Promise<TypeConfig[]> {
  const res = await apiFetch<ListResponse>("/api/types/car", {
    method: "GET",
    token,
  });
  return res.types;
}

export async function getWashTypeConfigs(token: string): Promise<TypeConfig[]> {
  const res = await apiFetch<ListResponse>("/api/types/wash", {
    method: "GET",
    token,
  });
  return res.types;
}

type UpsertPayload = {
  code?: string;
  displayNameKa?: string;
  displayNameEn?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export async function createCarTypeConfig(
  token: string,
  masterPin: string,
  payload: Required<Pick<UpsertPayload, "code" | "displayNameKa" | "displayNameEn">> &
    Omit<UpsertPayload, "code" | "displayNameKa" | "displayNameEn">
): Promise<TypeConfig> {
  const res = await apiFetch<{ type: TypeConfig }>("/api/types/car", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, masterPin }),
  });
  return res.type;
}

export async function createWashTypeConfig(
  token: string,
  masterPin: string,
  payload: Required<Pick<UpsertPayload, "code" | "displayNameKa" | "displayNameEn">> &
    Omit<UpsertPayload, "code" | "displayNameKa" | "displayNameEn">
): Promise<TypeConfig> {
  const res = await apiFetch<{ type: TypeConfig }>("/api/types/wash", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, masterPin }),
  });
  return res.type;
}

export async function updateCarTypeConfig(
  token: string,
  id: string,
  masterPin: string,
  payload: UpsertPayload
): Promise<TypeConfig> {
  const res = await apiFetch<{ type: TypeConfig }>(`/api/types/car/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, masterPin }),
  });
  return res.type;
}

export async function updateWashTypeConfig(
  token: string,
  id: string,
  masterPin: string,
  payload: UpsertPayload
): Promise<TypeConfig> {
  const res = await apiFetch<{ type: TypeConfig }>(`/api/types/wash/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, masterPin }),
  });
  return res.type;
}

export async function deleteCarTypeConfig(
  token: string,
  id: string,
  masterPin: string
): Promise<void> {
  await apiFetch(`/api/types/car/${id}`, {
    method: "DELETE",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ masterPin }),
  });
}

export async function deleteWashTypeConfig(
  token: string,
  id: string,
  masterPin: string
): Promise<void> {
  await apiFetch(`/api/types/wash/${id}`, {
    method: "DELETE",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ masterPin }),
  });
}


