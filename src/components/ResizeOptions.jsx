import { useState, useEffect } from 'react'

function ResizeOptions({ onChange }) {
    const [enabled, setEnabled] = useState(false)
    const [mode, setMode] = useState('percent')
    const [percent, setPercent] = useState(50)
    const [width, setWidth] = useState('')
    const [height, setHeight] = useState('')

    useEffect(() => {
        if (!enabled) {
            onChange(null)
            return
        }

        if (mode === 'percent') {
            onChange({ percent })
        } else {
            const w = width && Number(width) > 0 ? Number(width) : null
            const h = height && Number(height) > 0 ? Number(height) : null
            onChange({
                width: w,
                height: h,
                fill: !!(w && h),
            })
        }
    }, [enabled, mode, percent, width, height])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '14px' }}>
                <input
                    type="checkbox"
                    id="resize-enable"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#3182F6', cursor: 'pointer', flexShrink: 0 }}
                />
                <span
                    onClick={() => setEnabled(!enabled)}
                    style={{ cursor: 'pointer', color: '#333D4B' }}
                >
                    리사이즈
                </span>
            </div>

            {enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setMode('percent')}
                            style={{
                                padding: '5px 14px',
                                fontSize: '13px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: mode === 'percent' ? '#3182F6' : '#F2F4F6',
                                color: mode === 'percent' ? 'white' : '#4E5968',
                            }}
                        >
                            비율 (%)
                        </button>
                        <button
                            onClick={() => setMode('px')}
                            style={{
                                padding: '5px 14px',
                                fontSize: '13px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: mode === 'px' ? '#3182F6' : '#F2F4F6',
                                color: mode === 'px' ? 'white' : '#4E5968',
                            }}
                        >
                            픽셀 (px)
                        </button>
                    </div>

                    {mode === 'percent' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                            <span>비율</span>
                            <input
                                type="range"
                                min="1"
                                max="99"
                                value={percent}
                                onChange={(e) => setPercent(Number(e.target.value))}
                                style={{ flex: 1, accentColor: '#3182F6' }}
                            />
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={percent}
                                onChange={(e) => setPercent(Math.min(99, Math.max(1, Number(e.target.value))))}
                                style={{ width: '52px', textAlign: 'center', padding: '4px 6px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                            <span style={{ fontSize: '13px', color: '#3182F6', fontWeight: 600 }}>%</span>
                        </div>
                    )}

                    {mode === 'px' && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                가로
                                <input
                                    type="number"
                                    min="1"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    placeholder="auto"
                                    style={{ width: '80px', padding: '6px 10px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                                />
                            </label>
                            <span style={{ color: '#8B95A1' }}>×</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                세로
                                <input
                                    type="number"
                                    min="1"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="auto"
                                    style={{ width: '80px', padding: '6px 10px', border: '1px solid #E5E8EB', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                                />
                            </label>
                            <span style={{ fontSize: '12px', color: '#8B95A1' }}>비워두면 비율 유지</span>

                            {(width && Number(width) < 10 || height && Number(height) < 10) && (
                                <span style={{ fontSize: '12px', color: '#F04452' }}>너무 작은 값은 출력이 불안정할 수 있어요</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ResizeOptions