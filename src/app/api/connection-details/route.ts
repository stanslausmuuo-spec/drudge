import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "ws://localhost:7880";

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName, model, providers } = await req.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "roomName and participantName are required" },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production" && (LIVEKIT_API_KEY === "devkey" || LIVEKIT_URL.includes("localhost"))) {
      return NextResponse.json(
        { 
          error: "LiveKit is not configured for production. Please set valid LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL (wss://...) environment variables in Vercel dashboard." 
        },
        { status: 500 }
      );
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      attributes: {
        model: model || "gemini-3-flash-preview",
        providers: JSON.stringify(providers || []),
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
