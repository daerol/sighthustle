"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Camera } from "lucide-react"

export default function ImageQuizParser() {
  const [imageData, setImageData] = useState<string | null>(null)
  const [answers, setAnswers] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null) // Reference for the hidden video element

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setImageData(dataUrl)
        drawOnCanvas(dataUrl)
        setAnswers("") // Clear previous answers
        setError(null) // Clear previous errors
        // Automatically analyze after upload
        analyzeImage(dataUrl)
      }
      reader.readAsDataURL(file)
    } else {
      setImageData(null)
      clearCanvas() // Clear canvas if no file is selected
    }
  }

  const takeScreenshot = async () => {
    setError(null)
    setAnswers("")
    setImageData(null) // Clear previous image data
    clearCanvas() // Clear canvas before new capture

    let stream: MediaStream | null = null

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) {
        throw new Error("Video or canvas element not found. This indicates a rendering issue.")
      }

      stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      video.srcObject = stream

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play()
          setTimeout(() => {
            try {
              const ctx = canvas.getContext("2d")
              if (!ctx) {
                throw new Error("Could not get 2D context from canvas.")
              }

              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              const dataUrl = canvas.toDataURL("image/png")
              setImageData(dataUrl)
              analyzeImage(dataUrl) // Automatically analyze after screenshot
              resolve()
            } catch (e) {
              reject(e)
            }
          }, 100)
        }
        video.onerror = (e) => reject(new Error(`Video error: ${e.type}`))
      })
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Permission to capture screen was denied. Please allow screen sharing to use this feature.")
      } else if (err.name === "SecurityError" || (err.message && err.message.includes("permissions policy"))) {
        setError(
          "Screen capture is disallowed by browser permissions policy in this environment. Please try running locally or use the file upload option.",
        )
      } else {
        setError(`Error taking screenshot: ${err.message || "An unknown error occurred."}`)
      }
      console.error("Error taking screenshot:", err)
    } finally {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const drawOnCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error("Canvas element not found for drawing.")
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("Could not get 2D context from canvas for drawing.")
      return
    }

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Modified analyzeImage to accept imageData as an argument
  const analyzeImage = async (currentImageData: string | null) => {
    const dataToAnalyze = currentImageData || imageData // Use provided data or state data

    if (!dataToAnalyze) {
      setError("Please upload an image or take a screenshot first.")
      return
    }

    setLoading(true)
    setError(null)
    setAnswers("")

    // --- MOCKED AI RESPONSE START ---
    const mockedAnswers = `You used the #config div selector instead of the #config > div selector.
You repeated the width property in the #config and #config div selectors.
You did not mention the nowrap property in the #config div selector.
You used 300px instead of 250px in the #config div selector.
I don't know yet.`

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Display the full answer instantly
      setAnswers(mockedAnswers)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during mock analysis.")
      setAnswers("")
    } finally {
      setLoading(false)
    }
    // --- MOCKED AI RESPONSE END ---

    /*
    // Original API call (uncomment to use real AI)
    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData: dataToAnalyze }), // Use dataToAnalyze
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze image.")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to read response stream.")
      }

      let receivedText = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        receivedText += new TextDecoder().decode(value)
        setAnswers(receivedText)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      setAnswers("")
    } finally {
      setLoading(false)
    }
    */
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>SightHustle</CardTitle>
          <CardDescription>Using GPT to read sight to get answers</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="image-source">Choose Image Source</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={takeScreenshot} disabled={loading} className="flex-1">
                <Camera className="mr-2 h-4 w-4" /> Take Screenshot
              </Button>
              <div className="flex-1">
                <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={loading} />
                <p className="text-sm text-muted-foreground mt-1">Or upload an image file directly.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              When taking a screenshot, your browser will prompt you to select a screen, window, or tab to share. The
              app will then take a quick snapshot and stop the sharing.
            </p>
          </div>

          {/* Hidden video element to play the stream for screenshot capture */}
          <video ref={videoRef} style={{ display: "none" }} playsInline autoPlay muted />

          <div className="grid gap-2">
            <Label>Captured Image Preview</Label>
            <div className="border rounded-md overflow-hidden flex justify-center items-center bg-gray-50 dark:bg-gray-900">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
              {!imageData && (
                <div className="absolute text-muted-foreground">
                  {error ? "Error loading image" : "No image selected"}
                </div>
              )}
            </div>
          </div>

          {/* The Analyze Image button is now primarily for manual re-analysis or if auto-analysis fails */}
          <Button onClick={() => analyzeImage(null)} disabled={!imageData || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Image"
            )}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {answers && (
            <div className="grid gap-2">
              <Label>Correct answer:</Label> {/* Updated label */}
              <Textarea value={answers} readOnly placeholder="Answers will appear here..." className="min-h-[150px]" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
