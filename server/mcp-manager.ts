/**
 * MCP (Model Context Protocol) Manager
 * Connects to the Rube MCP server using the official MCP SDK with Streamable HTTP transport.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const RUBE_MCP_URL = process.env.RUBE_MCP_URL || 'https://rube.app/mcp';
const RUBE_MCP_TOKEN = process.env.RUBE_MCP_TOKEN || '';

/** OpenAI-compatible tool schema shape */
interface OpenAIToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: unknown;
  };
}

export class MCPManager {
  private static client: Client | null = null;
  private static cachedTools: OpenAIToolSchema[] = [];
  private static initialized = false;

  /**
   * Connects to the Rube MCP server and discovers available tools.
   * Non-fatal: if connection fails, JARVIS continues without external tools.
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[MCP] Connecting to Rube MCP server...');

      const transport = new StreamableHTTPClientTransport(
        new URL(RUBE_MCP_URL),
        {
          requestInit: {
            headers: {
              Authorization: `Bearer ${RUBE_MCP_TOKEN}`,
            },
          },
        }
      );

      this.client = new Client({ name: 'JARVIS', version: '1.0.0' });
      await this.client.connect(transport);

      const { tools } = await this.client.listTools();

      this.cachedTools = tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description ?? '',
          parameters: tool.inputSchema ?? { type: 'object', properties: {} },
        },
      }));

      this.initialized = true;
      console.log(`[MCP] ✅ ${tools.length} tools discovered: ${tools.map(t => t.name).join(', ')}`);

    } catch (error) {
      console.warn('[MCP] ⚠️ Could not connect to Rube. JARVIS will operate without external tools.', error);
      // Non-fatal — server continues
    }
  }

  /**
   * Returns available tools in OpenAI function-calling format.
   */
  static getToolSchema(): OpenAIToolSchema[] {
    return this.cachedTools;
  }

  /**
   * Executes a tool on the Rube MCP server.
   */
  static async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) throw new Error('[MCP] Client not initialized');

    console.log(`[MCP] Executing tool: ${name}`, args);
    const result = await this.client.callTool({ name, arguments: args });
    return result.content;
  }
}
