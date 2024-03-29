import debounce from "lodash/debounce";
import * as monaco from "monaco-editor";
// @ts-expect-error No TS module
import { ILanguageFeaturesService } from "monaco-editor/esm/vs/editor/common/services/languageFeatures.js";
// @ts-expect-error No TS module
import { OutlineModel } from "monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/outlineModel.js";
// @ts-expect-error No TS module
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js";
import { configureMonacoYaml, type SchemasSettings } from "monaco-yaml";

import throttle from "raf-throttle";
import React, { useEffect, useRef } from "react";
import {
  ComponentProps,
  Streamlit,
  Theme,
  withStreamlitConnection,
} from "streamlit-component-lib";

interface AceProps extends ComponentProps {
  args: any;
  theme?: Theme;
}

const modelUri = monaco.Uri.parse("schemas://zerek");

async function getDocumentSymbols(model: any) {
  const { documentSymbolProvider } = StandaloneServices.get(
    ILanguageFeaturesService,
  );
  const outline = await OutlineModel.create(documentSymbolProvider, model);
  return outline.asListOfDocumentSymbols();
}

// Based on https://github.com/remcohaszing/monaco-yaml/blob/979ed62d6fa1f8a381251bb50aa003190bdd1d19/examples/demo/src/index.ts#L28
(window as any).MonacoEnvironment = {
  getWorker(moduleId: string, label: string) {
    switch (label) {
      case "editorWorkerService":
        return new Worker(
          new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url),
        );
      case "yaml":
        return new Worker(new URL("monaco-yaml/yaml.worker", import.meta.url));
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

// Based on https://github.com/remcohaszing/monaco-yaml/blob/979ed62d6fa1f8a381251bb50aa003190bdd1d19/examples/demo/src/index.ts#L158
function* iterateSymbols(
  symbols: monaco.languages.DocumentSymbol[],
  position: monaco.Position,
): Iterable<string> {
  for (const symbol of symbols) {
    if (monaco.Range.containsPosition(symbol.range, position)) {
      yield symbol.name;
      if (symbol.children) {
        yield* iterateSymbols(symbol.children, position);
      }
    }
  }
}

function Monaco({ args }: AceProps) {
  const container = useRef<HTMLDivElement>(null);
  const currentArgs = useRef(args);

  useEffect(() => {
    if (!container.current) {
      throw new Error("Container is not available");
    }

    function createSnippets(
      range: monaco.IRange,
    ): monaco.languages.CompletionItem[] {
      return currentArgs.current.snippets.map(
        (snippet: any): monaco.languages.CompletionItem => {
          return {
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: snippet.insertText,
            range: range,
            detail: snippet.detail,
          };
        },
      );
    }

    const defaultSchema: SchemasSettings = {
      uri: String(modelUri),
      schema: currentArgs.current.schema,
      fileMatch: [String(modelUri)],
    };

    const monacoYaml = configureMonacoYaml(monaco, {
      enableSchemaRequest: true,
      schemas: [defaultSchema],
    });

    const model = monaco.editor.createModel(
      currentArgs.current.value,
      "yaml",
      modelUri,
    );

    let selectionPath: string[] = [];

    // Completion for code snippets
    monaco.languages.registerCompletionItemProvider("yaml", {
      provideCompletionItems: function (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext,
        token: monaco.CancellationToken,
      ) {
        const range: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          // we assume the snippets are indented with 2 spaces and
          // work here
          startColumn: 0,
          endColumn: position.column,
        };

        return {
          suggestions: createSnippets(range),
        };
      },
    });

    const editor = monaco.editor.create(container.current, {
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
      model,
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "vs-dark"
        : "vs-light",
    });

    const updateSelectionPath = debounce(async function updateSelectionPath_(
      position: monaco.Position,
    ) {
      const symbols = await getDocumentSymbols(editor.getModel());
      selectionPath = Array.from(iterateSymbols(symbols, position));
      updateValue();
      updateValue.flush();
    },
    300);

    editor.onDidChangeCursorPosition(async (event) => {
      updateSelectionPath(event.position);
    });

    const resize = throttle(function resize_() {
      editor.layout({
        width: window.innerWidth - 20,
        height: currentArgs.current.height - 20,
      });
      Streamlit.setFrameHeight(currentArgs.current.height);
    });

    let lastBodyHeight = document.body.offsetHeight;

    const resizeObserver = new ResizeObserver((entries) => {
      const newBodyHeight = Math.ceil(entries[0].contentRect.height);
      if (lastBodyHeight !== newBodyHeight) {
        lastBodyHeight = newBodyHeight;
        resize();
      }
    });

    resizeObserver.observe(document.body);

    resize();

    const updateValue = debounce(function updateValue_() {
      const text = editor.getValue();
      Streamlit.setComponentValue({ selection_path: selectionPath, text });
    }, 300);

    editor.onDidChangeModelContent(() => {
      updateValue();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      updateValue();
    });

    updateValue();

    return () => {
      resizeObserver.disconnect();
      resize.cancel();
      updateValue.cancel();
      updateSelectionPath.cancel();
      editor.dispose();
    };
  }, []);

  return <div ref={container} style={{ height: "100%" }} />;
}

export default withStreamlitConnection(Monaco);
