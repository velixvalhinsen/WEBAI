// Vercel Serverless Function untuk proxy API calls
// API key disimpan di environment variable VERCEL

// @ts-ignore - @vercel/node types will be available at runtime
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get request method and origin FIRST
  const method = req.method || '';
  const origin = req.headers.origin || '';
  
  // Build CORS headers
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  } else {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
    corsHeaders['Access-Control-Allow-Credentials'] = 'false';
  }

  // Log request
  console.log(`[${new Date().toISOString()}] ${method} ${req.url} from origin: ${origin}`);

  // Handle OPTIONS preflight request - MUST be first check
  if (method.toUpperCase() === 'OPTIONS') {
    console.log('[CORS] OPTIONS preflight - returning 200 with CORS headers');
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  // Set CORS headers for all other requests
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Only allow POST for actual API calls
  if (method.toUpperCase() !== 'POST') {
    console.log(`[ERROR] Method ${method} not allowed`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, provider = 'groq' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Get API key from environment variable
    // @ts-ignore - process.env is available in Node.js runtime
    const apiKey = provider === 'groq' 
      ? process.env.GROQ_API_KEY 
      : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set GROQ_API_KEY or OPENAI_API_KEY environment variable.' 
      });
    }

    // Determine API URL and model
    const apiUrl = provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const model = provider === 'groq'
      ? 'llama-3.1-8b-instant'
      : 'gpt-4o';

    // Forward request to Groq/OpenAI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
      });
    }

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'No response body' });
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            return res.end();
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              res.write(`data: ${JSON.stringify({ content: delta, done: false })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

