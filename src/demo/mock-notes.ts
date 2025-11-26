import { REGISTERED_EVENT, STREAM_EVENT_DATA } from './mock-events';
import { TestData } from './test-data';

let componentData = {};

// Persist saved data per note (by UUID)
const savedNoteData: Map<string, string> = new Map();

export class MockStandardNotes {
  private childWindow;
  private streamEvent;
  private streamData;
  private currentNoteUuid: string = '';

  constructor(data: TestData, private onSave: () => void, _initialNoteIndex: number = 0) {
    this.currentNoteUuid = data.uuid;
    this.updateStream(data);
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  public onReady(childWindow) {
    this.childWindow = childWindow;
    childWindow.postMessage({
      ...REGISTERED_EVENT,
      componentData
    });
  }

  public toggleLock(isLocked: boolean) {
    this.streamData.item.content.appData['org.standardnotes.sn']['locked'] = isLocked;
    this.childWindow.postMessage({
      action: 'reply',
      data: this.streamData,
      original: this.streamEvent
    }, '*');
  }

  public toggleTheme(isDark: boolean) {
    const themes = isDark ? ['dark.css'] : [];
    this.childWindow.postMessage({
      action: 'themes',
      data: {
        themes
      }
    }, '*');
  }

  public changeData(data: TestData, _noteIndex?: number) {
    this.currentNoteUuid = data.uuid;
    this.updateStream(data);
    this.childWindow.postMessage({
      action: 'reply',
      data: this.streamData,
      original: this.streamEvent
    }, '*');
  }

  private handleMessage(e: MessageEvent) {
    const data = e.data;

    if (data.action === 'stream-context-item') {
      this.streamEvent = data;
      this.childWindow.postMessage({
        action: 'reply',
        data: this.streamData,
        original: data
      }, '*');
    } else if (data.action === 'save-items') {
      // sn-extension-api sends save-items with the item data
      const savedItem = data.data?.items?.[0];

      if (savedItem?.content?.text !== undefined) {
        // Use the UUID from the saved item, or fall back to current note
        const noteUuid = savedItem.uuid || this.currentNoteUuid;
        savedNoteData.set(noteUuid, savedItem.content.text);

        // Update stream data if it's the current note
        if (noteUuid === this.currentNoteUuid) {
          this.streamData.item.content.text = savedItem.content.text;
        }
      }

      this.onSave();
      this.childWindow.postMessage({
        action: 'reply',
        data: {},
        original: data
      }, '*');
    } else if (data.action === 'set-component-data') {
      componentData = data.data.componentData;
    }
  }

  private updateStream(data: TestData) {
    this.streamData = JSON.parse(JSON.stringify(STREAM_EVENT_DATA));
    // Set the note's UUID
    this.streamData.item.uuid = data.uuid;
    // Use saved data if available, otherwise use initial data
    const savedText = savedNoteData.get(data.uuid);
    this.streamData.item.content.text = savedText !== undefined ? savedText : data.text;
    this.streamData.item.content.appData[this.streamData.item.content.editorIdentifier] = data.meta;
  }
}
