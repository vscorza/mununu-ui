import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompositionEditor } from "../CompositionEditor";
import * as endpoints from "../../../api/endpoints";

describe("CompositionEditor", () => {
  it("renders a textarea and the wiki-link help text", () => {
    render(<CompositionEditor content={null} onChange={() => {}} />);
    expect(screen.getByLabelText("Composition config JSON")).toBeInTheDocument();
    expect(screen.getByText(/Compositional Extraction wiki/)).toBeInTheDocument();
  });

  it("offers a 'Start from template' button when content is empty", () => {
    const onChange = vi.fn();
    render(<CompositionEditor content={null} onChange={onChange} />);
    const btn = screen.getByLabelText(
      "Start from a 2-instance race-detection template",
    );
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledTimes(1);
    const written = onChange.mock.calls[0][0] as string;
    const parsed = JSON.parse(written);
    expect(parsed.type).toBe("asynchronous");
    expect(parsed.instances).toHaveLength(2);
    expect(parsed.shared).toEqual(["ev_save"]);
  });

  it("hides the template button once content is non-empty", () => {
    render(
      <CompositionEditor
        content='{"type":"asynchronous","name":"r","instances":[]}'
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByLabelText("Start from a 2-instance race-detection template"),
    ).not.toBeInTheDocument();
  });

  it("shows a validation error for invalid JSON", () => {
    render(<CompositionEditor content="{ not valid json" onChange={() => {}} />);
    expect(screen.getByText(/JSON parse error/)).toBeInTheDocument();
  });

  it("shows a validation error for invalid type field", () => {
    render(
      <CompositionEditor
        content='{"type":"bogus","name":"r"}'
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByText(/must be "asynchronous" or "synchronous"/),
    ).toBeInTheDocument();
  });

  it("shows a validation error for malformed instances", () => {
    render(
      <CompositionEditor
        content='{"type":"asynchronous","name":"r","instances":[{"of":""}]}'
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/instances\[0\]/)).toBeInTheDocument();
  });

  it("shows the success summary for a valid composition", () => {
    const json = JSON.stringify({
      type: "asynchronous",
      name: "memory_write_race",
      instances: [
        { of: "Worker", as: "worker_a" },
        { of: "Worker", as: "worker_b" },
      ],
      shared: ["ev_save"],
    });
    render(<CompositionEditor content={json} onChange={() => {}} />);
    expect(screen.getByText("Valid composition")).toBeInTheDocument();
    // Summary fields appear as plain text inside the green panel; the
    // textarea also contains "asynchronous" / "memory_write_race", so
    // these substring checks need uniqueness elsewhere — assert via
    // structural queries rather than text-only.
    expect(screen.getByText(/worker_a \(of Worker\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/worker_b \(of Worker\)/),
    ).toBeInTheDocument();
    // Shared-labels summary line includes "ev_save".
    const summary = screen.getByText("Valid composition").parentElement;
    expect(summary?.textContent).toContain("ev_save");
    expect(summary?.textContent).toContain("asynchronous");
    expect(summary?.textContent).toContain("memory_write_race");
  });

  it("communicates 'no synchronization' when shared is empty", () => {
    const json = JSON.stringify({
      type: "asynchronous",
      name: "independents",
      instances: [
        { of: "Worker", as: "worker_a" },
        { of: "Worker", as: "worker_b" },
      ],
      shared: [],
    });
    render(<CompositionEditor content={json} onChange={() => {}} />);
    expect(
      screen.getByText(/full async, no synchronization/),
    ).toBeInTheDocument();
  });

  it("calls onChange when the textarea is edited", () => {
    const onChange = vi.fn();
    render(<CompositionEditor content="" onChange={onChange} />);
    const textarea = screen.getByLabelText(
      "Composition config JSON",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"type":"synchronous"}' } });
    expect(onChange).toHaveBeenCalledWith('{"type":"synchronous"}');
  });

  it("hides the suggest button when source content is missing", () => {
    render(<CompositionEditor content={null} onChange={() => {}} />);
    expect(
      screen.queryByLabelText("Suggest composition from source"),
    ).not.toBeInTheDocument();
  });

  it("shows the suggest button when source + language are provided", () => {
    render(
      <CompositionEditor
        content={null}
        onChange={() => {}}
        sourceContent="import asyncio\nawait asyncio.gather(a(), b())"
        sourceLanguage="python"
      />,
    );
    expect(
      screen.getByLabelText("Suggest composition from source"),
    ).toBeInTheDocument();
  });

  it("calls proposeComposition and renders findings on suggest", async () => {
    const spy = vi
      .spyOn(endpoints, "proposeComposition")
      .mockResolvedValue({
        findings: [
          {
            detector_id: "python_asyncio_gather",
            description: "asyncio.gather over 2 coroutine(s)",
            line: 7,
            branch_count: 2,
            suggested_instance_names: ["task_0", "task_1"],
            suggested_class_hint: null,
          },
        ],
      });
    const onChange = vi.fn();
    render(
      <CompositionEditor
        content={null}
        onChange={onChange}
        sourceContent="..."
        sourceLanguage="python"
      />,
    );
    fireEvent.click(screen.getByLabelText("Suggest composition from source"));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        source: "...",
        language: "python",
      });
      expect(
        screen.getByText("1 concurrency idiom(s) detected"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText(
        "Apply finding python_asyncio_gather at line 7",
      ),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const written = JSON.parse(onChange.mock.calls[0][0] as string);
    expect(written.type).toBe("asynchronous");
    expect(written.instances).toHaveLength(2);
    expect(written.instances[0]).toEqual({ of: "Worker", as: "task_0" });
    expect(written.shared).toEqual([]);
    spy.mockRestore();
  });

  it("shows a 'no idioms detected' fallback when findings is empty", async () => {
    const spy = vi
      .spyOn(endpoints, "proposeComposition")
      .mockResolvedValue({ findings: [] });
    render(
      <CompositionEditor
        content={null}
        onChange={() => {}}
        sourceContent="x = 1"
        sourceLanguage="python"
      />,
    );
    fireEvent.click(screen.getByLabelText("Suggest composition from source"));
    await waitFor(() => {
      expect(
        screen.getByText(/No concurrency idioms detected/),
      ).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  it("surfaces an error message when the propose endpoint fails", async () => {
    const spy = vi
      .spyOn(endpoints, "proposeComposition")
      .mockRejectedValue(new Error("network down"));
    render(
      <CompositionEditor
        content={null}
        onChange={() => {}}
        sourceContent="..."
        sourceLanguage="python"
      />,
    );
    fireEvent.click(screen.getByLabelText("Suggest composition from source"));
    await waitFor(() => {
      expect(
        screen.getByText(/Propose-composition failed: network down/),
      ).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  it("translates an ECONNABORTED timeout into actionable guidance", async () => {
    // axios fires ECONNABORTED on its client-side timeout. The raw
    // message is useless to a user; the editor should render
    // something they can act on (release-mode hint).
    const err = Object.assign(new Error("timeout of 30000ms exceeded"), {
      code: "ECONNABORTED",
    });
    const spy = vi.spyOn(endpoints, "proposeComposition").mockRejectedValue(err);
    render(
      <CompositionEditor
        content={null}
        onChange={() => {}}
        sourceContent="..."
        sourceLanguage="python"
      />,
    );
    fireEvent.click(screen.getByLabelText("Suggest composition from source"));
    await waitFor(() => {
      expect(screen.getByText(/Backend timed out/)).toBeInTheDocument();
      expect(screen.getByText(/--release mode/)).toBeInTheDocument();
    });
    spy.mockRestore();
  });
});
