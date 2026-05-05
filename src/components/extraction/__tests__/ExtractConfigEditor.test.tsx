import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExtractConfigEditor } from "../ExtractConfigEditor";

describe("ExtractConfigEditor", () => {
  it("renders the textarea with the extract-config aria label", () => {
    render(<ExtractConfigEditor content={null} onChange={() => {}} />);
    expect(screen.getByLabelText("Extract config JSON")).toBeInTheDocument();
  });

  it("offers a 'Start from template' button when content is empty", () => {
    const onChange = vi.fn();
    render(
      <ExtractConfigEditor
        content={null}
        onChange={onChange}
        sourceFileName="parallel_workers.ts"
      />,
    );
    fireEvent.click(
      screen.getByLabelText("Start from a default extract-config template"),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const written = JSON.parse(onChange.mock.calls[0][0] as string);
    expect(written.source.file).toBe("parallel_workers.ts");
    expect(written.language).toBe("typescript");
    expect(Array.isArray(written.targets)).toBe(true);
    expect(written.targets.length).toBeGreaterThan(0);
    expect(written.composition).toBeUndefined();
  });

  it("template embeds the composition block when compositionConfig is set", () => {
    const onChange = vi.fn();
    const compositionConfig = JSON.stringify({
      type: "asynchronous",
      name: "race",
      instances: [{ of: "Worker", as: "worker_a" }],
      shared: [],
    });
    render(
      <ExtractConfigEditor
        content={null}
        onChange={onChange}
        sourceFileName="parallel_workers.ts"
        compositionConfig={compositionConfig}
      />,
    );
    fireEvent.click(
      screen.getByLabelText("Start from a default extract-config template"),
    );
    const written = JSON.parse(onChange.mock.calls[0][0] as string);
    expect(written.composition).toEqual(JSON.parse(compositionConfig));
  });

  it("infers Python from .py extension", () => {
    const onChange = vi.fn();
    render(
      <ExtractConfigEditor
        content={null}
        onChange={onChange}
        sourceFileName="server.py"
      />,
    );
    fireEvent.click(
      screen.getByLabelText("Start from a default extract-config template"),
    );
    const written = JSON.parse(onChange.mock.calls[0][0] as string);
    expect(written.language).toBe("python");
  });

  it("hides the template button once content is non-empty", () => {
    render(
      <ExtractConfigEditor
        content='{"source":{"file":"x.ts"},"targets":[{"class":"X"}]}'
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByLabelText("Start from a default extract-config template"),
    ).not.toBeInTheDocument();
  });

  it("shows a validation error for invalid JSON", () => {
    render(<ExtractConfigEditor content="{ not valid" onChange={() => {}} />);
    expect(screen.getByText(/JSON parse error/)).toBeInTheDocument();
  });

  it("requires a non-empty source.file", () => {
    render(
      <ExtractConfigEditor
        content='{"targets":[{"class":"X"}]}'
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/`source` is required/)).toBeInTheDocument();
  });

  it("requires a non-empty targets array", () => {
    render(
      <ExtractConfigEditor
        content='{"source":{"file":"x.ts"},"targets":[]}'
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/`targets` must contain at least one entry/)).toBeInTheDocument();
  });

  it("shows the success summary for a valid config", () => {
    const json = JSON.stringify({
      source: { file: "parallel_workers.ts" },
      language: "typescript",
      targets: [{ class: "Worker" }],
      composition: {
        name: "two_writer_race",
        instances: [
          { of: "Worker", as: "worker_a" },
          { of: "Worker", as: "worker_b" },
        ],
      },
    });
    render(<ExtractConfigEditor content={json} onChange={() => {}} />);
    expect(screen.getByText("Valid extract config")).toBeInTheDocument();
    const summary = screen.getByText("Valid extract config").parentElement;
    expect(summary?.textContent).toContain("parallel_workers.ts");
    expect(summary?.textContent).toContain("two_writer_race");
    expect(summary?.textContent).toContain("2 instance");
  });

  it("Sync composition button merges compositionConfig into the extract config", () => {
    const onChange = vi.fn();
    const compositionConfig = JSON.stringify({
      type: "asynchronous",
      name: "race",
      instances: [{ of: "Worker", as: "worker_a" }],
      shared: ["ev_commit"],
    });
    const initialExtract = JSON.stringify({
      source: { file: "x.ts" },
      language: "typescript",
      targets: [{ class: "Worker" }],
    });
    render(
      <ExtractConfigEditor
        content={initialExtract}
        onChange={onChange}
        sourceFileName="x.ts"
        compositionConfig={compositionConfig}
      />,
    );
    fireEvent.click(screen.getByLabelText("Sync composition from compose step"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const written = JSON.parse(onChange.mock.calls[0][0] as string);
    expect(written.composition).toEqual(JSON.parse(compositionConfig));
    expect(written.targets).toEqual([{ class: "Worker" }]);
    expect(screen.getByText(/Composition synced/)).toBeInTheDocument();
  });

  it("Sync composition flashes 'empty' when compositionConfig is missing", () => {
    render(
      <ExtractConfigEditor
        content='{"source":{"file":"x.ts"},"targets":[{"class":"X"}]}'
        onChange={vi.fn()}
        sourceFileName="x.ts"
      />,
    );
    fireEvent.click(screen.getByLabelText("Sync composition from compose step"));
    expect(screen.getByText(/Compose step is empty/)).toBeInTheDocument();
  });
});
