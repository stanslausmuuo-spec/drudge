import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "";

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName, model, providers, sttProvider, ttsProvider } = await req.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "roomName and participantName are required" },
        { status: 400 }
      );
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL || LIVEKIT_API_KEY === "devkey" || !LIVEKIT_URL.startsWith("wss://")) {
      return NextResponse.json(
        { 
          error: "LiveKit is not configured. Set LIVEKIT_URL (wss://...), LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env.local (or Vercel env for production)." 
        },
        { status: 500 }
      );
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      attributes: {
        model: model || "gemini-3-flash-preview",
        providers: JSON.stringify(providers || []),
        sttProvider: sttProvider || "whisper",
        ttsProvider: ttsProvider || "piper",
      },
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
    });
  } catch (error) {
    console.error("Error generating LiveKit connection token for Vercel deployment:", error);
    return NextResponse.json(
      { error: "Failed to generate connection details in production" },
      { status: 500 }
    );
  }
}
