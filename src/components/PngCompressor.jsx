import { useState } from 'react'
import ResizeOptions from './ResizeOptions'
import FileList from './FileList'

const { ipcRenderer } = window.require('electron')

async function getImageSize(file) {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = url
    })
}

function PngCompressor() {
    const [files, setFiles] = useState([])
    const [quality, setQuality] = useState(97)

    const [resize, setResize] = useState(null)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [suffix, setSuffix] = useState('')

    const addFiles = async (newFiles) => {
        const filtered = newFiles.filter(f => f.type === 'image/png')
        const withMeta = await Promise.all(filtered.map(async (file) => {
            const { width, height } = await getImageSize(file)
            return { file, width, height, selected: true }
        }))
        setFiles(prev => [...prev, ...withMeta])
    }

    const handleFiles = (e) => addFiles(Array.from(e.target.files))
    const handleDrop = (e) => {
        e.preventDefault()
        addFiles(Array.from(e.dataTransfer.files))
    }

    const selectedCount = files.filter(f => f.selected).length

    const compress = async () => {
        if (!selectedCount) return
        setLoading(true)
        setFiles(prev => prev.map(f => ({ ...f, selected: false })))

        const selectedFiles = files.filter(f => f.selected)
        const resizeOption = resize?.percent
            ? { width: null, height: null, percent: resize.percent }
            : resize

        for (const item of selectedFiles) {
            try {
                const arrayBuffer = await item.file.arrayBuffer()
                const result = await ipcRenderer.invoke('compress-png', {
                    buffer: arrayBuffer,
                    dithering: 1.0,
                    resize: resizeOption,
                    quality,
                })
                const blob = new Blob([result.buffer], { type: 'image/png' })
                setResults(prev => [...prev, {
                    name: item.file.name.replace('.png', `${suffix}.png`),
                    origSize: result.origSize,
                    newSize: result.newSize,
                    blob,
                    buffer: result.buffer,
                }])
            } catch (err) {
                console.error(err)
                setResults(prev => [...prev, { name: item.file.name, error: true }])
            }
        }

        setLoading(false)
    }

    const deleteResult = (index) => {
        setResults(prev => prev.filter((_, i) => i !== index))
    }

    const download = (result) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(result.blob)
        a.download = result.name
        a.click()
    }

    const downloadAll = async () => {
        const validResults = results.filter(r => !r.error)
        const { canceled, folder } = await ipcRenderer.invoke('save-files',
            validResults.map(r => ({ name: r.name, buffer: r.buffer }))
        )
        if (!canceled) alert(`${folder} 에 저장되었습니다.`)
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    return (
        <div className="tool-panel">
            <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('png-input').click()}
            >
                <p>PNG 파일을 드래그하거나 클릭해서 선택</p>
                <span>여러 파일 동시 처리 가능</span>
                <input
                    id="png-input"
                    type="file"
                    accept="image/png"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFiles}
                />
            </div>

            {files.length > 0 && (
                <FileList files={files} onFilesChange={setFiles} />
            )}

            <div className="options">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#333D4B' }}>저장 suffix</span>
                    <input
                        type="text"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder="예: _compressed"
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#333D4B', minWidth: '28px' }}>품질</span>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#3182F6' }}
                    />
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Math.min(100, Math.max(1, Number(e.target.value))))}
                        style={{ width: '52px', textAlign: 'center', padding: '4px 6px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                    />
                </div>
                <ResizeOptions onChange={setResize} />
            </div>

            <button onClick={compress} disabled={!selectedCount || loading}>
                {loading ? '압축 중...' : `압축 시작 ${selectedCount > 0 ? `(${selectedCount}개)` : ''}`}
            </button>

            {results.length > 0 && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#8B95A1' }}>{results.filter(r => !r.error).length}개 완료</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                onClick={downloadAll}
                                style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#EBF3FF', color: '#3182F6', borderRadius: '8px' }}
                            >
                                전체 저장
                            </button>
                            <button
                                onClick={() => setResults([])}
                                style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: '#FFF0F0', color: '#F04452', borderRadius: '8px' }}
                            >
                                전체 삭제
                            </button>
                        </div>
                    </div>
                    <div className="results">
                        {results.map((r, i) => (
                            <div key={i} className="result-item">
                                {r.error ? (
                                    <>
                                        <span className="error">{r.name} - 실패</span>
                                        <button onClick={() => deleteResult(i)} style={{ padding: '4px 10px', fontSize: '12px', background: '#FFF0F0', color: '#F04452', borderRadius: '8px', marginLeft: 'auto' }}>삭제</button>
                                    </>
                                ) : (
                                    <>
                                        <span>{r.name}</span>
                                        <span>{formatSize(r.origSize)} → {formatSize(r.newSize)}</span>
                                        <span className="saving">-{((r.origSize - r.newSize) / r.origSize * 100).toFixed(1)}%</span>
                                        <button onClick={() => download(r)}>저장</button>
                                        <button onClick={() => deleteResult(i)} style={{ padding: '4px 10px', fontSize: '12px', background: '#FFF0F0', color: '#F04452', borderRadius: '8px' }}>삭제</button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default PngCompressor