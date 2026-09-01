import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, model, providers, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const selectedModel = model || "gemini-2.0-flash";
    let apiKey = process.env.GOOGLE_API_KEY;

    // Check if provider API key was passed from frontend settings
    if (providers && Array.isArray(providers)) {
      for (const p of providers) {
        if (selectedModel.startsWith("gpt-") && p.provider === "openai" && p.apiKey) {
          apiKey = p.apiKey;
        } else if (selectedModel.startsWith("claude-") && p.provider === "anthropic" && p.apiKey) {
          apiKey = p.apiKey;
        } else if (selectedModel.startsWith("gemini-") && p.provider === "google" && p.apiKey) {
          apiKey = p.apiKey;
        }
      }
    }

    const sysPrompt = systemPrompt || "You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.";

    // If OpenAI model
    if (selectedModel.startsWith("gpt-") || selectedModel.includes("realtime")) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey || process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: selectedModel.includes("realtime") ? "gpt-4o-mini" : selectedModel,
          messages: [
            { role: "system", content: sysPrompt },
            ...messages,
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `OpenAI API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I am here, Boss.";
      return NextResponse.json({ reply });
    }

    // If Anthropic model
    if (selectedModel.startsWith("claude-")) {
      const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          system: sysPrompt,
          max_tokens: 1024,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I am here, Boss.";
      return NextResponse.json({ reply });
    }

    // If Google Gemini model
    if (selectedModel.startsWith("gemini-")) {
      const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (selectedModel === "gemini-2.0-flash" ? process.env.GOOGLE_API_KEY : undefined);
      if (!geminiKey) {
        return NextResponse.json({ error: "Gemini API key is required when changing models or using custom Gemini models." }, { status: 400 });
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${geminiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: sysPrompt },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I am here, Boss.";
      return NextResponse.json({ reply });
    }

    // Fallback response for local models when running on serverless Vercel without local Ollama
    return NextResponse.json({
      reply: "Jarvis is operating in serverless cloud mode. Please configure an OpenAI, Anthropic, or Google Gemini API key in Settings to receive cloud responses."
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
