import { SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { Message } from './localStorage';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Backend proxy URL (set this to your Vercel deployment URL or leave empty to use direct API)
// Remove trailing slash if present
const PROXY_URL = (import.meta.env.VITE_PROXY_URL || '').replace(/\/$/, '');

export type Provider = 'openai' | 'groq';

const getApiUrl = (provider: Provider): string => {
  return provider === 'groq' ? GROQ_API_URL : OPENAI_API_URL;
};

const getModel = (provider: Provider): string => {
  // Groq models (using llama-3.1-8b-instant as it's the most stable and always available):
  // - llama-3.1-8b-instant: Fast, reliable 8B model (always available)
  // Alternative models you can try:
  // - llama-3.1-70b-versatile: Deprecated
  // - llama-3.3-70b-versatile: May not be available
  // - mixtral-8x7b-32768: May not be available
  return provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o';
};

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* streamChatCompletion(
  messages: Message[],
  apiKey: string | null = null,
  provider: Provider = 'groq',
  onError?: (error: Error) => void
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    // Use proxy if available and no API key provided, otherwise use direct API
    const useProxy = PROXY_URL && !apiKey;
    const apiEndpoint = useProxy ? `${PROXY_URL}/api/chat` : getApiUrl(provider);

    // Validate endpoint
    if (useProxy && !PROXY_URL) {
      throw new Error('Proxy URL is not configured. Please set VITE_PROXY_URL or provide an API key.');
    }
    // Prepare messages with system prompt
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Limit context to last 20 messages to avoid token limits
    const limitedMessages = formattedMessages.slice(-20);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if using direct API with API key
    if (!useProxy && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let response: Response;
    try {
      console.log(`[API] Fetching from: ${apiEndpoint}`);
      console.log(`[API] Using proxy: ${useProxy}, Provider: ${provider}`);
      
      response = await fetch(apiEndpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: useProxy ? 'include' : 'omit',
      headers,
      body: JSON.stringify({
        ...(useProxy ? { provider } : { model: getModel(provider) }),
        messages: limitedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      });
      
      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      // Handle network errors (CORS, connection refused, etc.)
      const errorMessage = fetchError instanceof Error 
        ? fetchError.message 
        : 'Network error';
      
      console.error(`[API] Fetch error:`, fetchError);
      console.error(`[API] Endpoint: ${apiEndpoint}`);
      console.error(`[API] Error message: ${errorMessage}`);
      
      if (useProxy) {
        // More detailed error message
        let detailedError = `Failed to connect to proxy server (${PROXY_URL}). `;
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          detailedError += `The server might be down or unreachable. `;
        } else if (errorMessage.includes('CORS')) {
          detailedError += `CORS error detected. `;
        }
        detailedError += `Please check: 1) The proxy URL is correct, 2) The endpoint /api/chat exists, 3) Try using a direct API key instead.`;
        throw new Error(detailedError);
      } else {
        throw new Error(
          `Failed to fetch from API: ${errorMessage}. ` +
          `Please check your internet connection and try again.`
        );
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error?.message || `API Error: ${response.status} ${response.statusText}`;
      
      // Provide more helpful error messages
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key and try again. You can reset it from the sidebar.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (errorMessage.includes('decommissioned') || errorMessage.includes('not supported')) {
        // If model is deprecated, suggest alternative
        errorMessage = 'The selected model is no longer available. Please try refreshing the page or contact support.';
      }
      
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
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
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              yield { content: delta, done: false };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { content: '', done: true };
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
    throw error;
  }
}

export async function validateApiKey(apiKey: string, provider: Provider = 'groq'): Promise<{ valid: boolean; error?: string }> {
  try {
    // Use a simpler model for validation
    const validationModel = provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';
    
    const response = await fetch(getApiUrl(provider), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: validationModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    // Get error message from response
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    
    return { valid: false, error: errorMessage };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error. Please check your connection.' 
    };
  }
}

