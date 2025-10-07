# Lottie to WebP Converter

Convert Lottie JSON animations to animated WebP files locally with full control over quality, FPS, and duration.

## Features

- 🎬 Converts Lottie JSON animations to animated WebP format
- 🎯 Preserves transparency
- ⚡ Runs completely offline (no cloud APIs)
- 🔧 Customizable FPS, quality, and loop settings
- ⏱️ Automatic duration detection from Lottie data
- 🖥️ Cross-platform support (Mac/Linux/Windows)
- 📦 Both API and CLI interfaces

## Prerequisites

- Node.js 18+
- FFmpeg installed (`brew install ffmpeg` on macOS)

## Installation

```bash
npm install
```

### Docker

Build the image:
```bash
docker build -t lottie-to-webp .
```

Run with Docker:
```bash
docker run -v $(pwd):/data lottie-to-webp /data/input.json /data/output.webp --fps 24 --quality 80
```

## Usage

### CLI

```bash
npx lottie2webp input.json output.webp --fps 24 --quality 80 --loop
```

Options:
- `--fps, -f`: Frames per second (defaults to Lottie framerate)
- `--quality, -q`: WebP quality 0-100 (default: 90)
- `--loop, -l`: Enable looping (default: true)
- `--duration, -d`: Override animation duration in seconds

Examples:
```bash
# Basic conversion
npx lottie2webp animation.json output.webp

# Custom FPS and quality
npx lottie2webp animation.json output.webp --fps 24 --quality 80

# No loop, 2 second duration
npx lottie2webp animation.json output.webp --no-loop --duration 2
```

### API

```javascript
const lottieToWebP = require('./lottieToWebP');

await lottieToWebP(
  'path/to/input.json',
  'path/to/output.webp',
  {
    fps: 24,
    quality: 90,
    loop: true,
    duration: 2 // optional override
  }
);
```

## How It Works

1. **Duration Extraction**: Reads the Lottie JSON to extract:
   - `fr` (frame rate)
   - `ip` (in point)
   - `op` (out point)
   - Duration = (op - ip) / fr seconds

2. **Rendering**: Uses Puppeteer with lottie-web to render frames locally

3. **Conversion**: FFmpeg stitches frames into an animated WebP with specified settings

## Testing

```bash
npm test
```

## License

MIT