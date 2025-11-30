import React, { useEffect, useRef, useCallback, useState } from 'react';
import { IronCalc, init, Model } from '@ironcalc/workbook';
import '@ironcalc/workbook/dist/ironcalc.css';
import snApi from 'sn-extension-api';

interface SpreadsheetData {
  workbook: string; // Base64 encoded workbook data
  version: number;
}

interface SpreadsheetEditorProps {
  noteVersion: number;
  noteText?: string;
}

// Events that could indicate model changes
const SAVE_TRIGGER_EVENTS = ['mouseup', 'keyup', 'change'] as const;
const GLOBAL_SAVE_EVENTS = ['pointerup', 'mouseup', 'keydown', 'keyup', 'paste', 'cut'] as const;

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ noteVersion, noteText }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<Model | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadedVersionRef = useRef(-1);
  const canSaveRef = useRef(false);
  const lastSavedBytesRef = useRef<string | null>(null);

  // Parse stored content
  const parseContent = useCallback((text: string | undefined): SpreadsheetData | null => {
    if (!text?.trim()) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed.workbook && typeof parsed.version === 'number' ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  // Load model from content
  const loadModel = useCallback((content: string | undefined): Model => {
    const data = parseContent(content);
    if (data?.workbook) {
      try {
        const bytes = Uint8Array.from(atob(data.workbook), c => c.charCodeAt(0));
        return Model.from_bytes(bytes);
      } catch (err) {
        console.error('Failed to parse workbook:', err);
      }
    }
    return new Model('Spreadsheet', 'en', 'UTC');
  }, [parseContent]);

  // Save workbook
  const save = useCallback(() => {
    if (!model || !canSaveRef.current) return;

    try {
      const bytes = model.toBytes();
      const base64 = btoa(String.fromCharCode(...bytes));

      // Only save if data actually changed (prevents saves on cell navigation)
      if (base64 === lastSavedBytesRef.current) return;

      snApi.text = JSON.stringify({
        workbook: base64,
        version: 1,
      });
      snApi.preview = 'IronCalc Spreadsheet';
      lastSavedBytesRef.current = base64;
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [model]);

  // Helper to load a note and enable saving after delay
  const loadNote = useCallback((version: number, content: string | undefined) => {
    canSaveRef.current = false;
    loadedVersionRef.current = version;
    const loadedModel = loadModel(content);

    // Store initial bytes to detect actual changes later
    try {
      const bytes = loadedModel.toBytes();
      lastSavedBytesRef.current = btoa(String.fromCharCode(...bytes));
    } catch {
      lastSavedBytesRef.current = null;
    }

    setModel(loadedModel);
    setTimeout(() => { canSaveRef.current = true; }, 500);
  }, [loadModel]);

  // Initialize WASM once on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await init();
        if (!mounted) return;
        // Wait for first streamed note text before loading the model
      } catch (err) {
        console.error('Init failed:', err);
        if (mounted) setError('Failed to initialize spreadsheet engine');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle note switches
  useEffect(() => {
    if (isLoading) return;
    if (noteText === undefined) return; // Wait until Standard Notes streams the note
    if (noteVersion === loadedVersionRef.current) return;
    loadNote(noteVersion, noteText);
  }, [noteVersion, noteText, isLoading, loadNote]);

  // Save on blur/unload (safety net)
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) save(); };

    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [save]);

  // Global listeners (capture) to catch drag-fill and deletion keys even if events don't bubble
  useEffect(() => {
    const afterEvent = () => {
      // Run after IronCalc processes the event
      requestAnimationFrame(() => save());
    };
    GLOBAL_SAVE_EVENTS.forEach(e => document.addEventListener(e, afterEvent, true));
    return () => {
      GLOBAL_SAVE_EVENTS.forEach(e => document.removeEventListener(e, afterEvent, true));
    };
  }, [save]);

  // Save on user interactions - byte comparison prevents unnecessary saves
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    SAVE_TRIGGER_EVENTS.forEach(e => container.addEventListener(e, save));

    return () => {
      SAVE_TRIGGER_EVENTS.forEach(e => container.removeEventListener(e, save));
    };
  }, [save]);

  if (error) {
    return (
      <div className="spreadsheet-error">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading || !model) {
    return (
      <div className="spreadsheet-loading">
        <div className="loading-spinner" />
        <span>Loading spreadsheet...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="spreadsheet-container">
      <IronCalc model={model} refreshId={0} />
    </div>
  );
};

export default SpreadsheetEditor;
