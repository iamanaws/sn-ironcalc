# IronCalc for Standard Notes

Spreadsheet editor plugin for Standard Notes, powered by [IronCalc](https://github.com/ironcalc/ironcalc) - a modern, fast, and Excel-compatible spreadsheet engine written in Rust and compiled to WebAssembly.

## Features

- **Full spreadsheet functionality** - cells, formulas, formatting
- **Excel-compatible formulas** - hundreds of functions supported
- **Fast & lightweight** - powered by Rust/WebAssembly
- **Auto-save** - your spreadsheets are automatically saved to Standard Notes
- **Works offline** - everything runs locally in your browser

## Getting Started

### Development

```bash
# Install dependencies
pnpm install

# Start Dev Server
pnpm run start
```

The demo page will launch automatically at `http://localhost:8080/demo.html`.

### Building

```bash
pnpm run build
```

This creates a production build in the `dist/` folder, including a `latest.zip` for the Standard Notes desktop app.

## Installing in Standard Notes

### Local Development

1. Start the dev server with `pnpm run start`
2. In Standard Notes, go to **Preferences** → **General** → **Advanced Settings** → **Install Custom Plugin**
3. Enter: `http://localhost:8080/local.json`

### Production

After deploying to GitHub Pages (or your hosting provider):

1. In Standard Notes, go to **Preferences** → **General** → **Advanced Settings** → **Install Custom Plugin**
2. Enter your hosted `ext.json` URL, e.g.: `https://iamanaws.github.io/sn-ironcalc/ext.json`

## Plugin Configuration

Edit `public/ext.json` to customize your plugin metadata:

```json
{
  "identifier": "dev.iamanaws.ironcalc",
  "name": "IronCalc",
  "content_type": "SN|Component",
  "area": "editor-editor",
  "version": "$VERSION$",
  "description": "Spreadsheet editor powered by IronCalc",
  "url": "https://iamanaws.github.io/sn-ironcalc/",
  "download_url": "https://iamanaws.github.io/sn-ironcalc/latest.zip",
  "latest_url": "https://iamanaws.github.io/sn-ironcalc/ext.json"
}
```

## Technology Stack

- **[IronCalc](https://ironcalc.com)** - Spreadsheet engine (Rust/WASM)
- **[React](https://react.dev)** - UI framework
- **[Standard Notes Extension API](https://www.npmjs.com/package/sn-extension-api)** - Integration with Standard Notes
- **Webpack** - Bundler

## GitHub Actions Deployment

This repo includes a GitHub Actions workflow (`.github/workflows/node.js.yml`) that automatically builds and deploys to GitHub Pages.

To enable:
1. Create a `gh-pages` branch
2. Enable GitHub Pages in your repository settings
3. Push to `main` to trigger deployment

## Credits

- [IronCalc](https://github.com/ironcalc/ironcalc) by Nicolas Hatcher
- [Standard Notes Extension Template](https://github.com/nienow/sn-extension-template) by nienow
