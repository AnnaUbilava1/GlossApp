import { apiFetch } from "../utils/api";

export type CompanyDiscount = {
  id: string;
  percentage: number;
  active: boolean;
};

export type Company = {
  id: string;
  name: string;
  contact: string;
  discounts: CompanyDiscount[];
  createdAt: string;
  updatedAt: string;
};

export type CompaniesResponse = {
  companies: Company[];
};

export type CreateCompanyPayload = {
  name: string;
  contact: string;
  discountPercentages?: number[];
};

export type UpdateCompanyPayload = {
  name?: string;
  contact?: string;
  discountPercentages?: number[];
};

/**
 * Fetch all companies
 */
export async function getAllCompanies(token: string): Promise<Company[]> {
  const response = await apiFetch<CompaniesResponse>("/api/companies", {
    method: "GET",
    token,
  });
  return response.companies;
}

/**
 * Create a new company
 */
export async function createCompany(token: string, data: CreateCompanyPayload): Promise<Company> {
  const response = await apiFetch<{ company: Company }>("/api/companies", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
  return response.company;
}

/**
 * Update a company
 */
export async function updateCompany(token: string, companyId: string, data: UpdateCompanyPayload): Promise<Company> {
  const response = await apiFetch<{ company: Company }>(`/api/companies/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return response.company;
}

/**
 * Delete a company
 */
export async function deleteCompany(token: string, companyId: string, masterPin: string): Promise<void> {
  await apiFetch(`/api/companies/${companyId}`, {
    method: "DELETE",
    body: JSON.stringify({ masterPin }),
    token,
  });
}
