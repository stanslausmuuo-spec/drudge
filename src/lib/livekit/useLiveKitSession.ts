"use client";

import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { AgentStatus, ConnectionState as ConnState, Message } from "@/types";

const ROOM_NAME = "jarvis-room";
const PARTICIPANT_NAME = `user-${Date.now()}`;

export function useLiveKitSession() {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnState>({
    status: "disconnected",
    error: null,
  });
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback(
    (role: "user" | "assistant" | "system", content: string) => {
      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const connect = useCallback(async () => {
    if (roomRef.current) return;

    setConnectionState({ status: "connecting", error: null });
    setAgentStatus("connecting");

    try {
      const res = await fetch("/api/connection-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: ROOM_NAME,
          participantName: PARTICIPANT_NAME,
        }),
      });

      if (!res.ok) {
        throw new Error(`Token request failed: ${res.status}`);
      }

      const { token, url } = await res.json();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      newRoom.on(RoomEvent.Connected, () => {
        setConnectionState({ status: "connected", error: null });
        setAgentStatus("idle");
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setConnectionState({ status: "disconnected", error: null });
        setAgentStatus("disconnected");
        roomRef.current = null;
      });

      newRoom.on(
        RoomEvent.TrackSubscribed,
        (trackPublication) => {
          if (trackPublication.kind === Track.Kind.Audio) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const audioTrack = (trackPublication as any).track;
            if (audioTrack && typeof audioTrack.attach === "function") {
              const audioElement = audioTrack.attach();
              if (audioElement) {
                document.body.appendChild(audioElement);
              }
            }
          }
        }
      );

      newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const decoded = new TextDecoder().decode(payload);
          const data = JSON.parse(decoded);

          if (data.type === "transcription") {
            const identity = participant?.identity ?? "";
            const role =
              identity.startsWith("agent") || identity.startsWith("jarvis")
                ? "assistant"
                : "user";
            if (data.final) {
              addMessage(role, data.text);
            }
          }
        } catch {
          // Non-JSON data, ignore
        }
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some((s) => {
          const id = s.identity ?? "";
          return id.startsWith("agent") || id.startsWith("jarvis");
        });
        const isLocalSpeaking = speakers.some(
          (s) => s.sid === newRoom.localParticipant?.sid
        );

        if (isAgentSpeaking) {
          setAgentStatus("speaking");
        } else if (isLocalSpeaking) {
          setAgentStatus("listening");
        } else {
          setAgentStatus("idle");
        }
      });

      await newRoom.connect(url, token);
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = newRoom;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Connection failed";
      setConnectionState({ status: "disconnected", error: message });
      setAgentStatus("disconnected");
      roomRef.current = null;
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnectionState({ status: "disconnected", error: null });
    setAgentStatus("disconnected");
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!roomRef.current) return;

      addMessage("user", text);

      const data = new TextEncoder().encode(
        JSON.stringify({ type: "user_message", text })
      );
      roomRef.current.localParticipant.publishData(data, { reliable: true });
    },
    [addMessage]
  );

  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
  }, []);

  return {
    connectionState,
    agentStatus,
    messages,
    setMessages,
    connect,
    disconnect,
    sendMessage,
    toggleMicrophone,
    addMessage,
  };
}
