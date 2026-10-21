import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
// Vite supplies the worker constructor for this resource query.
// eslint-disable-next-line import/default
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";
import "monaco-editor/language/json/monaco.contribution";

// This module is loaded only by the client-only editor. Keep the editor and its
// workers in the application build, where the sanitizer patch is applied.
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    return label === "json" ? new JsonWorker() : new EditorWorker();
  },
};

loader.config({ monaco });

export { default } from "@monaco-editor/react";
