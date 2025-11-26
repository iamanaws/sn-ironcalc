import { useRef, useState } from 'react';
import { TEST_DATA } from "./test-data";
import { MockStandardNotes } from "./mock-notes";

const mock = new MockStandardNotes(TEST_DATA[0], () => {
  const el = document.getElementById('last-saved');
  if (el) {
    el.textContent = `Last Saved: ${new Date().toLocaleTimeString()}`;
  }
}, 0);

const DemoApp = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selected, setSelected] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [theme, setTheme] = useState('light');

  const changeMenuItem = (i: number) => {
    setSelected(i);
    mock.changeData(TEST_DATA[i], i);
  };

  const renderMenuItem = (_: any, i: number) => {
    return (
      <div
        key={i}
        className={selected === i ? 'menu-item selected' : 'menu-item'}
        onClick={() => changeMenuItem(i)}
      >
        <span className="menu-icon">📊</span>
        {TEST_DATA[i].title}
      </div>
    );
  };

  const onToggleDisabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisabled(e.target.checked);
    mock.toggleLock(e.target.checked);
  };

  const onChangeTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? 'dark' : 'light');
    mock.toggleTheme(e.target.checked);
  };

  const onFrameLoad = () => {
    mock.onReady(iframeRef.current?.contentWindow);
  };

  return (
    <div className="demo">
      <div className="menu">
        <div className="menu-header">Spreadsheets</div>
        {TEST_DATA.map(renderMenuItem)}
      </div>
      <div className="content">
        <div className="content-header">
          <div>
            <input
              id="editingDisabled"
              type="checkbox"
              checked={disabled}
              onChange={onToggleDisabled}
            />
            <label htmlFor="editingDisabled">Editing Disabled</label>
          </div>
          <div>
            <input
              id="isDark"
              type="checkbox"
              checked={theme === 'dark'}
              onChange={onChangeTheme}
            />
            <label htmlFor="isDark">Dark Theme</label>
          </div>
          <div id="last-saved"></div>
        </div>
        <iframe ref={iframeRef} src="index.html" onLoad={onFrameLoad} />
      </div>
    </div>
  );
}

export default DemoApp
