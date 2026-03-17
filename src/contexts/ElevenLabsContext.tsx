import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

const MAX_RECONNECT_ATTEMPTS = 3;

type ConversationStatus = "connected" | "connecting" | "disconnected";

interface ElevenLabsContextType {
  status: ConversationStatus;
  isSpeaking: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isMCPActive: boolean;       // True while a Rube tool is being dispatched
  lastMessage: string | null;
  activeMCPTools: string[];   // Names of the last tools fired
  toggleConversation: () => Promise<void>;
}

const ElevenLabsContext = createContext<ElevenLabsContextType | null>(null);

const remoteLog = (msg: string) => {
  console.log(msg);
  fetch('http://localhost:3001/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  }).catch(() => null);
};

export const ElevenLabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isMCPActive, setIsMCPActive] = useState(false);
  const [activeMCPTools, setActiveMCPTools] = useState<string[]>([]);
  const sessionActiveRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const conversation = useConversation({
    // ── Client Tools ────────────────────────────────────────────────────────
    // These are called BY the ElevenLabs agent when the user requests data.
    // They fetch live from the JARVIS backend API.
    clientTools: {
      get_calendar_events: async (parameters: Record<string, unknown>) => {
        remoteLog(`⚡ [Client Tool] get_calendar_events chamado pelo agente. Params: ${JSON.stringify(parameters)}`);
        setIsMCPActive(true);
        setActiveMCPTools(['get_calendar_events']);

        let result = 'Aguarde, ocorreu um erro ao consultar sua agenda.';
        try {
          const queryStr = parameters.query ? String(parameters.query) : 'eventos de hoje';
          remoteLog(`🔍 Resolving query "${queryStr}"...`);
          
          const res = await fetch('http://localhost:3001/api/calendar', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryStr })
          });
          
          if (res.ok) {
            const data = await res.json();
            result = data.cleanedToolData || data.text;
            remoteLog(`✅ Query succeeded, data matched.`);
          } else {
            remoteLog(`❌ Backend responded with HTML error or invalid. Status: ${res.status}`);
          }
        } catch (error) {
          remoteLog(`❌ Catch Error parsing calendar API call: ${error}`);
        }

        remoteLog(`[Calendar] 📨 Retornando para o agente a string: "${result}"`);
        
        setTimeout(() => { setIsMCPActive(false); setActiveMCPTools([]); }, 3000);
        return result;
      },
    },

    onConnect: () => {
      remoteLog('[ElevenLabs] ✅ Conectado ao agente George. Ready to speak/listen.');
      setIsConnecting(false);
      sessionActiveRef.current = true;
      intentionalDisconnectRef.current = false;
      wasConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      setIsListening(true);
    },

    onDisconnect: (reason) => {
      remoteLog(`[ElevenLabs] 🔴 Desconectado. Reason/Args: ${JSON.stringify(reason || 'nenhum dado')}`);
      setIsConnecting(false);
      sessionActiveRef.current = false;
      setIsListening(false);
    },

    onError: (error) => {
      remoteLog(`[ElevenLabs] 🚨 Erro Crash: ${typeof error === 'string' ? error : JSON.stringify(error)}`);
      setIsConnecting(false);
    },

    onMessage: (message) => {
      interface ELMessage { type?: string; text?: string; message?: string; source?: string; role?: string; }
      const msg = message as unknown as ELMessage;
      
      // Log EVERYTHING extremely verbose to catch why it disconnects unseen
      remoteLog(`📦 [Raw SDK Event]: ${JSON.stringify(msg)}`);

      // Track agent speech for UI state (lastMessage)
      if (msg.source === 'ai' || msg.type === 'agent_response') {
        const agentText = msg.text ?? msg.message ?? '';
        if (agentText) {
          setLastMessage(agentText);
          remoteLog(`[George falando]: "${agentText}"`);
        }
        return;
      }

      // Log user transcription for debugging (no action needed — agent handles it)
      if (msg.source === 'user') {
        remoteLog(`🎤 [Transcribed User]: "${msg.text ?? msg.message ?? ''}"`);
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
      remoteLog("⚠️ React unmounting ElevenLabsProvider! Killing session...");
      console.log("ElevenLabsProvider unmounting, cleaning up...");
      intentionalDisconnectRef.current = true;

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
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
      // 1. Ask for hardware permission explicitly before startSession 
      // This forces the Chrome secure-lock to open first, preventing the auto-abort
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Start session
      // @ts-ignore
      const sessionResult = await conversation.startSession({
        agentId: AGENT_ID,
      });
      
      console.log("Session started successfully:", sessionResult);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
      sessionActiveRef.current = false;
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    remoteLog("🛑 stopConversation requested manually or via toggle.");
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
        isMCPActive,
        activeMCPTools,
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
