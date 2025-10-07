# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A tool that converts Lottie JSON animations to animated WebP files using Puppeteer and FFmpeg. The conversion process extracts duration metadata from Lottie JSON, renders frames via headless browser, and compiles them into WebP format.

## Prerequisites

- Node.js 18+
- FFmpeg must be installed (`brew install ffmpeg` on macOS)

## Commands

### Node Version Management

If using nvm:
```bash
nvm use
```

### Installation
```bash
npm install
```

### Docker

Build image:
```bash
docker build -t lottie-to-webp .
```

Run with Docker (mount current directory as /data):
```bash
docker run -v $(pwd):/data lottie-to-webp /data/input.json /data/output.webp --fps 24 --quality 80
```

### Running the Tool

CLI usage:
```bash
npx lottie2webp input.json output.webp --fps 24 --quality 80 --loop
```

Programmatic usage:
```javascript
const lottieToWebP = require('./lottieToWebP');
await lottieToWebP('input.json', 'output.webp', { fps: 24, quality: 90, loop: true });
```

### Testing
```bash
npm test
```

Note: There is currently no test.js file in the root directory, despite the npm test script.

## Architecture

### Core Components

**lottieToWebP.js** - Main conversion module
- Extracts duration from Lottie JSON metadata (`fr`, `ip`, `op` fields)
- Launches Puppeteer browser with lottie-web library loaded from CDN
- Iterates through frames, calling `goToAndStop()` for each frame number
- Takes screenshots with transparent background (`omitBackground: true`)
- Saves frames to temporary directory (`temp/<timestamp>/`)
- Spawns FFmpeg process to stitch frames into animated WebP
- Cleans up temporary files after conversion

**cli.js** - Command-line interface
- Uses yargs for argument parsing
- Validates input file existence before conversion
- Resolves absolute paths for input/output
- Reports file size after successful conversion

### Conversion Pipeline

1. **Duration Extraction**: Reads Lottie JSON to calculate duration = (outPoint - inPoint) / frameRate
2. **Frame Rendering**: Puppeteer + lottie-web render each frame to PNG with transparency
3. **WebP Assembly**: FFmpeg with `libwebp_anim` codec compiles frames with specified quality and loop settings
4. **Cleanup**: Temporary frame directory is removed

### Key Parameters

- `fps`: Output frame rate (defaults to 30, or can inherit from Lottie's `fr` field)
- `quality`: WebP quality 0-100 (default 90)
- `loop`: Boolean for looping animation (default true, FFmpeg receives '0' for loop, '1' for no loop)
- `duration`: Optional override for animation duration

### FFmpeg Integration

The tool uses FFmpeg's `libwebp_anim` codec with these settings:
- `-lossless 0`: Lossy compression enabled
- `-compression_level 6`: Moderate compression
- `-q:v`: Quality parameter from options
- `-loop 0/1`: Loop parameter (0 = infinite loop, 1 = play once)
- `-vsync 0`: Disable sync to preserve exact frame count
