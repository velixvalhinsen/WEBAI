import { SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { Message } from './localStorage';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type Provider = 'openai' | 'groq';

const getApiUrl = (provider: Provider): string => {
  return provider === 'groq' ? GROQ_API_URL : OPENAI_API_URL;
};

const getModel = (provider: Provider): string => {
  // Groq models:
  // - mixtral-8x7b-32768: High-quality model with 32k context (recommended)
  // - llama-3.1-8b-instant: Fast 8B model (alternative)
  // Note: llama-3.1-70b-versatile and llama-3.3-70b-versatile may not be available
  return provider === 'groq' ? 'mixtral-8x7b-32768' : 'gpt-4o';
};

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* streamChatCompletion(
  messages: Message[],
  apiKey: string,
  provider: Provider = 'groq',
  onError?: (error: Error) => void
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
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

    const response = await fetch(getApiUrl(provider), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModel(provider),
        messages: limitedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

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

