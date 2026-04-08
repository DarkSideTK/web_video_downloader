import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('720')
  const [downloadPath, setDownloadPath] = useState('~/Downloads')
  const [downloads, setDownloads] = useState({})
  const [history, setHistory] = useState([])
  const [showVideoInfo, setShowVideoInfo] = useState(false)
  const [videoInfo, setVideoInfo] = useState(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [error, setError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('downloadHistory')
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('downloadHistory', JSON.stringify(history))
  }, [history])

  const getVideoInfo = async () => {
    if (!url.trim()) {
      setError('Lütfen bir URL girin')
      return
    }

    setError('')
    setIsLoadingInfo(true)
    try {
      const response = await axios.get(`${API_URL}/api/video-info`, {
        params: { url }
      })
      setVideoInfo(response.data)
      setShowVideoInfo(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Video bilgisi alınamadı')
    } finally {
      setIsLoadingInfo(false)
    }
  }

  const startDownload = async () => {
    if (!url.trim()) {
      setError('Lütfen bir URL girin')
      return
    }

    setError('')
    setIsDownloading(true)

    try {
      const response = await axios.post(`${API_URL}/api/download`, {
        url,
        format,
        quality: format === 'mp3' ? null : quality,
        path: downloadPath || '~/Downloads'
      })

      const downloadId = response.data.downloadId
      setDownloads(prev => ({
        ...prev,
        [downloadId]: {
          id: downloadId,
          url,
          format,
          quality: format === 'mp3' ? 'MP3' : quality,
          status: 'starting',
          percent: 0,
          fileName: null
        }
      }))

      // Add to history
      const historyItem = {
        id: downloadId,
        url,
        format,
        quality: format === 'mp3' ? 'MP3' : quality,
        timestamp: new Date().toLocaleString('tr-TR')
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 19)])

      // Clear form
      setUrl('')
      setFormat('mp4')
      setQuality('720')

      // Poll progress
      pollProgress(downloadId)
    } catch (err) {
      setError(err.response?.data?.error || 'İndirme başlatılamadı')
    } finally {
      setIsDownloading(false)
    }
  }

  const pollProgress = async (downloadId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/progress/${downloadId}`)
        const progress = response.data

        setDownloads(prev => ({
          ...prev,
          [downloadId]: {
            ...prev[downloadId],
            ...progress
          }
        }))

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(interval)
        }
      } catch (err) {
        clearInterval(interval)
      }
    }, 500)
  }

  const clearError = () => setError('')

  return (
    <div className="container">
      <div className="header">
        <h1>🎬 Video İndirici</h1>
        <p>YouTube, TikTok, Instagram ve diğer platformlardan video indir</p>
      </div>

      <div className="form-group">
        <label htmlFor="url">Video URL'si</label>
        <input
          id="url"
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && startDownload()}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="format">Format</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="mp4">Video (MP4)</option>
            <option value="mp3">Ses (MP3)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quality">Kalite</label>
          <select
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            disabled={format === 'mp3'}
          >
            <option value="1080">1080p</option>
            <option value="720">720p</option>
            <option value="480">480p</option>
            <option value="360">360p</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="path">İndirme Klasörü</label>
        <input
          id="path"
          type="text"
          placeholder="~/Downloads"
          value={downloadPath}
          onChange={(e) => setDownloadPath(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button
            className="btn-secondary"
            onClick={clearError}
            style={{ marginTop: '8px' }}
          >
            Kapat
          </button>
        </div>
      )}

      <div className="button-group">
        <button
          className="btn-primary"
          onClick={startDownload}
          disabled={!url || isDownloading || isLoadingInfo}
        >
          {isDownloading ? 'İndiriliyor...' : '📥 İndir'}
        </button>
        <button
          className="btn-primary"
          onClick={getVideoInfo}
          disabled={!url || isLoadingInfo}
          style={{ background: '#f0f0f0', color: '#333' }}
        >
          {isLoadingInfo ? 'Yükleniyor...' : 'ℹ️ Bilgi'}
        </button>
      </div>

      {Object.keys(downloads).length > 0 && (
        <div className="progress-container">
          <h3>Active Downloads</h3>
          {Object.values(downloads).map(download => (
            <div key={download.id} className="progress-item">
              <h3>{download.fileName || 'İndiriliyor...'}</h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${download.percent}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>
                  {download.format.toUpperCase()} ({download.quality})
                </span>
                <span>
                  <span className={`status-badge status-${download.status}`}>
                    {download.status === 'downloading' && <span className="loading"></span>}
                    {download.status}
                  </span>
                </span>
              </div>
              {download.percent && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  {download.percent.toFixed(1)}%
                </div>
              )}
              {download.error && (
                <div className="error-message" style={{ marginTop: '10px' }}>
                  {download.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="history">
          <h3>İndirme Geçmişi (Son 20)</h3>
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item">
                <strong>{item.format.toUpperCase()} ({item.quality})</strong>
                <div>{item.url}</div>
                <small>{item.timestamp}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {showVideoInfo && videoInfo && (
        <div className="info-modal active">
          <div className="modal-content">
            <h2>Video Bilgileri</h2>
            <div className="modal-info">
              <strong>Başlık</strong>
              <span>{videoInfo.title}</span>
            </div>
            <div className="modal-info">
              <strong>Süre</strong>
              <span>{videoInfo.durationFormatted}</span>
            </div>
            <div className="modal-info">
              <strong>Tahmini Dosya Boyutları</strong>
              <div style={{ marginTop: '8px' }}>
                {Object.entries(videoInfo.sizes).map(([quality, size]) => (
                  <div key={quality} style={{ fontSize: '12px', marginBottom: '4px' }}>
                    {quality.toUpperCase()}: {size}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-close"
                onClick={() => setShowVideoInfo(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
