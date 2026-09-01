"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, createAudioAnalyser } from "livekit-client";
import { AgentStatus, ConnectionState as ConnState, Message, Settings } from "@/types";

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
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const calculateVolumeRef = useRef<(() => number) | null>(null);

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

  // Poll the local mic analyser to drive a live voice-activity meter.
  useEffect(() => {
    const id = setInterval(() => {
      const calc = calculateVolumeRef.current;
      let level = 0;
      if (calc) {
        level = calc();
      }
      setAudioLevel((prev) => (prev === level ? prev : level));
    }, 80);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async (settings?: Settings) => {
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
          model: settings?.model || "gemini-3-flash-preview",
          providers: settings?.providers || [],
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
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 },
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
        setCameraEnabled(false);
      });

      newRoom.on(
        RoomEvent.TrackSubscribed,
        (trackPublication) => {
          if (trackPublication.kind === Track.Kind.Audio) {
            // @ts-ignore
            const audioTrack = trackPublication.track;
            if (audioTrack && typeof audioTrack.attach === "function") {
              const audioElement = audioTrack.attach();
              if (audioElement) {
                document.body.appendChild(audioElement);
              }
            }
          } else if (trackPublication.kind === Track.Kind.Video) {
            const isRemote =
              trackPublication.source === Track.Source.Camera ||
              trackPublication.source === Track.Source.ScreenShare;
            if (isRemote) {
              // @ts-ignore
              const videoTrack = trackPublication.track;
              if (videoTrack && typeof videoTrack.attach === "function") {
                const videoElement = videoTrack.attach();
                videoElement.id = "jarvis-remote-video";
                videoElement.autoplay = true;
                videoElement.playsInline = true;
                videoElement.classList.add("jarvis-remote-video-element");
                setRemoteVideo(videoElement);
              }
            }
          }
        }
      );

      newRoom.on(RoomEvent.TrackUnsubscribed, (trackPublication) => {
        if (trackPublication.kind === Track.Kind.Video) {
          setRemoteVideo((prev) => {
            if (prev) {
              (prev as any).detach?.();
              prev.remove();
            }
            return null;
          });
        }
      });

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

      // Set up voice-activity metering from the local microphone.
      try {
        const localAudioPub = newRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
        const localAudioTrack = localAudioPub?.track as any;
        if (localAudioTrack && typeof localAudioTrack?.attach === "function") {
          const analyser = createAudioAnalyser(
            localAudioTrack,
            { fftSize: 128, smoothingTimeConstant: 0.2, cloneTrack: false }
          );
          calculateVolumeRef.current = analyser.calculateVolume;
          audioCleanupRef.current = analyser.cleanup;
        }
      } catch (err) {
        console.warn("Audio analyser setup error:", err);
      }

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
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;
    calculateVolumeRef.current = null;
    setAudioLevel(0);
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnectionState({ status: "disconnected", error: null });
    setAgentStatus("disconnected");
    setCameraEnabled(false);
    setMicEnabled(true);
    setRemoteVideo((prev) => {
      if (prev) {
        (prev as any).detach?.();
        prev.remove();
      }
      return null;
    });
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
    setMicEnabled(!enabled);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (roomRef.current) {
      try {
        const enabled = roomRef.current.localParticipant.isCameraEnabled;
        await roomRef.current.localParticipant.setCameraEnabled(!enabled);
      } catch (err) {
        console.warn("LiveKit camera toggle error:", err);
      }
    }
    setCameraEnabled((prev) => !prev);
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
    toggleCamera,
    cameraEnabled,
    remoteVideo,
    micEnabled,
    audioLevel,
    addMessage,
  };
}
