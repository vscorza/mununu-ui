import * as monaco from "monaco-editor";

export const registerCtxdslTheme = (monacoInstance: typeof monaco) => {
  monacoInstance.editor.defineTheme("ctxdsl-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
      { token: "string", foreground: "ce9178" },
      { token: "number", foreground: "b5cea8" },
      { token: "identifier", foreground: "9cdcfe" },
      { token: "comment", foreground: "6a9955", fontStyle: "italic" },
      { token: "delimiter", foreground: "d4d4d4" },
    ],
    colors: {},
  });

  monacoInstance.editor.defineTheme("ctxdsl-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
      { token: "string", foreground: "a31515" },
      { token: "number", foreground: "098658" },
      { token: "identifier", foreground: "001080" },
      { token: "comment", foreground: "008000", fontStyle: "italic" },
      { token: "delimiter", foreground: "000000" },
    ],
    colors: {},
  });
};
