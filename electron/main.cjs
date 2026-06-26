const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
        }
    })

    if (isDev) {
        win.loadURL('http://localhost:5173')
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()

    ipcMain.handle('save-files', async (event, files) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: '저장할 폴더 선택',
        })
        if (canceled || !filePaths.length) return { canceled: true }
        const folder = filePaths[0]
        for (const file of files) {
            const buffer = Buffer.from(file.buffer)
            const filePath = path.join(folder, file.name)
            fs.writeFileSync(filePath, buffer)
        }
        return { canceled: false, folder }
    })

    ipcMain.handle('compress-png', async (event, { buffer, quality, dithering, resize }) => {
        const sharp = require('sharp')
        const inputBuffer = Buffer.from(buffer)
        let pipeline = sharp(inputBuffer)
        if (resize) {
            if (resize.percent) {
                const meta = await sharp(inputBuffer).metadata()
                pipeline = pipeline.resize({
                    width: Math.round(meta.width * resize.percent / 100),
                    height: Math.round(meta.height * resize.percent / 100),
                    fit: 'fill',
                })
            } else {
                pipeline = pipeline.resize({
                    width: resize.width || null,
                    height: resize.height || null,
                    fit: resize.fill ? 'fill' : 'inside',
                    withoutEnlargement: true,
                })
            }
        }
        const outputBuffer = await pipeline
            .png({ effort: 10 })
            .toColourspace('srgb')
            .toBuffer()
        return {
            buffer: outputBuffer,
            origSize: inputBuffer.length,
            newSize: outputBuffer.length,
        }
    })

    ipcMain.handle('convert-webp', async (event, { buffer, quality, resize }) => {
        const sharp = require('sharp')
        const inputBuffer = Buffer.from(buffer)
        let pipeline = sharp(inputBuffer)
        if (resize) {
            if (resize.percent) {
                const meta = await sharp(inputBuffer).metadata()
                pipeline = pipeline.resize({
                    width: Math.round(meta.width * resize.percent / 100),
                    height: Math.round(meta.height * resize.percent / 100),
                    fit: 'fill',
                })
            } else {
                pipeline = pipeline.resize({
                    width: resize.width || null,
                    height: resize.height || null,
                    fit: resize.fill ? 'fill' : 'inside',
                    withoutEnlargement: true,
                })
            }
        }
        const outputBuffer = await pipeline
            .png({ effort: 10 })
            .toColourspace('srgb')
            .toBuffer()
        return {
            buffer: outputBuffer,
            origSize: inputBuffer.length,
            newSize: outputBuffer.length,
        }
    })

    ipcMain.handle('compress-frames', async (event, { frames, quality, dithering, resize, delays, loops, skipFirst }) => {
        const sharp = require('sharp')
        const apng = require('sharp-apng')
        const os = require('os')

        const sharpFrames = []

        for (const frame of frames) {
            const inputBuffer = Buffer.from(frame)
            let pipeline = sharp(inputBuffer)

            if (resize) {
                if (resize.percent) {
                    const meta = await sharp(inputBuffer).metadata()
                    pipeline = pipeline.resize({
                        width: Math.round(meta.width * resize.percent / 100),
                        height: Math.round(meta.height * resize.percent / 100),
                        fit: 'fill',
                    })
                } else {
                    pipeline = pipeline.resize({
                        width: resize.width || null,
                        height: resize.height || null,
                        fit: resize.fill ? 'fill' : 'inside',
                        withoutEnlargement: true,
                    })
                }
                // 항상 버퍼로 변환 후 새 sharp 인스턴스로 만들기
                const processedBuffer = await pipeline.png().toBuffer()
                sharpFrames.push(sharp(processedBuffer))
            } else {
                sharpFrames.push(pipeline)
            }
        }

        const tmpFile = path.join(os.tmpdir(), `apng_${Date.now()}.png`)

        await apng.framesToApng(sharpFrames, tmpFile, {
            delay: delays,
            repeat: loops,
            cnum: 0,
        })

        const outputBuffer = fs.readFileSync(tmpFile)
        fs.unlinkSync(tmpFile)

        return {
            buffer: Array.from(outputBuffer),
            size: outputBuffer.length,
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})