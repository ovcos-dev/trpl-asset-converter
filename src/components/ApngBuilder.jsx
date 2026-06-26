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

function ApngBuilder() {
    const [frames, setFrames] = useState([])
    const [delay, setDelay] = useState(100)
    const [loops, setLoops] = useState(0)
    const [quality, setQuality] = useState(95)
    const [unlockLow, setUnlockLow] = useState(false)
    const [skipFirst, setSkipFirst] = useState(false)
    const [resize, setResize] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const addFiles = async (newFiles) => {
        const filtered = newFiles.filter(f => f.type === 'image/png')
        const withMeta = await Promise.all(filtered.map(async (file, i) => {
            const { width, height } = await getImageSize(file)
            return { file, width, height, selected: true, delay: 100 }
        }))
        setFrames(prev => [...prev, ...withMeta])
        setResult(null)
    }

    const handleFiles = (e) => addFiles(Array.from(e.target.files))
    const handleDrop = (e) => {
        e.preventDefault()
        addFiles(Array.from(e.dataTransfer.files))
    }

    const toggleSelect = (index) => {
        setFrames(prev => prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f))
    }

    const selectAll = () => setFrames(prev => prev.map(f => ({ ...f, selected: true })))
    const deselectAll = () => setFrames(prev => prev.map(f => ({ ...f, selected: false })))
    const deleteSelected = () => {
        setFrames(prev => prev.filter(f => !f.selected))
        setResult(null)
    }

    const updateFrameDelay = (index, value) => {
        const updated = [...frames]
        updated[index].delay = Number(value)
        setFrames(updated)
    }

    const moveFrame = (index, direction) => {
        const updated = [...frames]
        const target = index + direction
        if (target < 0 || target >= updated.length) return
            ;[updated[index], updated[target]] = [updated[target], updated[index]]
        setFrames(updated)
    }

    const applyDelayToAll = () => {
        setFrames(frames.map(f => ({ ...f, delay })))
    }

    const build = async () => {
        const selectedFrames = frames.filter(f => f.selected)
        if (selectedFrames.length < 2) return
        setLoading(true)
        setFrames(prev => prev.map(f => ({ ...f, selected: false })))
        setResult(null)

        try {
            const frameBuffers = []
            for (const frame of selectedFrames) {
                const ab = await frame.file.arrayBuffer()
                frameBuffers.push(ab)
            }

            const actualQuality = unlockLow ? quality : Math.max(quality, 80)
            const resizeOption = resize?.percent
                ? { percent: resize.percent }
                : (resize?.width || resize?.height)
                    ? { width: resize.width || null, height: resize.height || null, fill: resize.fill }
                    : null


            const delays = selectedFrames.map(f => f.delay)

            const result = await ipcRenderer.invoke('compress-frames', {
                frames: frameBuffers,
                quality: actualQuality,
                dithering: 1.0,
                resize: resizeOption,
                delays,
                loops,
                skipFirst,
            })



            const blob = new Blob([new Uint8Array(result.buffer)], { type: 'image/png' })
            const url = URL.createObjectURL(blob)

            setResult({ blob, url, size: result.size })

        } catch (err) {
            console.error(err)
            alert('APNG 생성 중 오류가 발생했습니다.')
        }

        setLoading(false)
    }

    const download = () => {
        const a = document.createElement('a')
        a.href = result.url
        a.download = 'animation.apng'
        a.click()
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    const selectedCount = frames.filter(f => f.selected).length

    return (
        <div className="tool-panel">
            <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('apng-input').click()}
            >
                <p>PNG 프레임들을 드래그하거나 클릭해서 선택</p>
                <span>2개 이상 선택 · 순서대로 애니메이션이 됩니다</span>
                <input
                    id="apng-input"
                    type="file"
                    accept="image/png"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFiles}
                />
            </div>

            {frames.length > 0 && (
                <>
                    <FileList
                        files={frames}
                        onFilesChange={setFrames}
                        extraHeader="딜레이(ms)"
                        extraColumns={{
                            width: '160px',
                            render: (item, i) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                    <input
                                        type="number"
                                        min="10"
                                        max="10000"
                                        value={item.delay}
                                        onChange={(e) => {
                                            const updated = [...frames]
                                            updated[i].delay = Number(e.target.value)
                                            setFrames(updated)
                                        }}
                                        style={{ width: '65px', padding: '4px 6px', border: '1px solid #E5E8EB', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                                    />
                                    <button
                                        onClick={() => {
                                            const updated = [...frames]
                                            if (i > 0) { [updated[i], updated[i - 1]] = [updated[i - 1], updated[i]]; setFrames(updated) }
                                        }}
                                        disabled={i === 0}
                                        style={{ padding: '3px 7px', fontSize: '11px', background: '#F2F4F6', color: '#4E5968', borderRadius: '6px' }}
                                    >↑</button>
                                    <button
                                        onClick={() => {
                                            const updated = [...frames]
                                            if (i < frames.length - 1) { [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]]; setFrames(updated) }
                                        }}
                                        disabled={i === frames.length - 1}
                                        style={{ padding: '3px 7px', fontSize: '11px', background: '#F2F4F6', color: '#4E5968', borderRadius: '6px' }}
                                    >↓</button>
                                </div>
                            )
                        }}
                    />



                    <div className="options">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333D4B' }}>전체 딜레이 (ms)</span>
                            <input
                                type="number"
                                min="10"
                                max="10000"
                                value={delay}
                                onChange={(e) => setDelay(Number(e.target.value))}
                                style={{ width: '80px', padding: '6px 10px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                            <button
                                onClick={applyDelayToAll}
                                style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, background: '#EBF3FF', color: '#3182F6', borderRadius: '8px' }}
                            >
                                전체 적용
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333D4B' }}>반복 횟수</span>
                            <input
                                type="number"
                                min="0"
                                max="999"
                                value={loops}
                                onChange={(e) => setLoops(Number(e.target.value))}
                                style={{ width: '80px', padding: '6px 10px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                            <span style={{ fontSize: '12px', color: '#8B95A1' }}>0 = 무한반복</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333D4B', minWidth: '28px' }}>품질</span>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={quality}
                                onChange={(e) => {
                                    const val = Number(e.target.value)
                                    setQuality(unlockLow ? val : Math.max(val, 80))
                                }}
                                style={{ flex: 1, accentColor: '#3182F6' }}
                            />
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={unlockLow ? quality : Math.max(quality, 80)}
                                onChange={(e) => {
                                    const val = Math.min(100, Math.max(1, Number(e.target.value)))
                                    setQuality(unlockLow ? val : Math.max(val, 80))
                                }}
                                style={{ width: '52px', textAlign: 'center', padding: '4px 6px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="unlockLow-apng"
                                checked={unlockLow}
                                onChange={(e) => {
                                    setUnlockLow(e.target.checked)
                                    if (!e.target.checked) setQuality(Math.max(quality, 80))
                                }}
                                style={{ width: '15px', height: '15px', accentColor: '#3182F6', cursor: 'pointer' }}
                            />
                            <label htmlFor="unlockLow-apng" style={{ fontSize: '14px', color: '#333D4B', cursor: 'pointer' }}>
                                80 이하 품질 허용 (품질 저하 주의)
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="skipFirst-apng"
                                checked={skipFirst}
                                onChange={(e) => setSkipFirst(e.target.checked)}
                                style={{ width: '15px', height: '15px', accentColor: '#3182F6', cursor: 'pointer' }}
                            />
                            <label htmlFor="skipFirst-apng" style={{ fontSize: '14px', color: '#333D4B', cursor: 'pointer' }}>
                                첫 프레임을 커버 이미지로 사용
                            </label>
                        </div>
                        <ResizeOptions onChange={setResize} />
                    </div>
                </>
            )}

            <button onClick={build} disabled={frames.filter(f => f.selected).length < 2 || loading}>
                {loading ? 'APNG 생성 중...' : `APNG 만들기 ${frames.filter(f => f.selected).length > 0 ? `(${frames.filter(f => f.selected).length}개)` : ''}`}
            </button>

            {result && (
                <div className="apng-result">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>미리보기</h3>
                        <button
                            onClick={() => setResult(null)}
                            style={{ padding: '4px 10px', fontSize: '12px', background: '#FFF0F0', color: '#F04452', borderRadius: '8px' }}
                        >
                            닫기
                        </button>
                    </div>
                    <img src={result.url} alt="APNG 미리보기" style={{ maxWidth: '100%' }} />
                    <p>파일 크기: {formatSize(result.size)}</p>
                    <button onClick={download}>APNG 다운로드</button>
                </div>
            )}
        </div>
    )
}

export default ApngBuilder