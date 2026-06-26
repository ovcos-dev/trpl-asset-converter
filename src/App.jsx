import { useState } from 'react'
import PngCompressor from './components/PngCompressor'
import WebpConverter from './components/WebpConverter'
import ApngBuilder from './components/ApngBuilder'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('png')

  return (
    <div className="app">
      <h1>[trpl] Asset Converter</h1>
      <div className="tabs">
        <button
          className={activeTab === 'png' ? 'active' : ''}
          onClick={() => setActiveTab('png')}
        >
          PNG 압축
        </button>
        <button
          className={activeTab === 'webp' ? 'active' : ''}
          onClick={() => setActiveTab('webp')}
        >
          WebP 변환
        </button>
        <button
          className={activeTab === 'apng' ? 'active' : ''}
          onClick={() => setActiveTab('apng')}
        >
          APNG 만들기
        </button>
      </div>
      <div className="tab-content">
        <div style={{ display: activeTab === 'png' ? 'block' : 'none' }}>
          <PngCompressor />
        </div>
        <div style={{ display: activeTab === 'webp' ? 'block' : 'none' }}>
          <WebpConverter />
        </div>
        <div style={{ display: activeTab === 'apng' ? 'block' : 'none' }}>
          <ApngBuilder />
        </div>
      </div>

      <div className="made-by">made by ovcos©</div>



    </div>
  )
}

export default App