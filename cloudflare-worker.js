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
      
      // Handle image generation endpoint - check path first before parsing body
      const isImageEndpoint = path === '/image' || path.endsWith('/image') || path.includes('/image');
      console.log(`[Worker] Is image endpoint: ${isImageEndpoint}`);
      
      if (isImageEndpoint) {
        let body;
        try {
          body = await request.json();
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
          return new Response(
            JSON.stringify({ error: 'Prompt is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        console.log(`[Worker] Image generation request, prompt: ${prompt.substring(0, 50)}...`);
        
        // Call Hugging Face API
        const hfResponse = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          
          const errorText = await hfResponse.text();
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
      let body;
      try {
        body = await request.json();
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
        return new Response(
          JSON.stringify({ error: 'Invalid messages format' }),
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

