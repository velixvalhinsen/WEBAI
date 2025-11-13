// Cloudflare Worker untuk proxy API calls
// Deploy ke Cloudflare Workers (gratis)

export default {
  async fetch(request, env) {
    // CORS headers - Allow requests from any origin
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    if (origin) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    } else {
      corsHeaders['Access-Control-Allow-Origin'] = '*';
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Log request
      const url = new URL(request.url);
      const path = url.pathname;
      console.log(`[${new Date().toISOString()}] ${request.method} ${path} from origin: ${origin}`);
      console.log(`[Worker] Full URL: ${request.url}, Path: ${path}`);
      
      // Handle image generation and editing endpoints - check path first before parsing body
      // Normalize path (remove trailing slash, handle different formats)
      const normalizedPath = path.replace(/\/$/, '');
      // Check for image endpoint - must be exact match or ends with /image
      const isImageEndpoint = normalizedPath === '/image' || 
                              normalizedPath.endsWith('/image') ||
                              normalizedPath === 'image';
      // Check for remove-bg endpoint
      const isRemoveBgEndpoint = normalizedPath === '/remove-bg' || 
                                  normalizedPath.endsWith('/remove-bg') ||
                                  normalizedPath === 'remove-bg';
      console.log(`[Worker] Normalized path: ${normalizedPath}, Is image endpoint: ${isImageEndpoint}, Is remove-bg endpoint: ${isRemoveBgEndpoint}`);
      
      if (isRemoveBgEndpoint) {
        console.log('[Worker] Handling background removal request');
        
        // Clone request to avoid consuming body if we need to read it
        const clonedRequest = request.clone();
        let body;
        try {
          body = await clonedRequest.json();
          console.log('[Worker] Remove-bg request body keys:', Object.keys(body || {}));
        } catch (jsonError) {
          console.error('[Worker] Error parsing JSON:', jsonError);
          return new Response(
            JSON.stringify({ error: 'Invalid JSON in request body', details: jsonError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Support both 'image' and 'inputs' field names
        const image = body.image || body.inputs;
        
        if (!image) {
          console.error('[Worker] Image missing in request body. Body keys:', Object.keys(body || {}));
          return new Response(
            JSON.stringify({ 
              error: 'Image is required',
              received_keys: Object.keys(body || {}),
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.log(`[Worker] Background removal request, image data length: ${image.length}`);
        
        // Get Hugging Face token
        const hfToken = env.HUGGINGFACE_API_TOKEN || env.HF_TOKEN;
        
        if (!hfToken) {
          return new Response(
            JSON.stringify({ 
              error: 'Hugging Face API token not configured. Please set HUGGINGFACE_API_TOKEN or HF_TOKEN secret in Cloudflare Worker.' 
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Call Hugging Face API for background removal
        // Try different model endpoints for background removal
        // Option 1: Try RMBG-1.4 via inference API
        let hfResponse;
        let lastError;
        
        // Try background removal using Hugging Face
        // Note: Model availability may vary, trying multiple approaches
        try {
          // First, try old inference API (might still work)
          hfResponse = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${hfToken}`,
            },
            body: JSON.stringify({
              inputs: image, // Base64 image data
            }),
          });
          
          console.log(`[Worker] Old API response status: ${hfResponse.status}`);
          
          // If 404 or not available, try router endpoint
          if (hfResponse.status === 404 || hfResponse.status === 503) {
            console.log('[Worker] Old API not available, trying router endpoint...');
            hfResponse = await fetch('https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${hfToken}`,
              },
              body: JSON.stringify({
                inputs: image,
              }),
            });
            console.log(`[Worker] Router endpoint response status: ${hfResponse.status}`);
          }
        } catch (error) {
          console.error('[Worker] Error calling Hugging Face API:', error);
          return new Response(
            JSON.stringify({ 
              error: `Failed to call background removal API: ${error.message}. Model briaai/RMBG-1.4 mungkin tidak tersedia. Silakan cek ketersediaan model di Hugging Face atau gunakan service alternatif.` 
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.log(`[Worker] Hugging Face response status: ${hfResponse.status}`);
        
        if (!hfResponse.ok) {
          let errorText = await hfResponse.text();
          
          if (hfResponse.status === 401) {
            errorText = 'Hugging Face API token invalid or expired. Please check your token.';
          }
          
          return new Response(
            JSON.stringify({ error: `Hugging Face API error: ${hfResponse.status} ${hfResponse.statusText}. ${errorText}` }),
            {
              status: hfResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Get image blob and return it
        const imageBlob = await hfResponse.blob();
        console.log(`[Worker] Background removed, size: ${imageBlob.size}, type: ${imageBlob.type}`);
        
        return new Response(imageBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': imageBlob.type || 'image/png',
          },
        });
      }
      
      if (isImageEndpoint) {
        console.log('[Worker] Handling image generation request');
        
        // Clone request to avoid consuming body if we need to read it
        const clonedRequest = request.clone();
        let body;
        try {
          body = await clonedRequest.json();
          console.log('[Worker] Image request body:', JSON.stringify(body).substring(0, 100));
        } catch (jsonError) {
          console.error('[Worker] Error parsing JSON:', jsonError);
          return new Response(
            JSON.stringify({ error: 'Invalid JSON in request body', details: jsonError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        const { prompt } = body;
        
        if (!prompt) {
          console.error('[Worker] Prompt missing in request body. Body keys:', Object.keys(body || {}));
          return new Response(
            JSON.stringify({ 
              error: 'Prompt is required',
              received_keys: Object.keys(body || {}),
              body_sample: JSON.stringify(body).substring(0, 200)
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.log(`[Worker] Image generation request, prompt: ${prompt.substring(0, 50)}...`);
        
        // Call Hugging Face API - using new router endpoint
        // Format: https://router.huggingface.co/hf-inference/models/{model_id}
        // Note: New endpoint requires authentication token
        const hfToken = env.HUGGINGFACE_API_TOKEN || env.HF_TOKEN;
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add Authorization header if token is available
        if (hfToken) {
          headers['Authorization'] = `Bearer ${hfToken}`;
        }
        
        const hfResponse = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            inputs: prompt,
          }),
        });
        
        console.log(`[Worker] Hugging Face response status: ${hfResponse.status}`);
        
        if (!hfResponse.ok) {
          if (hfResponse.status === 503) {
            const errorData = await hfResponse.json().catch(() => ({}));
            const estimatedTime = errorData.estimated_time || 0;
            return new Response(
              JSON.stringify({ 
                error: `Model sedang loading. Silakan tunggu ${Math.ceil(estimatedTime)} detik dan coba lagi.`,
                estimated_time: estimatedTime 
              }),
              {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
          
          let errorText = await hfResponse.text();
          
          // Provide helpful error message for 401
          if (hfResponse.status === 401) {
            errorText = 'Hugging Face API memerlukan token autentikasi. Silakan tambahkan HUGGINGFACE_API_TOKEN atau HF_TOKEN sebagai secret di Cloudflare Worker. Dapatkan token gratis di: https://huggingface.co/settings/tokens';
          }
          
          return new Response(
            JSON.stringify({ error: `Hugging Face API error: ${hfResponse.status} ${hfResponse.statusText}. ${errorText}` }),
            {
              status: hfResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Get image blob and return it
        const imageBlob = await hfResponse.blob();
        console.log(`[Worker] Image generated, size: ${imageBlob.size}, type: ${imageBlob.type}`);
        
        return new Response(imageBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': imageBlob.type || 'image/png',
          },
        });
      }
      
      // Handle chat completion endpoint (existing code)
      console.log('[Worker] Handling chat completion request');
      let body;
      try {
        body = await request.json();
        console.log('[Worker] Chat request body keys:', Object.keys(body));
      } catch (jsonError) {
        console.error('[Worker] Error parsing JSON:', jsonError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body', details: jsonError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      const { messages, provider = 'groq' } = body;
      
      console.log(`[Worker] Provider: ${provider}, Messages count: ${messages?.length || 0}`);

      if (!messages || !Array.isArray(messages)) {
        console.error('[Worker] Invalid messages format. Body keys:', Object.keys(body));
        return new Response(
          JSON.stringify({ 
            error: 'Invalid messages format',
            hint: 'Expected { messages: [...], provider: "groq" } but got different format',
            received_keys: Object.keys(body)
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get API key from environment variable (set di Cloudflare Workers dashboard)
      // Log all available env keys for debugging (without exposing values)
      const envKeys = Object.keys(env || {});
      console.log(`[Worker] Available env keys: ${envKeys.join(', ')}`);
      console.log(`[Worker] Looking for API key: ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'}`);
      
      const apiKey = provider === 'groq' 
        ? env.GROQ_API_KEY 
        : env.OPENAI_API_KEY;

      // More detailed logging
      const apiKeyExists = !!apiKey;
      const apiKeyLength = apiKey ? apiKey.length : 0;
      const apiKeyPrefix = apiKey ? apiKey.substring(0, 4) + '...' : 'N/A';
      
      console.log(`[Worker] API key exists: ${apiKeyExists}, Provider: ${provider}`);
      console.log(`[Worker] API key length: ${apiKeyLength}, Prefix: ${apiKeyPrefix}`);

      if (!apiKey) {
        console.error(`[Worker] API key not found for provider: ${provider}`);
        console.error(`[Worker] Expected env key: ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'}`);
        console.error(`[Worker] Available env keys: ${envKeys.length > 0 ? envKeys.join(', ') : 'NONE'}`);
        
        return new Response(
          JSON.stringify({ 
            error: `API key not configured for provider: ${provider}. Please set ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'} using: wrangler secret put ${provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'}`,
            hint: 'After setting the secret, redeploy the worker using: npm run deploy:worker'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Determine API URL and model
      const apiUrl = provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const model = provider === 'groq'
        ? 'llama-3.1-8b-instant'
        : 'gpt-4o';

      // Forward request to Groq/OpenAI API
      console.log(`[Worker] Fetching from: ${apiUrl}, Model: ${model}`);
      
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

      console.log(`[Worker] API response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData = {};
        try {
          const text = await response.text();
          console.error(`[Worker] API error response text:`, text);
          errorData = JSON.parse(text);
        } catch (parseError) {
          console.error(`[Worker] Failed to parse error response:`, parseError);
          errorData = { error: { message: `API Error: ${response.status} ${response.statusText}` } };
        }
        return new Response(
          JSON.stringify({
            error: errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if response body exists
      if (!response.body) {
        console.error('[Worker] Response body is null or undefined');
        return new Response(
          JSON.stringify({ error: 'No response body from API' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Stream the response
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      // Stream processing
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('[Worker] Stream finished');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue; // Skip empty lines
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  await writer.write(encoder.encode('data: [DONE]\n\n'));
                  await writer.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  // Forward the original Groq/OpenAI format to frontend
                  // Frontend expects: {choices: [{delta: {content: "..."}}]}
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                    await writer.write(encoder.encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.error('[Worker] Error parsing JSON:', e, 'Line:', line);
                }
              }
            }
          }
          // Ensure we close the writer properly
          try {
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            await writer.close();
          } catch (closeError) {
            console.error('[Worker] Error closing writer:', closeError);
          }
        } catch (error) {
          console.error('[Worker] Stream processing error:', error);
          console.error('[Worker] Stream error name:', error.name);
          console.error('[Worker] Stream error message:', error.message);
          try {
            await writer.abort(error);
          } catch (abortError) {
            console.error('[Worker] Error aborting writer:', abortError);
          }
        }
      })();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('[Worker] Proxy error:', error);
      console.error('[Worker] Error name:', error.name);
      console.error('[Worker] Error message:', error.message);
      console.error('[Worker] Error stack:', error.stack);
      
      // Return error response with details
      const errorResponse = {
        error: error.message || 'Internal server error',
        type: error.name || 'UnknownError',
        ...(error.stack && { stack: error.stack })
      };
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

