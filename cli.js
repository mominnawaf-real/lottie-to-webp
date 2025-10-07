#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const lottieToWebP = require('./lottieToWebP');
const path = require('path');
const fs = require('fs-extra');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <input> <output> [options]')
  .command('$0 <input> <output>', 'Convert Lottie JSON to animated WebP', (yargs) => {
    yargs
      .positional('input', {
        describe: 'Path to input Lottie JSON file',
        type: 'string'
      })
      .positional('output', {
        describe: 'Path to output WebP file',
        type: 'string'
      });
  })
  .option('fps', {
    alias: 'f',
    type: 'number',
    description: 'Frames per second',
    default: 30
  })
  .option('quality', {
    alias: 'q',
    type: 'number',
    description: 'WebP quality (0-100)',
    default: 90
  })
  .option('loop', {
    alias: 'l',
    type: 'boolean',
    description: 'Enable looping',
    default: true
  })
  .option('duration', {
    alias: 'd',
    type: 'number',
    description: 'Override animation duration in seconds'
  })
  .example('$0 animation.json output.webp', 'Basic conversion')
  .example('$0 animation.json output.webp --fps 24 --quality 80', 'Custom FPS and quality')
  .example('$0 animation.json output.webp --no-loop --duration 2', 'No loop, 2 second duration')
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .argv;

async function main() {
  try {
    const inputPath = path.resolve(argv.input);
    const outputPath = path.resolve(argv.output);
    
    const inputExists = await fs.pathExists(inputPath);
    if (!inputExists) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);
    
    console.log(`\nConverting: ${path.basename(inputPath)} -> ${path.basename(outputPath)}\n`);
    
    const options = {
      fps: argv.fps,
      quality: argv.quality,
      loop: argv.loop,
      duration: argv.duration
    };
    
    await lottieToWebP(inputPath, outputPath, options);
    
    const stats = await fs.stat(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`\nOutput file size: ${fileSizeKB} KB`);
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}