# 🎬 Web Video Downloader

YouTube, TikTok, Instagram, Twitter/X, Facebook ve daha birçok platformdan video ve müzik indirmek için modern web uygulaması.

## ✨ Özellikler

- 🎥 **Video İndirme**: Birden fazla formatı destekler (MP4, MP3)
- 📊 **Kalite Seçimi**: 360p, 480p, 720p, 1080p seçenekleri
- 📈 **Real-time Progress**: İndirme ilerlemesini canlı takip et
- 📋 **İndirme Geçmişi**: Yerel kayıtlı geçmiş (son 20 indirme)
- 🎨 **Modern UI**: React + Vite ile yapılmış responsive arayüz
- 🌐 **Cloud Deployed**: Netlify (Frontend) + Railway (Backend)
- 🔒 **Güvenli**: Lokal indirme, sunucu tarafında işlem yok
- ⚡ **Hızlı**: Optimized build ve minimal dependencies

## 📋 Sistem Gereksinimleri

### Backend
- **Node.js** 18+ 
- **yt-dlp** (Video indirme aracı)

```bash
# macOS
brew install yt-dlp

# Linux (Ubuntu/Debian)
sudo apt-get install yt-dlp

# Windows
winget install yt-dlp
```

### Frontend
- **Node.js** 18+
- Modern web browser

## 🚀 Local Development

### 1. Repository'yi clone et

```bash
git clone https://github.com/yourusername/web_video_downloader.git
cd web_video_downloader
```

### 2. Backend'i kur

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend şu adreste çalışacak: `http://localhost:3000`

### 3. Frontend'i kur (ayrı terminalden)

```bash
cd frontend
npm install
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:5173`

### 4. Tarayıcıda aç

```
http://localhost:5173
```

## 📦 Production Deployment

### Frontend - Netlify

1. **Repository'yi GitHub'a push et**

2. **Netlify'e giriş yap**
   - [netlify.com](https://netlify.com) ziyaret et
   - GitHub ile bağlan

3. **Yeni site oluştur**
   - Repository seç
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`

4. **Environment variable ekle**
   - Site settings → Build & deploy → Environment
   - `VITE_API_URL`: Backend URL'ini gir (örn: `https://your-backend.railway.app`)

### Backend - Railway

1. **Railway'e giriş yap**
   - [railway.app](https://railway.app) ziyaret et
   - GitHub ile bağlan

2. **Yeni proje oluştur**
   - Repository seç
   - `backend` klasörünü root olarak ayarla

3. **Environment variables ekle**
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Frontend URL'ini gir (Netlify URL'i)
   - `PORT`: Railway otomatik belirler

4. **Deploy et**
   - Railway otomatik olarak deploy edecek

## 🏗️ Proje Yapısı

```
web_video_downloader/
├── frontend/                 # React + Vite aplikasyon
│   ├── src/
│   │   ├── App.jsx          # Ana React komponenti
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite konfigurasyonu
│   ├── netlify.toml         # Netlify deploy config
│   └── .env.example         # Environment template
│
├── backend/                  # Express.js API
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   ├── railway.json         # Railway deploy config
│   ├── .env.example         # Environment template
│   └── .gitignore
│
├── README.md                # Bu dosya
└── .gitignore
```

## 🌐 API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/download` | POST | Video/müzik indirme işlemini başlat |
| `/api/progress/:downloadId` | GET | İndirme ilerlemesini kontrol et |
| `/api/video-info` | GET | Video bilgisi ve tahmini dosya boyutu |
| `/api/health` | GET | Backend sağlık kontrolü |

### Download Endpoint

```bash
curl -X POST http://localhost:3000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtube.com/watch?v=...",
    "format": "mp4",
    "quality": "720",
    "path": "~/Downloads"
  }'
```

Response:
```json
{
  "success": true,
  "downloadId": "1234567890",
  "message": "İndirme başlatıldı"
}
```

## 🛠️ Sorun Giderme

### "yt-dlp bulunamadı" hatası

```bash
# Kontrol et
yt-dlp --version

# Yoksa yükle
brew install yt-dlp  # macOS
sudo apt-get install yt-dlp  # Linux
winget install yt-dlp  # Windows
```

### CORS hatası

- `FRONTEND_URL` environment variable'ının doğru ayarlanmış olduğundan emin ol
- Development için `FRONTEND_URL=http://localhost:5173` ayarla
- Production için `FRONTEND_URL=https://your-netlify-domain.netlify.app` ayarla

### İndirme başlamıyor

1. URL'nin geçerli olduğundan emin ol
2. İnternet bağlantısını kontrol et
3. Backend logs'unu kontrol et: `npm run dev`
4. yt-dlp'nin çalışıp çalışmadığını kontrol et: `yt-dlp --version`

## 📝 Environment Variables

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 🔒 Güvenlik

- ✅ Frontend'de video indirme - sunucu tarafında işlem yok
- ✅ URL validasyonu her endpoint'te
- ✅ CORS yapılandırması
- ✅ Sandbox environment
- ✅ Lokal indirme - hiç upload yok

## 📄 Lisans

MIT License - Bkz: [LICENSE](LICENSE)

## 🤝 Katkı

Katkılar hoşlanır!

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit et (`git commit -m 'Add amazing feature'`)
4. Push et (`git push origin feature/amazing-feature`)
5. Pull Request aç

## 📧 İletişim

Soru veya öneriniz mi var? Issues açabilirsiniz.

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-08
