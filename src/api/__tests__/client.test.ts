import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, healthCheck } from "../client";

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("healthCheck", () => {
    it("should successfully call the health endpoint", async () => {
      const mockResponse = {
        data: { status: "healthy", service: "HOLIDAY" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as unknown,
      };

      // Mock the axios instance's get method
      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await healthCheck();

      expect(apiClient.get).toHaveBeenCalledWith("/health");
      expect(result).toEqual({ status: "healthy", service: "HOLIDAY" });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      vi.spyOn(apiClient, "get").mockRejectedValue(networkError);

      await expect(healthCheck()).rejects.toThrow("Network Error");
    });

    it("should handle API errors", async () => {
      const apiError = {
        response: {
          status: 500,
          statusText: "Internal Server Error",
          data: {
            error: { message: "Internal Server Error", code: "INTERNAL_ERROR" },
          },
          headers: {},
          config: {} as unknown,
        },
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 500",
      };
      vi.spyOn(apiClient, "get").mockRejectedValue(apiError);

      await expect(healthCheck()).rejects.toEqual(apiError);
    });
  });
});
