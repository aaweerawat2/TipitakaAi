#!/usr/bin/env node
/**
 * Download Models Script
 * Downloads required AI models from Hugging Face
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Model URLs
const MODELS = {
  llm: {
    url: 'https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-SpinQuant_INT4_EO8-ET/resolve/main/model.pte',
    filename: 'llama-3.2-1b-q4.pte',
    size: '600MB',
  },
  asr: {
    small: {
      url: 'https://huggingface.co/biodatlab/whisper-small-thai/resolve/main/model.pte',
      filename: 'whisper-small-thai.pte',
      size: '244MB',
    },
    tiny: {
      url: 'https://huggingface.co/biodatlab/distill-whisper-th-small/resolve/main/model.pte',
      filename: 'whisper-tiny-thai.pte',
      size: '39MB',
    },
  },
  tts: {
    url: 'https://huggingface.co/pythainlp/thaitts-onnx/resolve/main/model.onnx',
    filename: 'vits-thai-female.onnx',
    size: '50MB',
  },
};

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const MODELS_DIR = path.join(ASSETS_DIR, 'models');

// Create directories
function ensureDirectories() {
  const dirs = [
    path.join(MODELS_DIR, 'llm'),
    path.join(MODELS_DIR, 'asr'),
    path.join(MODELS_DIR, 'tts'),
    path.join(ASSETS_DIR, 'database'),
    path.join(ASSETS_DIR, 'fonts'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Download file with progress
function downloadFile(url, dest, description) {
  return new Promise((resolve, reject) => {
    console.log(`\nDownloading: ${description}`);
    console.log(`From: ${url}`);
    console.log(`To: ${dest}`);

    const file = fs.createWriteStream(dest);
    let downloaded = 0;
    let total = 0;

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest, description)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      total = parseInt(response.headers['content-length'], 10);
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / total) * 100).toFixed(1);
        const mb = (downloaded / 1024 / 1024).toFixed(1);
        process.stdout.write(`\rProgress: ${percent}% (${mb} MB)`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n✅ Download complete');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Tripitaka-Offline-AI Model Downloader');
  console.log('═══════════════════════════════════════\n');

  ensureDirectories();

  const args = process.argv.slice(2);
  const downloadAll = args.length === 0 || args.includes('--all');
  const downloadLLM = downloadAll || args.includes('--llm');
  const downloadASR = downloadAll || args.includes('--asr');
  const downloadTTS = downloadAll || args.includes('--tts');

  try {
    // Download LLM
    if (downloadLLM) {
      const dest = path.join(MODELS_DIR, 'llm', MODELS.llm.filename);
      if (!fs.existsSync(dest)) {
        await downloadFile(MODELS.llm.url, dest, `LLM Model (${MODELS.llm.size})`);
      } else {
        console.log(`\n✓ LLM model already exists: ${dest}`);
      }
    }

    // Download ASR (both sizes)
    if (downloadASR) {
      for (const [size, model] of Object.entries(MODELS.asr)) {
        const dest = path.join(MODELS_DIR, 'asr', model.filename);
        if (!fs.existsSync(dest)) {
          await downloadFile(model.url, dest, `ASR Model ${size} (${model.size})`);
        } else {
          console.log(`\n✓ ASR ${size} model already exists: ${dest}`);
        }
      }
    }

    // Download TTS
    if (downloadTTS) {
      const dest = path.join(MODELS_DIR, 'tts', MODELS.tts.filename);
      if (!fs.existsSync(dest)) {
        await downloadFile(MODELS.tts.url, dest, `TTS Model (${MODELS.tts.size})`);
      } else {
        console.log(`\n✓ TTS model already exists: ${dest}`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ All models downloaded successfully!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
