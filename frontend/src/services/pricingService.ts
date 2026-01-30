import { apiFetch } from "../utils/api";

export type PricingMatrix = {
  [carType: string]: {
    [serviceType: string]: number;
  };
};

export type PricingMatrixResponse = {
  matrix: PricingMatrix;
};

/**
 * Fetch the full pricing matrix from the backend
 */
export async function getPricingMatrix(token: string): Promise<PricingMatrix> {
  const response = await apiFetch<PricingMatrixResponse>("/api/pricing", {
    method: "GET",
    token,
  });
  return response.matrix;
}

/**
 * Update the pricing matrix
 */
export async function updatePricingMatrix(
  token: string,
  matrix: PricingMatrix
): Promise<void> {
  console.log("updatePricingMatrix called with:", matrix);
  try {
    const response = await apiFetch("/api/pricing", {
      method: "PUT",
      body: JSON.stringify({ matrix }),
      headers: {
        "Content-Type": "application/json",
      },
      token,
    });
    console.log("updatePricingMatrix response:", response);
    return response;
  } catch (error) {
    console.error("updatePricingMatrix error:", error);
    throw error;
  }
}
