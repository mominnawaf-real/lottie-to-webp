const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
async function lottieToWebP(
  lottiePath,
  outputPath,
  options = {}
) {
  const tempDir = path.join(__dirname, 'temp', Date.now().toString());
  
  try {
    await fs.ensureDir(tempDir);
    
    const lottieData = await fs.readJson(lottiePath);
    
    const frameRate = lottieData.fr || 30;
    const inPoint = lottieData.ip || 0;
    const outPoint = lottieData.op || 100;
    const totalFrames = outPoint - inPoint;
    const duration = options.duration || (totalFrames / frameRate);
    
    const fps = options.fps || 30;
    const quality = options.quality || 90;
    const loop = options.loop !== false;
    
    const width = lottieData.w || 500;
    const height = lottieData.h || 500;
    
    const frameCount = Math.ceil(duration * fps);
    
    console.log(`Converting Lottie animation:`);
    console.log(`- Duration: ${duration}s`);
    console.log(`- FPS: ${fps}`);
    console.log(`- Size: ${width}x${height}`);
    console.log(`- Frames: ${frameCount}`);
    console.log(`- Quality: ${quality}`);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
        }
        #lottie-container {
          width: ${width}px;
          height: ${height}px;
        }
      </style>
    </head>
    <body>
      <div id="lottie-container"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
      <script>
        window.animationData = ${JSON.stringify(lottieData)};
        window.animation = lottie.loadAnimation({
          container: document.getElementById('lottie-container'),
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: window.animationData
        });
        
        window.gotoFrame = function(frame) {
          window.animation.goToAndStop(frame, true);
        };
        
        window.getTotalFrames = function() {
          return window.animation.totalFrames;
        };
      </script>
    </body>
    </html>`;
    
    await page.setContent(html);
    await page.waitForFunction('window.animation !== undefined');
    
    console.log('Capturing frames...');
    for (let i = 0; i < frameCount; i++) {
      const progress = Math.floor((i / frameCount) * 100);
      process.stdout.write(`\rProgress: ${progress}%`);
      
      const frameNumber = inPoint + (i * totalFrames / frameCount);
      
      await page.evaluate((frame) => {
        window.gotoFrame(frame);
      }, frameNumber);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const framePath = path.join(tempDir, `frame_${String(i).padStart(5, '0')}.png`);
      await page.screenshot({
        path: framePath,
        omitBackground: true
      });
    }
    
    console.log('\nFrames captured successfully!');
    await browser.close();
    
    console.log('Creating animated WebP...');
    
    const framePattern = path.join(tempDir, 'frame_%05d.png');
    const loopParam = loop ? '0' : '1';
    
    const ffmpegCommand = [
      'ffmpeg',
      '-y',
      '-framerate', fps.toString(),
      '-i', framePattern,
      '-c:v', 'libwebp_anim',
      '-lossless', '0',
      '-compression_level', '6',
      '-q:v', quality.toString(),
      '-loop', loopParam,
      '-preset', 'default',
      '-an',
      '-vsync', '0',
      outputPath
    ];
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegCommand[0], ffmpegCommand.slice(1));
      
      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('WebP created successfully!');
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
      
      ffmpeg.on('error', (err) => {
        if (err.code === 'ENOENT') {
          reject(new Error('FFmpeg not found. Please install FFmpeg first.'));
        } else {
          reject(err);
        }
      });
    });
    
    await fs.remove(tempDir);
    console.log(`Conversion complete! Output saved to: ${outputPath}`);
    
  } catch (error) {
    await fs.remove(tempDir).catch(() => {});
    throw error;
  }
}

module.exports = lottieToWebP;