# News Extractor - Puppeteer Integration

This application now includes server-side article extraction using Puppeteer to bypass CORS limitations and provide robust content extraction from news sites.

## Features

- **Puppeteer-based extraction**: Bypasses CORS restrictions by using server-side browser automation
- **Robust content extraction**: Advanced selectors for title, image, and body text extraction
- **Support for news sites**: Optimized for Belfast Live, BBC, and similar news websites
- **Real-time preview**: Live markdown preview and dedicated extraction results view
- **Easy deployment**: Simple Node.js server with Express

## Usage

1. **Start the server**: `npm start`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Enter URL**: Paste a news article URL (e.g., Belfast Live article)
4. **Click Fetch**: The app will extract title, image, and content
5. **View results**: Content appears in markdown editor with live preview

## Example URLs

- Belfast Live: `https://www.belfastlive.co.uk/news/northern-ireland/...`
- BBC News: `https://www.bbc.com/news/articles/...`

## Technical Details

- **Backend**: Node.js + Express + Puppeteer
- **Frontend**: Vanilla JavaScript with markdown support
- **Extraction**: Multiple fallback selectors for reliable content extraction
- **Performance**: Optimized browser settings for faster extraction

## Installation

```bash
npm install
npm start
```

The server will start on port 3000 by default.