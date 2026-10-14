#!/usr/bin/env node
/** MCP stdio server using newline-delimited JSON-RPC and Node built-ins only. */
import { createInterface } from 'node:readline';
import { productionTools, runProductionTool } from './ops.mjs';

const supportedVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
let initialized = false;
const send = (value) => process.stdout.write(JSON.stringify(value) + '\n');

async function processMessage(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    send({ jsonrpc: '2.0', id: message?.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC request' } });
    return;
  }
  // Notifications never produce responses, including initialized and cancellation.
  if (!Object.hasOwn(message, 'id')) return;
  const response = { jsonrpc: '2.0', id: message.id };
  try {
    if (message.method === 'initialize') {
      const requested = message.params?.protocolVersion;
      initialized = true;
      response.result = { protocolVersion: supportedVersions.includes(requested) ? requested : supportedVersions[0], capabilities: { tools: {} }, serverInfo: { name: 'cnps-crm-production-readonly', version: '1.0.0' }, instructions: 'Only fixed read-only container, schema and backup diagnostics are available. No arbitrary SQL, command execution, credential reads, or production writes.' };
    } else if (message.method === 'ping') {
      response.result = {};
    } else if (!initialized) {
      response.error = { code: -32002, message: 'Initialize this MCP server first' };
    } else if (message.method === 'tools/list') {
      response.result = { tools: productionTools };
    } else if (message.method === 'tools/call') {
      try {
        const result = await runProductionTool(message.params?.name, message.params?.arguments ?? {});
        response.result = { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
      } catch (error) {
        response.result = { content: [{ type: 'text', text: error.message }], isError: true };
      }
    } else {
      response.error = { code: -32601, message: 'Method not found' };
    }
  } catch (error) {
    response.error = { code: -32603, message: error.message };
  }
  send(response);
}

for await (const line of input) {
  if (!line.trim()) continue;
  try { await processMessage(JSON.parse(line)); }
  catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
}
