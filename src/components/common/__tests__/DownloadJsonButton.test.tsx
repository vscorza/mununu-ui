import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DownloadJsonButton } from "../DownloadJsonButton";
import * as endpoints from "../../../api/endpoints";

vi.mock("../../../api/endpoints", async () => {
  const actual = await vi.importActual<typeof import("../../../api/endpoints")>(
    "../../../api/endpoints",
  );
  return { ...actual, downloadAsFile: vi.fn() };
});

describe("DownloadJsonButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializes data to pretty JSON and downloads it on click", () => {
    const mocked = vi.mocked(endpoints.downloadAsFile);
    render(
      <DownloadJsonButton
        data={{ a: 1, b: ["x", "y"] }}
        filename="thing.json"
        label="Download JSON"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Download JSON/i }));

    expect(mocked).toHaveBeenCalledTimes(1);
    const call = mocked.mock.calls[0]!;
    const content = call[0] as string;
    expect(call[1]).toBe("thing.json");
    expect(call[2]).toBe("application/json");
    // Round-trips the data...
    expect(JSON.parse(content)).toEqual({ a: 1, b: ["x", "y"] });
    // ...and is pretty-printed (2-space indent).
    expect(content).toContain('\n  "a": 1');
  });

  it("renders the default label when none is supplied", () => {
    render(<DownloadJsonButton data={{}} filename="x.json" />);
    expect(
      screen.getByRole("button", { name: /Download JSON/i }),
    ).toBeInTheDocument();
  });
});
