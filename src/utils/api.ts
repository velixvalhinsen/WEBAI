import { SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { Message } from './localStorage';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* streamChatCompletion(
  messages: Message[],
  apiKey: string,
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

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o as the most advanced available model
        messages: limitedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `API Error: ${response.status} ${response.statusText}`
      );
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

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

