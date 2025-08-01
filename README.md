# News Extractor Extension

## How to Package and Install in Chrome and Edge

### 1. Prepare the Extension Files

Make sure your extension folder (`news-extractor-extension/`) contains these files:

- manifest.json
- background.js
- content.js
- news-extractor.html
- news-extractor.js
- news-extractor.css

You may also include icons if desired (icon16.png, icon48.png, icon128.png).

### 2. Zip the Extension Folder

From the root of your workspace, run:

```bash
cd news-extractor-extension
zip -r ../news-extractor-extension.zip .
```

This creates `news-extractor-extension.zip` in your workspace root.

### 3. Install in Chrome or Edge

#### Chrome
1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `news-extractor-extension` folder
   - Or click **Pack extension** and select the folder, then load the generated `.crx` file
4. Or drag and drop the `news-extractor-extension.zip` into the page (unzip first if needed)

#### Edge
1. Go to `edge://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `news-extractor-extension` folder

### 4. Manifest/JSON Setup

No extra setup is needed. The `manifest.json` is already configured for Chrome and Edge (Manifest V3).

If you add icons, update the `icons` section in `manifest.json` accordingly.

---
**Note:** If you update the extension, remove the old version from the browser and repeat the steps above.
# newsextractor