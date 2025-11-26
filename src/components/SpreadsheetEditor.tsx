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
}

const SAVE_DEBOUNCE_MS = 300;
const AUTO_SAVE_MS = 2000;
const INTERACTION_EVENTS = ['click', 'keyup', 'input', 'change', 'focusout', 'mouseup'] as const;

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ noteVersion }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<Model | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedVersionRef = useRef(-1);
  const isDirtyRef = useRef(false);
  const canSaveRef = useRef(false);

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

  // Save workbook (only if dirty and saves are enabled)
  const save = useCallback(() => {
    if (!model || !canSaveRef.current || !isDirtyRef.current) return;

    try {
      const bytes = model.toBytes();
      snApi.text = JSON.stringify({
        workbook: btoa(String.fromCharCode(...bytes)),
        version: 1,
      });
      isDirtyRef.current = false;
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [model]);

  // Mark dirty and schedule debounced save
  const markDirtyAndSave = useCallback(() => {
    isDirtyRef.current = true;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(save, SAVE_DEBOUNCE_MS);
  }, [save]);

  // Helper to load a note and enable saving after delay
  const loadNote = useCallback((version: number) => {
    canSaveRef.current = false;
    isDirtyRef.current = false;
    loadedVersionRef.current = version;
    setModel(loadModel(snApi.text));
    setTimeout(() => { canSaveRef.current = true; }, 500);
  }, [loadModel]);

  // Initialize WASM once on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await init();
        if (!mounted) return;
        loadNote(noteVersion);
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
    if (isLoading || noteVersion === loadedVersionRef.current) return;
    loadNote(noteVersion);
  }, [noteVersion, isLoading, loadNote]);

  // Auto-save interval
  useEffect(() => {
    if (!model) return;
    const interval = setInterval(save, AUTO_SAVE_MS);
    return () => clearInterval(interval);
  }, [model, save]);

  // Save on blur/unload
  useEffect(() => {
    const onUnload = () => { clearTimeout(saveTimeoutRef.current); save(); };
    const onVisibility = () => { if (document.hidden) save(); };

    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [save]);

  // Capture user interactions to trigger saves
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    INTERACTION_EVENTS.forEach(e => container.addEventListener(e, markDirtyAndSave, true));

    return () => {
      INTERACTION_EVENTS.forEach(e => container.removeEventListener(e, markDirtyAndSave, true));
      clearTimeout(saveTimeoutRef.current);
    };
  }, [markDirtyAndSave]);

  if (isLoading) {
    return (
      <div className="spreadsheet-loading">
        <div className="loading-spinner" />
        <span>Loading spreadsheet...</span>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="spreadsheet-error">
        <span className="error-icon">⚠️</span>
        <span>{error || 'Failed to create spreadsheet model'}</span>
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
