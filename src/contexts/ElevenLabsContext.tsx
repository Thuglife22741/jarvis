import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";

const AGENT_ID = "agent_6201kg2y4qptfv8tq446agbtveyr";

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

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setIsConnecting(false);
      sessionActiveRef.current = true;
      // Start in listening mode after connection
      setIsListening(true);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setIsConnecting(false);
      sessionActiveRef.current = false;
      setIsListening(false);
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      setIsConnecting(false);
      // Don't immediately disconnect on error - log it for debugging
      console.error("Error details:", JSON.stringify(error, null, 2));
    },
    onMessage: (message) => {
      console.log("ElevenLabs message received:", message);
      // Handle different message types - cast to unknown first for type safety
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
    if (sessionActiveRef.current) {
      if (conversation.isSpeaking) {
        // Agent is speaking - not listening
        setIsListening(false);
        console.log("JARVIS is speaking...");
      } else if (conversation.status === "connected") {
        // Agent stopped speaking - now listening
        setIsListening(true);
        console.log("JARVIS is now listening...");
      }
    }
  }, [conversation.isSpeaking, conversation.status]);

  const startConversation = useCallback(async () => {
    if (sessionActiveRef.current) {
      console.log("Session already active, skipping start");
      return;
    }
    
    setIsConnecting(true);
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      
      // Start the session with the agent
      await conversation.startSession({
        agentId: AGENT_ID,
      } as Parameters<typeof conversation.startSession>[0]);
      
      console.log("Session started successfully");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
      sessionActiveRef.current = false;
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    if (!sessionActiveRef.current) {
      console.log("No active session to stop");
      return;
    }
    
    try {
      await conversation.endSession();
      sessionActiveRef.current = false;
      setIsListening(false);
      console.log("Session ended successfully");
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    console.log("Toggle conversation - current status:", conversation.status);
    
    if (conversation.status === "connected") {
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
