import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { useErrorHandler } from "../useErrorHandler";

// Mock useToast
const mockShowError = vi.fn();
const mockShowCustom = vi.fn();
vi.mock("../useToast", () => ({
  useToast: () => ({
    showError: mockShowError,
    showCustom: mockShowCustom,
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// Mock RateLimitNotification component
vi.mock("../../components/common/RateLimitNotification", () => ({
  RateLimitNotification: vi.fn(),
}));

function makeAxiosError(
  status: number,
  data?: unknown,
  code?: string,
): AxiosError {
  const error = new AxiosError("request failed", code);
  error.response = {
    status,
    statusText: "Error",
    data: data ?? {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  error.request = {};
  return error;
}

function makeNetworkError(code?: string): AxiosError {
  const error = new AxiosError(
    code === "ECONNABORTED" ? "timeout of 10000ms exceeded" : "Network Error",
    code,
  );
  error.request = {};
  return error;
}

describe("useErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles 429 rate limit with custom notification", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeAxiosError(429, {
      error: { message: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
    });

    const msg = result.current.handleError(error);

    expect(msg).toBe("Too many requests");
    expect(mockShowCustom).toHaveBeenCalledTimes(1);
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles 429 with showRateLimitNotification=false", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeAxiosError(429, {
      error: { message: "Rate limited", code: "RATE_LIMIT_EXCEEDED" },
    });

    const msg = result.current.handleError(error, undefined, {
      showRateLimitNotification: false,
    });

    expect(msg).toBe("Rate limited");
    expect(mockShowError).toHaveBeenCalledWith("Rate limited");
    expect(mockShowCustom).not.toHaveBeenCalled();
  });

  it("handles API error with message from response body", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeAxiosError(400, {
      error: { message: "Invalid CTXDSL syntax", code: "PARSE_ERROR" },
    });

    const msg = result.current.handleError(error);

    expect(msg).toBe("Invalid CTXDSL syntax");
    expect(mockShowError).toHaveBeenCalledWith("Invalid CTXDSL syntax");
  });

  it("uses status code message when no error body", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeAxiosError(500);

    const msg = result.current.handleError(error);

    expect(msg).toBe("Server error. Please try again later.");
    expect(mockShowError).toHaveBeenCalledWith(
      "Server error. Please try again later.",
    );
  });

  it("handles 404", () => {
    const { result } = renderHook(() => useErrorHandler());
    const msg = result.current.handleError(makeAxiosError(404));
    expect(msg).toBe("The requested resource was not found.");
  });

  it("handles unknown status codes", () => {
    const { result } = renderHook(() => useErrorHandler());
    const msg = result.current.handleError(makeAxiosError(418));
    expect(msg).toBe("Request failed with status 418");
  });

  it("handles timeout errors", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeNetworkError("ECONNABORTED");

    const msg = result.current.handleError(error);

    expect(msg).toContain("timeout");
  });

  it("handles network errors", () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = makeNetworkError();

    const msg = result.current.handleError(error);

    expect(msg).toContain("Network error");
    expect(mockShowError).toHaveBeenCalled();
  });

  it("handles plain Error instances", () => {
    const { result } = renderHook(() => useErrorHandler());
    const msg = result.current.handleError(new Error("Something broke"));

    expect(msg).toBe("Something broke");
    expect(mockShowError).toHaveBeenCalledWith("Something broke");
  });

  it("uses defaultMessage for unknown error types", () => {
    const { result } = renderHook(() => useErrorHandler());
    const msg = result.current.handleError("raw string", "Fallback message");

    expect(msg).toBe("Fallback message");
    expect(mockShowError).toHaveBeenCalledWith("Fallback message");
  });

  it("uses generic message when no default provided for unknown errors", () => {
    const { result } = renderHook(() => useErrorHandler());
    const msg = result.current.handleError(null);

    expect(msg).toBe("An unexpected error occurred");
  });

  it("exports isRateLimitError utility", () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(typeof result.current.isRateLimitError).toBe("function");
  });
});
