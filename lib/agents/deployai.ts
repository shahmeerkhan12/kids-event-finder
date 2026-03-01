/**
 * DeployAI client helper.
 * Handles auth-token caching, chat creation, and message sending.
 */

const AUTH_URL = process.env.AUTH_URL ?? 'https://api-auth.dev.deploy.ai/oauth2/token'
const API_URL  = process.env.API_URL  ?? 'https://core-api.dev.deploy.ai'
const ORG_ID   = process.env.ORG_ID   ?? 'c9fa408a-5478-4aa6-92cf-5561610430f2'

interface TokenCache {
  token: string
  expiresAt: number
}
let tokenCache: TokenCache | null = null

/** Retrieves (and caches) a client-credentials access token. */
async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     process.env.CLIENT_ID ?? '',
    client_secret: process.env.CLIENT_SECRET ?? ''
  })

  const res = await fetch(AUTH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!res.ok) {
    throw new Error(`DeployAI auth failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { access_token: string; expires_in?: number }
  tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000
  }
  return tokenCache.token
}

/** Creates a new chat session and returns its ID. */
async function createChat(token: string): Promise<string> {
  const res = await fetch(`${API_URL}/chats`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      Authorization:  `Bearer ${token}`,
      'X-Org':        ORG_ID
    },
    body: JSON.stringify({ agentId: 'GPT_4O', stream: false })
  })

  if (!res.ok) {
    throw new Error(`DeployAI createChat failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { id: string }
  return data.id
}

/** Sends a message in an existing chat and returns the assistant's reply. */
async function sendMessage(token: string, chatId: string, content: string): Promise<string> {
  const res = await fetch(`${API_URL}/messages`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      'X-Org':        ORG_ID
    },
    body: JSON.stringify({
      chatId,
      stream: false,
      content: [{ type: 'text', value: content }]
    })
  })

  if (!res.ok) {
    throw new Error(`DeployAI sendMessage failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { content: { value: string }[] }
  return data.content[0]?.value ?? ''
}

/**
 * High-level helper: creates a fresh chat, sends one message, returns reply.
 * Use this for stateless single-turn calls (e.g. Curator normalization).
 */
export async function askOnce(prompt: string): Promise<string> {
  const token  = await getAccessToken()
  const chatId = await createChat(token)
  return sendMessage(token, chatId, prompt)
}

/**
 * High-level helper: creates a chat, sends multiple turns in sequence.
 * Returns the final assistant reply.
 */
export async function askMultiTurn(messages: { role: string; content: string }[]): Promise<string> {
  const token  = await getAccessToken()
  const chatId = await createChat(token)

  let reply = ''
  for (const msg of messages) {
    if (msg.role === 'user') {
      reply = await sendMessage(token, chatId, msg.content)
    }
  }
  return reply
}
