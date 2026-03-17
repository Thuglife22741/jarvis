import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { JARVIS_SYSTEM_PROMPT } from './jarvis-prompt.js';
import { MCPManager } from './mcp-manager.js';
import { findRecipeByContext } from './recipes-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env'), override: true });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/**
 * Cleans the raw Rube/MCP response into a short spoken Portuguese string.
 *
 * Rube returns an array of MCP content items:
 *   [{ type: 'text', text: '{"successful":true, "data":{...}}' }]
 *
 * We parse the inner JSON, detect errors, and extract event summary+time.
 */
function cleanRubeData(raw: unknown): string {
  // ── Step 1: Extract the text content from MCP item array ─────────────────
  let innerText: string | null = null;

  if (Array.isArray(raw)) {
    // MCP returns [{ type: 'text', text: '...' }]
    for (const item of raw) {
      const it = item as Record<string, unknown>;
      if (it.type === 'text' && typeof it.text === 'string') {
        innerText = it.text;
        break;
      }
    }
  } else if (typeof raw === 'string') {
    innerText = raw;
  }

  if (!innerText) {
    return 'Sua agenda está livre hoje, senhor.';
  }

  // ── Step 2: Parse the inner JSON from Rube ───────────────────────────────
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(innerText) as Record<string, unknown>;
  } catch {
    // Plain text response — return as-is if short enough
    if (innerText.length < 300) return innerText;
    return 'Sua agenda está livre hoje, senhor.';
  }

  // ── Step 3: Detect Rube error responses ──────────────────────────────────
  if (parsed.successful === false || parsed.error) {
    console.warn('[CleanRube] Rube returned error:', parsed.error);
    return 'Sua agenda está livre hoje, senhor.';
  }

  // ── Step 4: Aggressively locate the events array ─────────────────────────
  let eventList: unknown[] | null = null;

  // Recursive search to find the innermost array that looks like a list of events
  function findEventsArray(obj: unknown): unknown[] | null {
    if (!obj) return null;
    if (Array.isArray(obj)) {
      // Check if this array holds events (objects with summary/title/start)
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        if ('summary' in obj[0] || 'title' in obj[0] || 'start' in obj[0] || 'start_time' in obj[0]) {
          return obj;
        }
      }
      // Otherwise, check inside its elements
      for (const item of obj) {
        const found = findEventsArray(item);
        if (found) return found;
      }
      return null;
    }
    
    if (typeof obj === 'object') {
      const record = obj as Record<string, unknown>;
      // Prioritize common event keys
      for (const key of ['events', 'items', 'results', 'data']) {
        if (Array.isArray(record[key])) {
          const found = findEventsArray(record[key]);
          if (found) return found;
        }
      }
      // If not, deep search all other keys
      for (const key of Object.keys(record)) {
        const found = findEventsArray(record[key]);
        if (found) return found;
      }
    }
    return null;
  }

  eventList = findEventsArray(parsed);

  if (!eventList || eventList.length === 0) {
    return 'Sua agenda está livre hoje, senhor.';
  }

  // ── Step 5: Format each event into spoken text ───────────────────────────
  const lines = eventList
    .map((ev) => {
      const e = ev as Record<string, unknown>;
      const summary = (e.summary ?? e.title ?? e.name ?? e.subject ?? 'Evento') as string;

      const startRaw = e.start_time ?? e.start ?? undefined;
      let time = '';
      
      if (startRaw && typeof startRaw === 'object') {
        const sr = startRaw as Record<string, unknown>;
        const dt = (sr.dateTime ?? sr.date ?? '') as string;
        if (dt) {
          try {
            time = new Date(dt).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
            });
          } catch { /* ignore */ }
        }
      } else if (typeof startRaw === 'string') {
        try {
          time = new Date(startRaw).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
          });
        } catch { /* ignore */ }
      }

      return time ? `${summary} às ${time}` : summary;
    })
    .filter(Boolean)
    .join(', ');

  return lines
    ? `Seus eventos hoje: ${lines}.`
    : 'Sua agenda está livre hoje, senhor.';
}

/** Calendar recipe ID — hardcoded so the client tool never relies on GPT's tool choice */
const CALENDAR_RECIPE_ID = 'rcp_C7NVajdHlR_6';

/**
 * Response payload sent back to the frontend.
 * Includes an optional `toolsUsed` field so the UI can trigger visual indicators.
 */
interface JarvisResponse {
  role: string;
  content: string;
  toolsUsed?: string[]; // Names of MCP tools that were fired
  cleanedToolData?: string; // Short, ElevenLabs-safe summary of tool results
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: ChatMessage[] };
    const tools = MCPManager.getToolSchema() as OpenAI.Chat.Completions.ChatCompletionTool[];
    const toolsUsed: string[] = [];

    const messageHistory: ChatMessage[] = [
      { role: 'system', content: JARVIS_SYSTEM_PROMPT },
      ...messages,
    ];

    // ── First call: OpenAI decides if tool calls are needed ──────────────────
    const firstResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messageHistory,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    });

    const assistantMessage = firstResponse.choices[0].message;

    // ── Tool call loop ────────────────────────────────────────────────────────
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`\n[JARVIS] 🔧 ${assistantMessage.tool_calls.length} tool call(s) requested.`);
      messageHistory.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;

        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

        // ── Smart Recipe Dispatching ─────────────────────────────────────────
        // When OpenAI calls RUBE_EXECUTE_RECIPE, inject the correct recipe ID
        // based on the conversation context if not already provided
        if (toolName === 'RUBE_EXECUTE_RECIPE' && !toolArgs.recipeId) {
          const lastUserMessage = messages
            .filter(m => m.role === 'user')
            .map(m => (typeof m.content === 'string' ? m.content : ''))
            .join(' ');

          const matchedRecipeId = findRecipeByContext(lastUserMessage);
          if (matchedRecipeId) {
            toolArgs.recipeId = matchedRecipeId;
            console.log(`[DISPATCH] ✅ Injected recipeId: ${matchedRecipeId}`);
          }
        }

        // ── Temporal Context Injection ──────────────────────────────────────
        // Injecting timezone and current time helps recipes like Calendar/Gmail
        // process relative dates (today, tomorrow) correctly.
        toolArgs.context = {
          timezone: 'America/Sao_Paulo',
          current_time: new Date().toISOString(),
          ...((toolArgs.context as object) || {}),
        };

        console.log(`[MCP] 🚀 Executing: ${toolName}`, toolArgs);
        toolsUsed.push(toolName);

        let cleanedSummary = '';
        try {
          const raw = await MCPManager.executeTool(toolName, toolArgs);
          cleanedSummary = cleanRubeData(raw);
        } catch (err) {
          console.error(`[MCP] ❌ ${toolName} failed:`, err);
          cleanedSummary = 'Houve um erro ao consultar a agenda, senhor.';
        }

        console.log('[RUBE] ✅ Cleaned summary:', cleanedSummary);

        // Track the last clean summary for the response payload
        (toolCall as unknown as Record<string, string>)._cleanedSummary = cleanedSummary;
      }

      // ── Skip second OpenAI call — cleanedSummary is already the final answer ─
      // Calling GPT again here adds 1-2s of latency for no gain: the clean string
      // is already human-readable Portuguese and ready for ElevenLabs TTS.
      const lastClean = assistantMessage.tool_calls
        ?.map(tc => (tc as unknown as Record<string, string>)._cleanedSummary)
        .find(s => s && s.length > 0) ?? '';

      const payload: JarvisResponse = {
        role: 'assistant',
        content: lastClean,
        toolsUsed,
        cleanedToolData: lastClean,
      };

      console.log(`[JARVIS] ✅ Fast response ready (no 2nd GPT call). Tools: [${toolsUsed.join(', ')}]\n`);
      return res.json(payload);
    }

    // ── No tool calls: direct response ───────────────────────────────────────
    const payload: JarvisResponse = {
      role: assistantMessage.role,
      content: typeof assistantMessage.content === 'string' ? assistantMessage.content : '',
      toolsUsed: [],
    };

    return res.json(payload);

  } catch (error) {
    console.error('[JARVIS] ❌ Critical failure in neural link:', error);
    return res.status(500).json({ error: 'Neural link interrupted, Sir.' });
  }
});

// ── Calendar endpoint ──────────────────────────────────────────────────────────
// ElevenLabs calls this live. We removed the "on-boot" cache because it was
// locking the data to "today" only and fetching before the user asked.
// The WebRTC crash was actually caused by the giant 100kb raw MCP payload 
// overflowing the text buffer, not latency. Now that cleanRubeData() 
// cuts it down to ~50 characters, the normal 2-3s execution time is 
// perfectly safe and will not crash the WebRTC stream.
app.post('/api/calendar', async (req, res) => {
  const t0 = Date.now();
  const query = req.body?.query || 'eventos de hoje';

  console.log(`[CALENDAR] 🔄 Fetching live from Rube (Query: "${query}")...`);
  
  try {
    const raw = await MCPManager.executeTool('RUBE_EXECUTE_RECIPE', {
      recipe_id: CALENDAR_RECIPE_ID,
      input_data: { query: query }
    });
    
    // Log the JSON size and a small slice to verify incoming data
    const rawJson = JSON.stringify(raw);
    console.log(`[CALENDAR] 📦 MCP Payload received: ${rawJson.length} bytes.`);
    
    const cleaned = cleanRubeData(raw);
    console.log(`[CALENDAR] ✅ Live fetch done in ${Date.now() - t0}ms: ${cleaned}`);
    
    return res.json({ text: cleaned, cleanedToolData: cleaned });
  } catch (error) {
    console.error('[CALENDAR] ❌ Failed:', error);
    const fallback = 'Senhor, a integração com o calendário não pôde ser acessada no momento.';
    return res.status(500).json({ text: fallback, cleanedToolData: fallback });
  }
});

// ── Frontend Logging Endpoint ────────────────────────────────────────────────
app.post('/api/log', (req, res) => {
  const { message } = req.body;
  console.log(`[FRONTEND-DEBUG] ${message}`);
  res.json({ success: true });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
MCPManager.initialize().then(() => {
  app.listen(port, () => {
    console.log(`\n🤖 JARVIS Backend online — Port ${port}`);
    console.log(`🔗 MCP Hub: ${process.env.RUBE_MCP_URL}`);
    console.log(`⚡ Ready to serve, Sir.\n`);
  });
});
