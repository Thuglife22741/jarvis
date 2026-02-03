import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_6201kg2y4qptfv8tq446agbtveyr";

const MAX_RECONNECT_ATTEMPTS = 3;

type ConversationStatus = "connected" | "connecting" | "disconnected";

interface ElevenLabsContextType {
  status: ConversationStatus;
  isSpeaking: boolean;
  isConnecting: boolean;
  isListening: boolean;
  lastMessage: string | null;
  toggleConversation: () => Promise<void>;
}

const ElevenLabsContext = createContext<ElevenLabsContextType | null>(null);

export const ElevenLabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const sessionActiveRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setIsConnecting(false);
      sessionActiveRef.current = true;
      intentionalDisconnectRef.current = false;
      wasConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      setIsListening(true);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setIsConnecting(false);
      sessionActiveRef.current = false;
      setIsListening(false);
      
      // Clean up media stream on disconnect
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped audio track:", track.label);
        });
        mediaStreamRef.current = null;
      }
      
      // Log if disconnect was unexpected
      if (!intentionalDisconnectRef.current) {
        console.warn("Unexpected disconnect from ElevenLabs agent");

        // Auto-reconnect (limited attempts) only if we had a real connection before
        if (wasConnectedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const attempt = reconnectAttemptsRef.current;
          const delayMs = Math.min(4000, 600 * attempt);
          console.warn(`Scheduling reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS} in ${delayMs}ms`);

          if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
          }

          reconnectTimerRef.current = window.setTimeout(() => {
            // Don't reconnect if user manually stopped meanwhile
            if (intentionalDisconnectRef.current) return;
            console.warn(`Reconnect attempt ${attempt} starting...`);
            // Reuse the same start function (will re-request mic permission if needed)
            startConversation();
          }, delayMs);
        }
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      setIsConnecting(false);
      
      // Log detailed error info
      if (error && typeof error === 'object') {
        const errorObj = error as { message?: string; code?: string; type?: string };
        console.error("Error type:", errorObj.type);
        console.error("Error code:", errorObj.code);
        console.error("Error message:", errorObj.message);
      }
    },
    onMessage: (message) => {
      console.log("ElevenLabs message received:", message);
      if (message && typeof message === 'object') {
        const msg = message as unknown as { type?: string; text?: string; message?: string };
        if (msg.type === 'agent_response' || msg.text) {
          setLastMessage(String(msg.text || msg.message || ''));
        }
      }
    },
  });

  // Track speaking state changes to manage listening state
  useEffect(() => {
    if (sessionActiveRef.current && conversation.status === "connected") {
      if (conversation.isSpeaking) {
        setIsListening(false);
        console.log("JARVIS is speaking...");
      } else {
        // Small delay to ensure audio has fully stopped before setting listening
        const timer = setTimeout(() => {
          if (sessionActiveRef.current && conversation.status === "connected") {
            setIsListening(true);
            console.log("JARVIS is now listening...");
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [conversation.isSpeaking, conversation.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("ElevenLabsProvider unmounting, cleaning up...");
      intentionalDisconnectRef.current = true;

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Cleanup: stopped audio track:", track.label);
        });
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const startConversation = useCallback(async () => {
    if (sessionActiveRef.current) {
      console.log("Session already active, skipping start");
      return;
    }
    
    setIsConnecting(true);
    intentionalDisconnectRef.current = false;
    
    try {
      // Request microphone permission and store the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      console.log("Microphone access granted, tracks:", stream.getAudioTracks().length);
      
      // Start the session with the agent using WebRTC
      const sessionResult = await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
      } as Parameters<typeof conversation.startSession>[0]);
      
      console.log("Session started successfully:", sessionResult);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
      sessionActiveRef.current = false;
      
      // Clean up stream on failure
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    if (!sessionActiveRef.current && conversation.status === "disconnected") {
      console.log("No active session to stop");
      return;
    }
    
    intentionalDisconnectRef.current = true;
    wasConnectedRef.current = false;
    reconnectAttemptsRef.current = 0;

    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    try {
      await conversation.endSession();
      sessionActiveRef.current = false;
      setIsListening(false);
      console.log("Session ended successfully");
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
    
    // Always clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped audio track on manual disconnect:", track.label);
      });
      mediaStreamRef.current = null;
    }
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    console.log("Toggle conversation - current status:", conversation.status, "sessionActive:", sessionActiveRef.current);
    
    if (conversation.status === "connected" || sessionActiveRef.current) {
      await stopConversation();
    } else if (conversation.status !== "connecting" && !isConnecting) {
      await startConversation();
    }
  }, [conversation.status, startConversation, stopConversation, isConnecting]);

  return (
    <ElevenLabsContext.Provider
      value={{
        status: conversation.status as ConversationStatus,
        isSpeaking: conversation.isSpeaking,
        isConnecting,
        isListening,
        lastMessage,
        toggleConversation,
      }}
    >
      {children}
    </ElevenLabsContext.Provider>
  );
};

export const useElevenLabs = () => {
  const context = useContext(ElevenLabsContext);
  if (!context) {
    throw new Error("useElevenLabs must be used within an ElevenLabsProvider");
  }
  return context;
};
