import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Professional YouTube thumbnail system prompt
const SYSTEM_PROMPT = `Tu es un générateur professionnel de miniatures YouTube.
Ton objectif est de produire des miniatures hautement engageantes et cliquables en suivant les meilleures pratiques de l'industrie:

- Utilise un point focal fort et clair
- Maximise le contraste et la luminosité
- Utilise du texte gros et massif (3-5 mots maximum)
- Assure-toi que le texte est lisible même en petit format
- Utilise des émotions expressives et exagérées quand des visages sont inclus
- Intègre les logos clairement si fournis
- Garde une composition épurée sans encombrement
- Suis le formatage optimisé YouTube

Format par défaut: 1280×720 (16:9).
Sauf indication contraire de l'utilisateur, suis toujours ce format.`;

interface GenerationRequest {
  prompt: string;
  model?: string;
  images?: string[];
  format?: {
    ratio: string;
    customRatio?: string;
    resolution: string;
    includeLogo: boolean;
    brandLogoUrl?: string;
    brandColor: string;
    fontStyle: string;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

function getResolutionDimensions(resolution: string, ratio: string, customRatio?: string): string {
  const ratioValue = ratio === 'custom' && customRatio 
    ? customRatio 
    : ratio;
  
  const resMap: Record<string, Record<string, string>> = {
    '720p': { '16:9': '1280×720', '1:1': '720×720', '9:16': '720×1280' },
    '1080p': { '16:9': '1920×1080', '1:1': '1080×1080', '9:16': '1080×1920' },
    '4K': { '16:9': '3840×2160', '1:1': '2160×2160', '9:16': '2160×3840' },
  };
  
  return resMap[resolution]?.[ratioValue] || resMap[resolution]?.['16:9'] || '1920×1080';
}

function buildOptimizedPrompt(request: GenerationRequest): string {
  const { prompt, format, images, conversationHistory } = request;
  
  let optimizedPrompt = `${SYSTEM_PROMPT}\n\n`;
  
  // Add conversation context if available (memory)
  if (conversationHistory && conversationHistory.length > 0) {
    optimizedPrompt += `CONTEXTE DE LA CONVERSATION:\n`;
    optimizedPrompt += `Voici les échanges précédents pour comprendre le contexte et maintenir la cohérence:\n`;
    conversationHistory.forEach(msg => {
      optimizedPrompt += `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}\n`;
    });
    optimizedPrompt += '\n';
  }
  
  // Add format specifications
  if (format) {
    const dimensions = getResolutionDimensions(format.resolution, format.ratio, format.customRatio);
    optimizedPrompt += `SPÉCIFICATIONS TECHNIQUES:\n`;
    optimizedPrompt += `- Dimensions: ${dimensions}\n`;
    optimizedPrompt += `- Ratio: ${format.ratio === 'custom' ? format.customRatio : format.ratio}\n`;
    optimizedPrompt += `- Couleur de marque: ${format.brandColor}\n`;
    optimizedPrompt += `- Style de police: ${format.fontStyle}\n`;
    
    if (format.includeLogo && format.brandLogoUrl) {
      optimizedPrompt += `- Intégrer le logo de marque de manière visible\n`;
    }
    optimizedPrompt += '\n';
  }
  
  // Add image references if provided
  if (images && images.length > 0) {
    optimizedPrompt += `IMAGES DE RÉFÉRENCE À INTÉGRER:\n`;
    optimizedPrompt += `Utilise les images suivantes comme références visuelles obligatoires.\n`;
    optimizedPrompt += `Intègre-les naturellement dans la composition pour améliorer la clarté, les points focaux, les émotions, les logos ou les éléments d'arrière-plan.\n\n`;
  }
  
  // Add user prompt
  optimizedPrompt += `DEMANDE DE L'UTILISATEUR:\n${prompt}\n\n`;
  
  // Final instruction
  optimizedPrompt += `Génère une miniature YouTube professionnelle, accrocheuse et visuellement impactante qui respecte toutes ces directives.`;
  
  return optimizedPrompt;
}

// Map Lovable model names to Google Gemini API model names
// Map internal model names to Google Gemini API model names
function mapModelToGemini(model: string): string {
  const modelMap: Record<string, string> = {
    // BASIC – ultra cheap (2.0)
    'google/gemini-2.0-basic-lite': 'gemini-2.0-flash-lite',

    // NORMAL – medium price (2.5)
    'google/gemini-2.5-flash-image-preview': 'gemini-2.5-flash-image-preview',

    // PRO – best quality (3.0)
    'google/gemini-3-pro-image-preview': 'gemini-3-pro-image-preview',
  };

  // Default to cheapest model
  return modelMap[model] || 'gemini-2.0-flash-lite';
}

// Convert image URL or base64 to Gemini format
async function prepareImageForGemini(imageUrl: string): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
  try {
    let imageData: string;
    let mimeType = 'image/jpeg';

    // If it's a base64 data URL
    if (imageUrl.startsWith('data:image/')) {
      const [header, data] = imageUrl.split(',');
      imageData = data;
      const mimeMatch = header.match(/data:image\/(\w+);base64/);
      if (mimeMatch) {
        mimeType = `image/${mimeMatch[1]}`;
      }
    } 
    // If it's a regular URL, fetch and convert to base64
    else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image: ${imageUrl}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      imageData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        mimeType = contentType;
      }
    }
    // If it's already base64
    else {
      imageData = imageUrl;
    }

    return {
      inlineData: {
        mimeType,
        data: imageData
      }
    };
  } catch (error) {
    console.error('Error preparing image:', error);
    return null;
  }
}

serve(async (req) => {
  // Log that function was called
  console.log('=== GENERATE-THUMBNAIL FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request body...');
    const request: GenerationRequest = await req.json();
    console.log('Request received:', {
      prompt: request.prompt?.substring(0, 50) + '...',
      model: request.model,
      imagesCount: request.images?.length || 0,
      hasFormat: !!request.format
    });
    const { prompt, model, images, format } = request;
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Le prompt est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use selected model or default
    const selectedModel = model || 'google/gemini-2.5-flash-image-preview';
    const geminiModel = mapModelToGemini(selectedModel);
    console.log('Using model:', selectedModel, '->', geminiModel);

    // Build optimized prompt
    const optimizedPrompt = buildOptimizedPrompt(request);
    console.log('Generating thumbnail with optimized prompt');

    // Generate 3 thumbnail variations
    const thumbnails: string[] = [];
    
    for (let i = 0; i < 1; i++) {
      // Build content parts for Gemini API
      const parts: any[] = [];
      
      // Add text prompt with variation instruction
      const promptText = optimizedPrompt + (i > 0 ? ` (Variation ${i + 1}: composition et style légèrement différents)` : '');
      parts.push({ text: promptText });
      
      // Add reference images if provided
      if (images && images.length > 0) {
        for (const imageUrl of images) {
          const imagePart = await prepareImageForGemini(imageUrl);
          if (imagePart) {
            parts.push(imagePart);
          }
        }
      }
      
      // Add brand logo if provided
      if (format?.includeLogo && format.brandLogoUrl) {
        const logoPart = await prepareImageForGemini(format.brandLogoUrl);
        if (logoPart) {
          parts.push(logoPart);
        }
      }

      // Call Google Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        console.error(`Google Gemini API error: ${status}`, errorText);
        
        // Try to parse error text as JSON to get the actual error message
        let parsedError: any = null;
        try {
          parsedError = JSON.parse(errorText);
          console.error('Parsed error from Google API:', parsedError);
        } catch (e) {
          console.error('Could not parse error text as JSON:', errorText);
        }
        
        if (status === 402) {
          // Extract actual error message from Google API response
          const actualErrorMessage = parsedError?.error?.message || 
                                     parsedError?.error?.message || 
                                     errorText.substring(0, 300) ||
                                     'Quota API Google épuisé ou clé API invalide. Vérifiez vos quotas dans Google Cloud Console et que la clé API a les permissions nécessaires.';
          
          console.error('402 Error details:', {
            parsedError,
            errorText: errorText.substring(0, 500),
            actualErrorMessage
          });
          
          return new Response(
            JSON.stringify({ 
              error: actualErrorMessage,
              details: errorText.substring(0, 500),
              parsedError: parsedError
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (status === 403) {
          return new Response(
            JSON.stringify({ error: 'Clé API invalide ou permissions insuffisantes. Vérifiez votre clé API Google.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        continue; // Try next variation
      }

      const data = await response.json();
      console.log(`Google Gemini API response received for variation ${i + 1}`);
      
      // Extract generated image from Gemini response
      const candidate = data.candidates?.[0];
      
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          // Check for inline image data
          if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            thumbnails.push(imageUrl);
            console.log(`Image generated successfully for variation ${i + 1}`);
            break;
          }
        }
      }
    }

    if (thumbnails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Échec de la génération des miniatures. Veuillez réessayer.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated ${thumbnails.length} thumbnails`);
    
    return new Response(
      JSON.stringify({ thumbnails, model: selectedModel }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
