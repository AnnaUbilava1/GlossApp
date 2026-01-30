import { apiFetch } from "../utils/api";

export type Discount = {
  id: string;
  companyId: string | null;
  companyName: string;
  percentage: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DiscountsResponse = {
  discounts: Discount[];
};

export type UpdateDiscountPayload = {
  active?: boolean;
  percentage?: number;
};

/**
 * Fetch all discounts (admin only)
 */
export async function getAllDiscounts(token: string): Promise<Discount[]> {
  const response = await apiFetch<DiscountsResponse>("/api/discount-options/list", {
    method: "GET",
    token,
  });
  return response.discounts;
}

/**
 * Update a discount
 */
export async function updateDiscount(token: string, discountId: string, data: UpdateDiscountPayload): Promise<Discount> {
  const response = await apiFetch<{ discount: Discount }>(`/api/discount-options/${discountId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });
  return response.discount;
}

/**
 * Delete a discount
 */
export async function deleteDiscount(token: string, discountId: string, masterPin: string): Promise<void> {
  await apiFetch(`/api/discount-options/${discountId}`, {
    method: "DELETE",
    body: JSON.stringify({ masterPin }),
    token,
  });
}
