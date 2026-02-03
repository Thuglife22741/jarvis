

# Plan: Fix JARVIS ElevenLabs Connection Issues

## Problem Summary
The JARVIS voice assistant connects successfully but disconnects immediately after the agent starts speaking. The logs show:
- "Connected to ElevenLabs agent"
- "Session started successfully"
- "JARVIS is speaking..."
- "Disconnected from ElevenLabs agent" (immediate disconnect)

## Root Causes Identified

1. **Microphone stream not properly managed** - The stream is acquired but not stored for cleanup
2. **Missing status change handler** - Need `onStatusChange` callback for reliable state tracking
3. **API key confusion** - The `VITE_ELEVENLABS_API_KEY` is a server-side key and should NOT be exposed on the client

## Important Note About Your Credentials

| Credential | Purpose | Usage |
|------------|---------|-------|
| `VITE_ELEVENLABS_AGENT_ID` | Identifies your agent | Use directly in `startSession()` |
| `VITE_ELEVENLABS_API_KEY` | Server-side authentication | **Do NOT use client-side** - only needed if agent requires auth |

For **public agents** (authentication disabled in ElevenLabs dashboard), only the `agentId` is needed. The API key should be kept secret on a backend server.

---

## Implementation Plan

### Phase 1: Fix ElevenLabsContext.tsx

**Changes:**

1. **Store microphone stream reference** for proper cleanup
2. **Add `onStatusChange` callback** for better state tracking
3. **Improve error handling** with specific error types
4. **Properly stop media tracks** on disconnect/cleanup

```text
Key modifications:
- Add mediaStreamRef to store the microphone stream
- Add cleanup effect to stop tracks on unmount
- Use onStatusChange for connection state
- Add explicit webrtc connection type
```

### Phase 2: Add Connection Stability

**Changes:**

1. **Add reconnection logic** if connection drops unexpectedly
2. **Track conversation ID** from session response
3. **Improve disconnect handling** to distinguish intentional vs unexpected

### Phase 3: Verify Agent Configuration

Before implementing, verify in ElevenLabs dashboard:
- [ ] Agent ID is correct: `agent_6201kg2y4qptfv8tq446agbtveyr`
- [ ] Authentication is **disabled** for public access (or enable backend token generation)
- [ ] Agent is not rate-limited

---

## Technical Implementation Details

### Updated ElevenLabsContext.tsx Structure

```text
Changes to make:

1. Add refs:
   - mediaStreamRef: useRef<MediaStream | null>(null)
   
2. Update useConversation config:
   - Add onStatusChange callback
   - Improve onError to check error types
   
3. Update startConversation:
   - Store stream in ref
   - Add connectionType: "webrtc" explicitly
   
4. Update stopConversation:
   - Stop all media tracks
   - Clear mediaStreamRef
   
5. Add cleanup effect:
   - Stop media tracks on unmount
```

### Code Flow After Fix

```text
User clicks button
       |
       v
Request microphone (getUserMedia)
       |
       v
Store stream in mediaStreamRef
       |
       v
startSession({ agentId, connectionType: "webrtc" })
       |
       v
onConnect fires -> sessionActive = true
       |
       v
Agent speaks greeting
       |
       v
isSpeaking changes -> update UI
       |
       v
Agent stops speaking
       |
       v
isListening = true -> ready for user input
       |
       v
User speaks -> agent responds -> cycle continues
       |
       v
On disconnect or unmount:
  - endSession()
  - mediaStreamRef.current.getTracks().forEach(t => t.stop())
```

---

## Alternative: If Agent Requires Authentication

If the agent has authentication enabled, you'll need to:

1. Create a Supabase Edge Function to generate conversation tokens
2. Call the edge function before starting a session
3. Use `conversationToken` instead of `agentId`

This would require enabling Supabase/Lovable Cloud for your project.

---

## Testing Checklist

After implementation:
- [ ] Click core to start conversation
- [ ] Verify "INITIALIZING..." appears
- [ ] Verify connection completes without immediate disconnect
- [ ] Verify agent speaks greeting fully
- [ ] Verify "LISTENING..." appears after greeting
- [ ] Speak to agent and verify response
- [ ] Click again to properly end session
- [ ] Check console for any errors

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/ElevenLabsContext.tsx` | Add stream management, status callback, cleanup logic |

## Estimated Changes
- ~30 lines modified/added in ElevenLabsContext.tsx

