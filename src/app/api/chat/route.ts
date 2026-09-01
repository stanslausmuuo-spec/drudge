import { NextRequest, NextResponse } from "next/server";
import {
  getJarvisMemory,
  recordJarvisMemory,
  buildMemoryContext,
} from "@/lib/memory";

export async function POST(req: NextRequest) {
  try {
    const { messages, model, providers, systemPrompt, temperature, maxTokens } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const memory = await getJarvisMemory();
    const memoryContext = buildMemoryContext(memory);

    const selectedModel = model || "gemini-3-flash-preview";
    const temp = typeof temperature === "number" ? temperature : 0.7;
    const maxTok = typeof maxTokens === "number" ? maxTokens : 4096;

    let apiKey = "";

    // Resolve the API key from frontend settings (localStorage) for the matching provider.
    if (selectedModel.startsWith("gpt-") && !selectedModel.includes("realtime")) {
      apiKey = providers?.find((p: any) => p.provider === "openai")?.apiKey || process.env.OPENAI_API_KEY || "";
    } else if (selectedModel.startsWith("claude-")) {
      apiKey = providers?.find((p: any) => p.provider === "anthropic")?.apiKey || process.env.ANTHROPIC_API_KEY || "";
    } else if (selectedModel.startsWith("gemini-")) {
      apiKey = providers?.find((p: any) => p.provider === "google")?.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
    }

    const sysPrompt = systemPrompt || "You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.";
    const fullSystem = memoryContext
      ? `${sysPrompt}\n\n${memoryContext}`
      : sysPrompt;

    // If OpenAI model
    if (selectedModel.startsWith("gpt-") && !selectedModel.includes("realtime")) {
      if (!apiKey) {
        return NextResponse.json({ error: "OpenAI API key is missing. Add one in Settings or set OPENAI_API_KEY." }, { status: 400 });
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: fullSystem },
            ...messages,
          ],
          temperature: temp,
          max_tokens: maxTok,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `OpenAI API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I am here, Boss.";
      const userMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (reply && userMsg) await recordJarvisMemory(memory, String(userMsg.content), reply);
      return NextResponse.json({ reply });
    }

    // If Anthropic model
    if (selectedModel.startsWith("claude-")) {
      if (!apiKey) {
        return NextResponse.json({ error: "Anthropic API key is missing. Add one in Settings or set ANTHROPIC_API_KEY." }, { status: 400 });
      }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          system: fullSystem,
          max_tokens: Math.min(maxTok, 1024),
          temperature: temp,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I am here, Boss.";
      const userMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (reply && userMsg) await recordJarvisMemory(memory, String(userMsg.content), reply);
      return NextResponse.json({ reply });
    }

    // If Google Gemini model
    if (selectedModel.startsWith("gemini-")) {
      if (!apiKey) {
        return NextResponse.json({ error: "Google Gemini API key is missing. Restart the server so it picks up GOOGLE_API_KEY from .env.local, or add your own key in Settings." }, { status: 400 });
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: fullSystem },
            ...messages,
          ],
          temperature: temp,
          max_tokens: maxTok,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: response.status });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I am here, Boss.";
      const userMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (reply && userMsg) await recordJarvisMemory(memory, String(userMsg.content), reply);
      return NextResponse.json({ reply });
    }

    // Fallback response when running on serverless Vercel without a configured provider key
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
