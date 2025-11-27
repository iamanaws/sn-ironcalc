// Must be first import - mocks sessionStorage before IronCalc loads
import './sessionStorageMock';

import React from 'react';

import './index.scss';
import { createRoot } from "react-dom/client";
import SpreadsheetEditor from "./components/SpreadsheetEditor";
import snApi from "sn-extension-api";

const root = createRoot(document.getElementById('root'));

// Track note version - increments every time snApi.subscribe fires
let noteVersion = 0;
// Track last streamed text to avoid re-render thrash on self-saves
let lastStreamedText: string | undefined = undefined;
// Hold current note text to pass to the editor once available
let currentText: string | undefined = undefined;

export const rerenderRoot = () => {
  root.render(
    <React.StrictMode>
      <SpreadsheetEditor noteVersion={noteVersion} noteText={currentText} />
    </React.StrictMode>
  );
};

snApi.initialize({
  debounceSave: 400
});

snApi.subscribe((text) => {
  // Only re-render if incoming text actually changed (prevents selection reset on self-saves)
  if (text !== lastStreamedText) {
    currentText = text;
    lastStreamedText = text;
    noteVersion++;
    rerenderRoot();
  }
});

// Render initial loading UI; SpreadsheetEditor will wait for first streamed text
rerenderRoot();
