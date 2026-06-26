async function loadWasm() {
  const jsResponse = await fetch('/png-tool/wasm/libimagequant_wasm.js')
  const jsText = await jsResponse.text()
  const wasmResponse = await fetch('/png-tool/wasm/libimagequant_wasm_bg.wasm')
  const wasmBuffer = await wasmResponse.arrayBuffer()
  const blob = new Blob([jsText], { type: 'application/javascript' })
  const blobUrl = URL.createObjectURL(blob)
  const wasmModule = await import(/* @vite-ignore */ blobUrl)
  await wasmModule.default(wasmBuffer)
  return wasmModule
}

async function test() {
  try {
    const wasm = await loadWasm()

    const response = await fetch('/png-tool/test.png')
    const pngBuffer = new Uint8Array(await response.arrayBuffer())
    console.log('원본 크기:', pngBuffer.length, 'bytes')

    const decoded = wasm.decode_png_to_rgba(pngBuffer)
    const rgbaData = decoded[0]
    const width = decoded[1]
    const height = decoded[2]

    const quantizer = new wasm.ImageQuantizer()
    quantizer.setQuality(0, 100)
    quantizer.setSpeed(3)
    quantizer.setMaxColors(256)

    const quantResult = quantizer.quantizeImage(rgbaData, width, height)
    console.log('양자화 성공!')

    const palette = quantResult.getPalette()
    const paletteIndices = quantResult.getPaletteIndices(rgbaData, width, height)

    const png = wasm.encode_palette_to_png(paletteIndices, palette, width, height)
    console.log('압축 후 크기:', png.length, 'bytes')
    console.log('압축률:', ((1 - png.length / pngBuffer.length) * 100).toFixed(1) + '%')
  } catch (err) {
    console.error('실패:', err)
  }
}

test()