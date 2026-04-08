import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// yt-dlp'yi bul
function findYtDlp() {
  const paths = [
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    '/usr/bin/youtube-dl'
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    execSync('which yt-dlp', { stdio: 'pipe' });
    return 'yt-dlp';
  } catch {
    return 'yt-dlp';
  }
}

const ytDlpPath = findYtDlp();
const downloadProgress = {};

console.log(`🎬 yt-dlp yolu: ${ytDlpPath}`);

// İndirme endpoint'i
app.post('/api/download', async (req, res) => {
  try {
    const { url, format, quality, path: downloadPath } = req.body;

    // Validasyon
    if (!url) {
      return res.status(400).json({ error: 'URL gerekli' });
    }

    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTiktok = url.includes('tiktok.com');
    const isInstagram = url.includes('instagram.com');
    const isTwitter = url.includes('twitter.com') || url.includes('x.com');
    const isFacebook = url.includes('facebook.com');

    if (!isYoutube && !isTiktok && !isInstagram && !isTwitter && !isFacebook) {
      return res.status(400).json({ error: 'Desteklenmeyen URL türü' });
    }

    // Klasör yolunu genişlet
    const expandedPath = (downloadPath || '~/Downloads')
      .replace('~', os.homedir())
      .replace(/^\.\//, process.cwd() + '/');

    // Klasörü oluştur
    if (!fs.existsSync(expandedPath)) {
      fs.mkdirSync(expandedPath, { recursive: true });
    }

    // Unique ID oluştur
    const downloadId = Date.now().toString();
    downloadProgress[downloadId] = {
      status: 'starting',
      percent: 0,
      fileName: null
    };

    // yt-dlp argümanlarını oluştur
    const args = ['--newline'];

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '192');
    } else if (format === 'mp4') {
      args.push('-f', 'bv*+ba/b', '--merge-output-format', 'mp4');

      if (quality === '1080') {
        args.push('-S', 'height:1080');
      } else if (quality === '720') {
        args.push('-S', 'height:720');
      } else if (quality === '480') {
        args.push('-S', 'height:480');
      } else if (quality === '360') {
        args.push('-S', 'height:360');
      }
    }

    args.push('-o', `${expandedPath}/%(title)s [%(id)s].%(ext)s`);
    args.push(url);

    console.log(`📥 İndirme başlıyor (ID: ${downloadId}): ${url}`);

    // Süreci arka planda başlat
    const ytdlp = spawn(ytDlpPath, args);
    let lastFileName = null;
    let stderrBuffer = '';
    let stdoutBuffer = '';

    ytdlp.on('error', (err) => {
      downloadProgress[downloadId].status = 'error';
      downloadProgress[downloadId].error = `yt-dlp başlatılamadı: ${err.message}`;
      console.error('❌ yt-dlp spawn error:', err.message);
    });

    function parseLine(line) {
      // Destination satırından dosya adını çıkart
      const destMatch = line.match(/Destination:\s*(.+)/) || line.match(/\[Merger\] Merging formats into "(.+?)"/);
      if (destMatch) {
        lastFileName = path.basename(destMatch[1]);
        downloadProgress[downloadId].fileName = lastFileName;
      }

      // Progress bilgisini çıkart
      const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        downloadProgress[downloadId].percent = Math.min(percent, 99);
        downloadProgress[downloadId].status = 'downloading';
      }
    }

    // Line-by-line buffer parsing helper
    function processBuffer(buffer, chunk) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) {
          parseLine(line);
        }
      }
      return buffer;
    }

    // stdout dinle
    ytdlp.stdout.on('data', (data) => {
      stdoutBuffer = processBuffer(stdoutBuffer, data.toString());
    });

    // stderr dinle
    ytdlp.stderr.on('data', (data) => {
      stderrBuffer = processBuffer(stderrBuffer, data.toString());
    });

    // Process sonu
    ytdlp.on('close', (code) => {
      if (code === 0) {
        downloadProgress[downloadId].status = 'completed';
        downloadProgress[downloadId].percent = 100;
        console.log(`✅ İndirme tamamlandı: ${downloadId}`);
      } else {
        downloadProgress[downloadId].status = 'error';
        downloadProgress[downloadId].error = `yt-dlp hata kodu: ${code}`;
        console.error(`❌ İndirme hatası: ${downloadId} - kod: ${code}`);
      }
    });

    // Hemen cevap ver
    res.json({
      success: true,
      downloadId: downloadId,
      message: 'İndirme başlatıldı'
    });

  } catch (error) {
    console.error('❌ İndirme başlatma hatası:', error.message);
    res.status(500).json({
      error: error.message || 'İndirme başlatılamadı'
    });
  }
});

// Progress kontrolü endpoint'i
app.get('/api/progress/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const progress = downloadProgress[downloadId];

  if (!progress) {
    return res.status(404).json({ error: 'İndirme bulunamadı' });
  }

  res.json(progress);
});

// Video bilgi endpoint'i
app.get('/api/video-info', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL gerekli' });
    }

    // yt-dlp -j ile JSON metadata al
    const ytdlp = spawn(ytDlpPath, ['-j', '--no-download', url]);
    let stdout = '';
    let stderr = '';
    let responseHandled = false;

    const timeout = setTimeout(() => {
      if (!responseHandled) {
        responseHandled = true;
        ytdlp.kill();
        console.error('⏱️ yt-dlp timeout after 25s');
        res.status(500).json({ error: 'Video bilgisi alinamadi: timeout' });
      }
    }, 25000);

    ytdlp.on('error', (err) => {
      if (!responseHandled) {
        responseHandled = true;
        clearTimeout(timeout);
        console.error('❌ yt-dlp spawn error:', err.message);
        res.status(500).json({ error: 'yt-dlp başlatılamadı: ' + err.message });
      }
    });

    ytdlp.stdout.on('data', (data) => { stdout += data.toString(); });
    ytdlp.stderr.on('data', (data) => { stderr += data.toString(); });

    ytdlp.on('close', (code) => {
      if (responseHandled) return;
      responseHandled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        console.error('❌ yt-dlp error (code', code + '):', stderr);
        return res.status(500).json({ error: 'Video bilgisi alinamadi' });
      }
      try {
        const info = JSON.parse(stdout);
        const duration = info.duration || 0;
        const title = info.title || 'Bilinmiyor';

        const bitrates = {
          '360': 500,
          '480': 1000,
          '720': 2500,
          '1080': 5000,
          'best': 5000,
          'mp3': 192
        };

        const sizes = {};
        for (const [quality, kbps] of Object.entries(bitrates)) {
          const bytes = (duration * kbps * 1000) / 8;
          if (bytes < 1024 * 1024) {
            sizes[quality] = (bytes / (1024)).toFixed(1) + ' KB';
          } else if (bytes < 1024 * 1024 * 1024) {
            sizes[quality] = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          } else {
            sizes[quality] = (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
          }
        }

        res.json({
          title,
          duration,
          durationFormatted: Math.floor(duration / 60) + ':' + String(Math.floor(duration % 60)).padStart(2, '0'),
          sizes
        });
      } catch (e) {
        console.error('❌ JSON parse error:', e.message);
        res.status(500).json({ error: 'Video bilgisi parse edilemedi' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  try {
    execSync(`"${ytDlpPath}" --version`, { stdio: 'pipe' });
    res.json({ status: 'ok', yt_dlp: true });
  } catch {
    res.json({ status: 'ok', yt_dlp: false });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎬 Video İndirici Backend ${PORT} portunda çalışıyor`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  try {
    execSync(`"${ytDlpPath}" --version`, { stdio: 'pipe' });
    console.log('✅ yt-dlp: HAZIR\n');
  } catch {
    console.warn('⚠️  yt-dlp yüklü değil. Lütfen şunları çalıştırın:');
    console.warn('   brew install yt-dlp\n');
  }
});
