"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ColorPalette = [number, number, number][]

const colorPalettes: Record<string, ColorPalette> = {
  initial: [
    [0, 7, 100],
    [32, 107, 203],
    [237, 255, 255],
    [255, 170, 0],
    [0, 2, 0],
    [237, 255, 255],
    [255, 170, 0],
    [0, 2, 0],
  ],
  original: [
    [66, 30, 15],
    [25, 7, 26],
    [9, 1, 47],
    [4, 4, 73],
    [0, 7, 100],
    [12, 44, 138],
    [24, 82, 177],
    [57, 125, 209],
    [134, 181, 229],
    [211, 236, 248],
    [241, 233, 191],
    [248, 201, 95],
    [255, 170, 0],
    [204, 128, 0],
    [153, 87, 0],
    [106, 52, 3],
  ],
  cool: [
    [0, 0, 0],
    [0, 7, 100],
    [32, 107, 203],
    [237, 255, 255],
    [255, 170, 0],
    [0, 2, 0],
  ],
  warm: [
    [0, 0, 0],
    [102, 2, 4],
    [255, 0, 0],
    [255, 200, 0],
    [255, 255, 255],
  ],
  grayscale: [
    [0, 0, 0],
    [32, 32, 32],
    [64, 64, 64],
    [128, 128, 128],
    [192, 192, 192],
    [255, 255, 255],
  ],
  psychedelic: [
    [0, 0, 0],
    [255, 0, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [0, 0, 255],
    [255, 0, 255],
  ],
  ocean: [
    [0, 0, 32],
    [0, 128, 255],
    [0, 255, 255],
    [255, 255, 255],
  ],
  forest: [
    [0, 32, 0],
    [0, 64, 0],
    [0, 128, 0],
    [128, 255, 0],
    [255, 255, 0],
  ],
}

const MandelbrotExplorer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const miniMapRef = useRef<HTMLCanvasElement>(null)
  const [centerX, setCenterX] = useState(0)
  const [centerY, setCenterY] = useState(0)
  const [zoom, setZoom] = useState(200)
  const [maxIterations, setMaxIterations] = useState(100)
  const [zoomHistory, setZoomHistory] = useState<{ centerX: number; centerY: number; zoom: number }[]>([])
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false)
  const [currentPalette, setCurrentPalette] = useState<string>("initial")
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)

  const colorPalette = useCallback(
    (t: number): [number, number, number] => {
      const palette = colorPalettes[currentPalette]
      const i = Math.floor(t * (palette.length - 1))
      const f = t * (palette.length - 1) - i
      const color1 = palette[i]
      const color2 = palette[Math.min(i + 1, palette.length - 1)]

      return [
        Math.round(color1[0] * (1 - f) + color2[0] * f),
        Math.round(color1[1] * (1 - f) + color2[1] * f),
        Math.round(color1[2] * (1 - f) + color2[2] * f),
      ]
    },
    [currentPalette],
  )

  const drawMandelbrot = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, isMiniMap = false) => {
      const imageData = ctx.createImageData(width, height)
      const aspect = width / height
      const scale = isMiniMap ? 50 : zoom

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const zx = ((x - width / 2) / scale) * aspect + (isMiniMap ? -0.5 : centerX)
          const zy = (y - height / 2) / scale + centerY
          let cX = zx
          let cY = zy

          let iteration = 0
          const maxIter = isMiniMap ? 50 : maxIterations
          while (iteration < maxIter) {
            const xtemp = cX * cX - cY * cY + zx
            cY = 2 * cX * cY + zy
            cX = xtemp

            if (cX * cX + cY * cY > 4) break
            iteration++
          }

          const color = iteration === maxIter ? [0, 0, 0] : colorPalette(iteration / maxIter)
          const pixelIndex = (y * width + x) * 4
          imageData.data[pixelIndex] = color[0]
          imageData.data[pixelIndex + 1] = color[1]
          imageData.data[pixelIndex + 2] = color[2]
          imageData.data[pixelIndex + 3] = 255
        }
      }

      ctx.putImageData(imageData, 0, 0)

      if (isMiniMap) {
        const viewX = (centerX + 0.5) * 50 + width / 2
        const viewY = centerY * 50 + height / 2
        const viewSize = Math.max(1, Math.min((width / zoom) * 50, width / 2))

        ctx.strokeStyle = "red"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(viewX, viewY, viewSize, 0, 2 * Math.PI)
        ctx.stroke()
      }
    },
    [centerX, centerY, zoom, maxIterations, colorPalette],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const miniMap = miniMapRef.current
    if (!canvas || !miniMap) return

    const ctx = canvas.getContext("2d")
    const miniCtx = miniMap.getContext("2d")
    if (!ctx || !miniCtx) return

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height

    drawMandelbrot(ctx, width, height)

    const miniMapSize = 150
    miniMap.width = miniMapSize
    miniMap.height = miniMapSize
    drawMandelbrot(miniCtx, miniMapSize, miniMapSize, true)
  }, [drawMandelbrot])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const miniMap = miniMapRef.current
      if (!canvas || !miniMap) return

      const ctx = canvas.getContext("2d")
      const miniCtx = miniMap.getContext("2d")
      if (!ctx || !miniCtx) return

      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height

      drawMandelbrot(ctx, width, height)

      const miniMapSize = 150
      miniMap.width = miniMapSize
      miniMap.height = miniMapSize
      drawMandelbrot(miniCtx, miniMapSize, miniMapSize, true)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawMandelbrot])

  const handleZoom = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSelectingArea) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const aspect = canvas.width / canvas.height

    setZoomHistory([...zoomHistory, { centerX, centerY, zoom }])

    const newCenterX = centerX + ((x - canvas.width / 2) / zoom) * aspect
    const newCenterY = centerY + (y - canvas.height / 2) / zoom

    setCenterX(newCenterX)
    setCenterY(newCenterY)
    setZoom(zoom * 2)
    setMaxIterations(Math.min(1000, Math.floor(100 * Math.log2(zoom * 2))))
  }

  const handleUndoZoom = () => {
    if (zoomHistory.length > 0) {
      const previousState = zoomHistory[zoomHistory.length - 1]
      setCenterX(previousState.centerX)
      setCenterY(previousState.centerY)
      setZoom(previousState.zoom)
      setMaxIterations(Math.min(1000, Math.floor(100 * Math.log2(previousState.zoom))))
      setZoomHistory(zoomHistory.slice(0, -1))
    }
  }

  const handleResetView = () => {
    setCenterX(0)
    setCenterY(0)
    setZoom(200)
    setMaxIterations(100)
    setZoomHistory([])
  }

  const toggleMiniMap = () => {
    setIsMiniMapVisible(!isMiniMapVisible)
  }

  const handlePaletteChange = (value: string) => {
    setCurrentPalette(value)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingArea) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingArea || !selectionStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawMandelbrot(ctx, canvas.width, canvas.height)

    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.strokeRect(
      selectionStart.x,
      selectionStart.y,
      e.clientX - rect.left - selectionStart.x,
      e.clientY - rect.top - selectionStart.y,
    )
  }

  const handleMouseUp = () => {
    if (!isSelectingArea || !selectionStart || !selectionEnd) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const aspect = canvas.width / canvas.height
    const left = Math.min(selectionStart.x, selectionEnd.x)
    const top = Math.min(selectionStart.y, selectionEnd.y)
    const width = Math.abs(selectionEnd.x - selectionStart.x)
    const height = Math.abs(selectionEnd.y - selectionStart.y)

    const selectionCenterX = centerX + ((left + width / 2 - canvas.width / 2) / zoom) * aspect
    const selectionCenterY = centerY + (top + height / 2 - canvas.height / 2) / zoom
    const selectionZoom = zoom * Math.min(canvas.width / width, canvas.height / height)

    const imageData = ctx.getImageData(left, top, width, height)
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCtx.putImageData(imageData, 0, 0)

    // Add coordinates and zoom level to the image
    tempCtx.font = "12px Arial"
    tempCtx.fillStyle = "white"
    tempCtx.fillText(`Center: (${selectionCenterX.toFixed(6)}, ${selectionCenterY.toFixed(6)})`, 10, 20)
    tempCtx.fillText(`Zoom: ${selectionZoom.toExponential(2)}`, 10, 40)

    // Create a download link
    const link = document.createElement("a")
    link.download = `mandelbrot_${selectionCenterX.toFixed(6)}_${selectionCenterY.toFixed(6)}_${selectionZoom.toExponential(2)}.png`
    link.href = tempCanvas.toDataURL()
    link.click()

    // Reset selection state
    setIsSelectingArea(false)
    setSelectionStart(null)
    setSelectionEnd(null)

    // Redraw the main canvas
    drawMandelbrot(ctx, canvas.width, canvas.height)
  }

  const toggleSelectArea = () => {
    setIsSelectingArea(!isSelectingArea)
  }

  return (
    <div className="w-screen h-screen bg-black relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleZoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <canvas
        ref={miniMapRef}
        className={`absolute bottom-5 right-5 border-2 border-white ${isMiniMapVisible ? "block" : "hidden"}`}
      />
      <div className="absolute top-5 left-5 text-white bg-black bg-opacity-50 p-2 rounded">
        Center: ({centerX.toFixed(6)}, {centerY.toFixed(6)}) | Zoom: {zoom.toExponential(2)}
      </div>
      <div className="absolute top-5 right-5 flex gap-2">
        <Select onValueChange={handlePaletteChange} value={currentPalette}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a palette" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="initial">Initial</SelectItem>
            <SelectItem value="original">Original</SelectItem>
            <SelectItem value="cool">Cool</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="grayscale">Grayscale</SelectItem>
            <SelectItem value="psychedelic">Psychedelic</SelectItem>
            <SelectItem value="ocean">Ocean</SelectItem>
            <SelectItem value="forest">Forest</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleUndoZoom}>Undo Zoom</Button>
        <Button onClick={handleResetView}>Reset View</Button>
        <Button onClick={toggleMiniMap}>Toggle Mini-map</Button>
        <Button onClick={toggleSelectArea}>{isSelectingArea ? "Cancel Selection" : "Select Area"}</Button>
      </div>
    </div>
  )
}

export default MandelbrotExplorer

