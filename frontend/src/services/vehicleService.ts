import { apiFetch } from "../utils/api";

export type VehicleSearchResult = {
  id: string;
  licensePlate: string;
  carCategory: string;
};

export type Vehicle = {
  id: string;
  licensePlate: string;
  carCategory: string;
  createdAt: string;
};

export type VehiclesResponse = {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** carType: schema code from admin types (e.g. SEDAN, VAN) or legacy name for backward compat */
export type CreateVehiclePayload = {
  licensePlate: string;
  carType: string;
};

export type UpdateVehiclePayload = {
  licensePlate?: string;
  carType?: string;
};

/**
 * Search vehicles by license plate (for autocomplete)
 */
export async function searchVehicles(token: string, search: string): Promise<VehicleSearchResult[]> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }

  const res = await apiFetch<{ vehicles: VehicleSearchResult[] }>(
    `/api/vehicles?${params.toString()}`,
    {
      token,
      method: "GET",
    }
  );

  return res.vehicles ?? [];
}

/**
 * List all vehicles (admin only, with pagination)
 */
export async function getAllVehicles(
  token: string,
  search?: string,
  page: number = 1,
  limit: number = 50
): Promise<VehiclesResponse> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  const response = await apiFetch<VehiclesResponse>(`/api/vehicles/list?${params.toString()}`, {
    method: "GET",
    token,
  });
  return response;
}

/**
 * Create a new vehicle
 */
export async function createVehicle(token: string, data: CreateVehiclePayload): Promise<Vehicle> {
  const response = await apiFetch<{ vehicle: Vehicle }>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
  return response.vehicle;
}

/**
 * Update a vehicle
 */
export async function updateVehicle(token: string, vehicleId: string, data: UpdateVehiclePayload): Promise<Vehicle> {
  const response = await apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${vehicleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return response.vehicle;
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(token: string, vehicleId: string, masterPin: string): Promise<void> {
  await apiFetch(`/api/vehicles/${vehicleId}`, {
    method: "DELETE",
    body: JSON.stringify({ masterPin }),
    token,
  });
}
