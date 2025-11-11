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
    // Cloudflare Workers uses root path, Vercel uses /api/chat
    const isCloudflareWorker = PROXY_URL && PROXY_URL.includes('.workers.dev');
    const apiEndpoint = useProxy 
      ? (isCloudflareWorker ? PROXY_URL : `${PROXY_URL}/api/chat`)
      : getApiUrl(provider);

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
      console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));
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
      // Try to read error response body
      let errorData: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          console.error('[API] Error response text:', text);
          errorData = JSON.parse(text);
        } catch (parseError) {
          console.error('[API] Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
      } else {
        try {
          const text = await response.text();
          console.error('[API] Error response text (non-JSON):', text);
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        } catch (readError) {
          console.error('[API] Failed to read error response:', readError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
      }
      
      // Get error message from response - check multiple possible fields
      let errorMessage = errorData.error || errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`;
      
      // If error is an object, try to get message from it
      if (typeof errorMessage === 'object' && errorMessage.message) {
        errorMessage = errorMessage.message;
      }
      
      // Ensure errorMessage is a string
      if (typeof errorMessage !== 'string') {
        errorMessage = String(errorMessage);
      }
      
      // Log full error data for debugging
      console.error('[API] Error response data:', errorData);
      console.error('[API] Extracted error message:', errorMessage);
      
      // Provide more helpful error messages, but preserve detailed messages from server
      if (response.status === 401) {
        if (!errorMessage.includes('API key')) {
          errorMessage = 'Invalid API key. Please check your API key and try again. You can reset it from the sidebar.';
        }
      } else if (response.status === 429) {
        if (!errorMessage.includes('rate limit') && !errorMessage.includes('Rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        }
      } else if (response.status === 500) {
        // For 500 errors, show the actual error message from server if available
        // Only use generic message if no specific error was provided
        if (!errorMessage || errorMessage === `API Error: ${response.status} ${response.statusText}`) {
          errorMessage = 'Server error. Please try again later.';
        }
        // If error message contains API key info, show it directly
        if (errorMessage.includes('API key not configured') || errorMessage.includes('API key not found')) {
          // Keep the detailed message from server
        }
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

// Hugging Face Inference API untuk image generation
// Menggunakan CORS proxy karena Hugging Face API tidak support CORS langsung dari browser
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
// Alternatif CORS proxy jika yang pertama tidak bekerja
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
];

export interface ImageGenerationResult {
  imageUrl: string;
  error?: string;
}

async function tryGenerateWithProxy(prompt: string, proxyIndex: number = 0): Promise<ImageGenerationResult> {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('Semua CORS proxy gagal. Silakan coba lagi nanti.');
  }

  const proxy = CORS_PROXIES[proxyIndex];
  let proxyUrl: string;
  
  if (proxy.includes('allorigins')) {
    // allorigins.win needs the URL encoded
    proxyUrl = `${proxy}${encodeURIComponent(HUGGINGFACE_API_URL)}`;
  } else if (proxy.includes('corsproxy')) {
    proxyUrl = `${proxy}${encodeURIComponent(HUGGINGFACE_API_URL)}`;
  } else {
    proxyUrl = `${proxy}${HUGGINGFACE_API_URL}`;
  }
  
  console.log(`[ImageGen] Proxy URL: ${proxyUrl.substring(0, 100)}...`);

  try {
    console.log(`[ImageGen] Trying proxy ${proxyIndex + 1}/${CORS_PROXIES.length}: ${proxy}`);
    
    // For allorigins.win, we need to send the request body differently
    const requestBody = JSON.stringify({
      inputs: prompt,
    });
    
    console.log(`[ImageGen] Request body:`, requestBody);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });
    
    console.log(`[ImageGen] Response received, status: ${response.status}`);

    if (!response.ok) {
      // Handle rate limiting or model loading
      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        const estimatedTime = errorData.estimated_time || 0;
        throw new Error(`Model sedang loading. Silakan tunggu ${Math.ceil(estimatedTime)} detik dan coba lagi.`);
      }
      
      // Try next proxy if this one fails
      if (response.status >= 500 && proxyIndex < CORS_PROXIES.length - 1) {
        return tryGenerateWithProxy(prompt, proxyIndex + 1);
      }
      
      const errorText = await response.text();
      throw new Error(`Gagal generate gambar: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Check content type to determine if it's an image
    const contentType = response.headers.get('content-type') || '';
    console.log('[ImageGen] Response content-type:', contentType);
    console.log('[ImageGen] Response status:', response.status);
    
    let blob: Blob;
    
    // Handle different response types from different proxies
    if (contentType.startsWith('image/')) {
      // Direct image response
      blob = await response.blob();
      console.log('[ImageGen] Got direct image blob, type:', blob.type, 'size:', blob.size);
    } else {
      // Try to get as blob first (allorigins.win might return image as blob with wrong content-type)
      blob = await response.blob();
      console.log('[ImageGen] Got blob, type:', blob.type, 'size:', blob.size);
      
      // Verify it's actually an image blob
      if (!blob.type || !blob.type.startsWith('image/')) {
        // Check if blob is empty or invalid
        if (blob.size === 0) {
          throw new Error('Response kosong dari server');
        }
        
        // Try to read first bytes to check if it's actually an image
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check for image magic numbers (PNG, JPEG, etc)
        const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47;
        const isJPEG = uint8Array[0] === 0xFF && uint8Array[1] === 0xD8;
        const isGIF = uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46;
        
        if (isPNG || isJPEG || isGIF) {
          // It's an image, create new blob with correct type
          const imageType = isPNG ? 'image/png' : isJPEG ? 'image/jpeg' : 'image/gif';
          blob = new Blob([arrayBuffer], { type: imageType });
          console.log('[ImageGen] Detected image format:', imageType);
        } else {
          // Not an image, try to read as text to see what we got
          const text = new TextDecoder().decode(uint8Array.slice(0, 200));
          console.error('[ImageGen] Unexpected response (first 200 chars):', text);
          throw new Error('Response bukan gambar yang valid');
        }
      }
    }
    
    if (!blob || blob.size === 0) {
      throw new Error('Gambar kosong atau tidak valid');
    }
    
    const imageUrl = URL.createObjectURL(blob);
    console.log('[ImageGen] Image generated successfully, blob type:', blob.type, 'size:', blob.size, 'URL:', imageUrl);
    return { imageUrl };
  } catch (error) {
    // If it's a network/CORS error, try next proxy
    if ((error instanceof TypeError || error instanceof Error) && proxyIndex < CORS_PROXIES.length - 1) {
      console.log(`[ImageGen] Proxy ${proxyIndex + 1} failed, trying next...`);
      return tryGenerateWithProxy(prompt, proxyIndex + 1);
    }
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  try {
    console.log('[ImageGen] Generating image with prompt:', prompt);
    return await tryGenerateWithProxy(prompt);
  } catch (error) {
    console.error('[ImageGen] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal generate gambar';
    return { imageUrl: '', error: errorMessage };
  }
}

// Helper function to detect if message is requesting image generation
export function isImageGenerationRequest(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  // Command-based triggers (must start with command)
  const commands = ['/image', '/generate', '/gambar', '/img'];
  if (commands.some(cmd => normalized.startsWith(cmd))) {
    return true;
  }
  
  // Phrase-based triggers (must start with phrase)
  const phrases = [
    'buat gambar',
    'generate image',
    'create image',
    'buatkan gambar',
    'gambar',
  ];
  if (phrases.some(phrase => normalized.startsWith(phrase))) {
    return true;
  }
  
  return false;
}

// Extract prompt from image generation request
export function extractImagePrompt(message: string): string {
  const normalized = message.trim();
  
  // Remove command prefixes
  const prefixes = ['/image', '/generate', '/gambar', 'buat gambar', 'generate image', 'create image'];
  let prompt = normalized;
  
  for (const prefix of prefixes) {
    if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
      prompt = normalized.slice(prefix.length).trim();
      break;
    }
  }
  
  // If prompt is empty, use the original message
  return prompt || normalized;
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

