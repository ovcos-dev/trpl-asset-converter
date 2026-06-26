import { useState, useRef } from 'react'

function FileList({ files, onFilesChange, extraColumns, extraHeader }) {
    const [sortOrder, setSortOrder] = useState(null)
    const dragIndex = useRef(null)
    const dragOverIndex = useRef(null)

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    const toggleSelect = (index) => {
        onFilesChange(files.map((f, i) => i === index ? { ...f, selected: !f.selected } : f))
    }

    const selectAll = () => onFilesChange(files.map(f => ({ ...f, selected: true })))
    const deselectAll = () => onFilesChange(files.map(f => ({ ...f, selected: false })))
    const deleteSelected = () => onFilesChange(files.filter(f => !f.selected))

    const sortAsc = () => {
        setSortOrder('asc')
        onFilesChange([...files].sort((a, b) => a.file.name.localeCompare(b.file.name)))
    }

    const sortDesc = () => {
        setSortOrder('desc')
        onFilesChange([...files].sort((a, b) => b.file.name.localeCompare(a.file.name)))
    }

    const handleDragStart = (index) => {
        dragIndex.current = index
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        dragOverIndex.current = index
    }

    const handleDrop = () => {
        if (dragIndex.current === null || dragOverIndex.current === null) return
        if (dragIndex.current === dragOverIndex.current) return

        const updated = [...files]
        const draggingItem = updated[dragIndex.current]

        if (draggingItem.selected) {
            // 선택된 항목들 전체 이동
            const selected = updated.filter(f => f.selected)
            const notSelected = updated.filter(f => !f.selected)

            // 드롭 위치를 선택되지 않은 항목 기준으로 계산
            const dropItem = updated[dragOverIndex.current]
            const dropIndexInNotSelected = notSelected.findIndex(f => f === dropItem)

            if (dropIndexInNotSelected === -1) {
                // 드롭 위치가 선택된 항목이면 맨 끝에 추가
                notSelected.push(...selected)
                onFilesChange(notSelected)
            } else {
                const insertIndex = dragOverIndex.current > dragIndex.current
                    ? dropIndexInNotSelected + 1
                    : dropIndexInNotSelected
                notSelected.splice(insertIndex, 0, ...selected)
                onFilesChange(notSelected)
            }
        } else {
            // 단일 항목 이동
            const dragged = updated.splice(dragIndex.current, 1)[0]
            updated.splice(dragOverIndex.current, 0, dragged)
            onFilesChange(updated)
        }

        dragIndex.current = null
        dragOverIndex.current = null
        setSortOrder(null)
    }

    const selectedCount = files.filter(f => f.selected).length
    const gridCols = extraColumns
        ? `20px 1fr 100px 80px ${extraColumns.width}`
        : '20px 1fr 100px 80px'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={selectAll} style={{ padding: '5px 12px', fontSize: '12px', background: '#F2F4F6', color: '#4E5968', borderRadius: '8px' }}>전체선택</button>
                <button onClick={deselectAll} style={{ padding: '5px 12px', fontSize: '12px', background: '#F2F4F6', color: '#4E5968', borderRadius: '8px' }}>선택해제</button>
                <button
                    onClick={deleteSelected}
                    disabled={selectedCount === 0}
                    style={{
                        padding: '5px 12px', fontSize: '12px', borderRadius: '8px',
                        background: selectedCount > 0 ? '#FFF0F0' : '#F2F4F6',
                        color: selectedCount > 0 ? '#F04452' : '#B0B8C1',
                    }}
                >
                    삭제 {selectedCount > 0 ? `(${selectedCount})` : ''}
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                        onClick={sortAsc}
                        style={{
                            padding: '5px 10px', fontSize: '12px', borderRadius: '8px',
                            background: sortOrder === 'asc' ? '#3182F6' : '#F2F4F6',
                            color: sortOrder === 'asc' ? 'white' : '#4E5968',
                        }}
                    >
                        이름 ↑
                    </button>
                    <button
                        onClick={sortDesc}
                        style={{
                            padding: '5px 10px', fontSize: '12px', borderRadius: '8px',
                            background: sortOrder === 'desc' ? '#3182F6' : '#F2F4F6',
                            color: sortOrder === 'desc' ? 'white' : '#4E5968',
                        }}
                    >
                        이름 ↓
                    </button>
                    <span style={{ fontSize: '12px', color: '#8B95A1', marginLeft: '4px' }}>{files.length}개</span>
                </div>
            </div>

            <div className="file-table">
                <div className="file-table-header" style={{ gridTemplateColumns: gridCols }}>
                    <span></span>
                    <span>파일명</span>
                    <span style={{ textAlign: 'center' }}>해상도</span>
                    <span style={{ textAlign: 'right' }}>용량</span>
                    {extraHeader && <span style={{ textAlign: 'center' }}>{extraHeader}</span>}
                </div>
                {files.map((item, i) => (
                    <div
                        key={i}
                        className={`file-table-row ${item.selected ? 'selected' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={handleDrop}
                        style={{ cursor: 'grab', gridTemplateColumns: gridCols }}
                    >
                        <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelect(i)}
                            style={{ width: '15px', height: '15px', accentColor: '#3182F6', cursor: 'pointer' }}
                        />
                        <span className="col-name">{item.file.name}</span>
                        <span className="col-res">{item.width}×{item.height}</span>
                        <span className="col-size">{formatSize(item.file.size)}</span>
                        {extraColumns && extraColumns.render(item, i)}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FileList