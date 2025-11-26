import React from 'react';

import './index.scss';
import { createRoot } from "react-dom/client";
import SpreadsheetEditor from "./components/SpreadsheetEditor";
import snApi from "sn-extension-api";

const root = createRoot(document.getElementById('root'));

// Track note version - increments every time snApi.subscribe fires
let noteVersion = 0;

export const rerenderRoot = () => {
  root.render(
    <React.StrictMode>
      <SpreadsheetEditor noteVersion={noteVersion} />
    </React.StrictMode>
  );
};

snApi.initialize({
  debounceSave: 400  // Shorter debounce for more responsive saves
});

snApi.subscribe(() => {
  // Increment version to signal a new note/data arrived
  noteVersion++;
  rerenderRoot();
});
