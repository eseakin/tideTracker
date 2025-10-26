import OpenAI from "openai"

enum GPT_MODELS {
  GPT5 = "gpt-5",
  GPT5Mini = "gpt-5-mini",
  GPT4_1 = "gpt-4.1",
  GPT4o = "gpt-4o",
  GPT4oMini = "gpt-4o-mini",
  TextEmbeddingLarge = "text-embedding-3-large",
  TextEmbeddingSmall = "text-embedding-3-small",
  GPT4oAudioPreview = "gpt-4o-audio-preview",
  O3Mini = "o3-mini",
  O4Mini = "o4-mini",
}

const GPT_MODEL = GPT_MODELS.GPT5

const GPT_PROMPTS = {
  standard: ``,
}

export default class GptHandlerInstance {
  private client: OpenAI | null = null

  constructor() {
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      console.log("✅ API key found. Initializing OpenAI client")
      this.client = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })
    } else {
      console.error("❌ OpenAI API key not found")
    }
  }

  async generateText(prompt: string = GPT_PROMPTS.standard) {
    if (!this.client) {
      console.error("❌ OpenAI client not initialized")
      return
    }
    const response = await this.client.responses.create({
      model: GPT_MODEL,
      input: prompt,
    })
    return response.output_text
  }
}

export const GptHandler = new GptHandlerInstance()
