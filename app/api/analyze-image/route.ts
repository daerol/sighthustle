import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

export async function POST(req: Request) {
  try {
    const { imageData } = await req.json()

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image data provided." }), { status: 400 })
    }

    // Extract base64 data (e.g., "data:image/png;base64,iVBORw0...")
    const base64Data = imageData.split(",")[1]
    if (!base64Data) {
      return new Response(JSON.stringify({ error: "Invalid image data format." }), { status: 400 })
    }

    const imageBuffer = Buffer.from(base64Data, "base64")

    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"), // Using Claude 3.5 Sonnet for vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'You are an expert at parsing quiz questions from images. Your task is to extract *only* the multiple-choice answers from the provided image. Do not include the question, code snippets, or any other text. List each answer on a new line. If no answers are found, state "No answers found."',
            },
            { type: "image", image: imageBuffer },
          ],
        },
      ],
    })

    return new Response(result)
  } catch (error) {
    console.error("Error processing image:", error)
    return new Response(JSON.stringify({ error: "Failed to process image." }), { status: 500 })
  }
}
