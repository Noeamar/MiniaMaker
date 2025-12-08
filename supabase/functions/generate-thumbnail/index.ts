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
  const { prompt, format, images } = request;
  
  let optimizedPrompt = `${SYSTEM_PROMPT}\n\n`;
  
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GenerationRequest = await req.json();
    const { prompt, model, images, format } = request;
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Le prompt est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use selected model or default
    const selectedModel = model || 'google/gemini-2.5-flash-image-preview';
    console.log('Using model:', selectedModel);

    // Build optimized prompt
    const optimizedPrompt = buildOptimizedPrompt(request);
    console.log('Generating thumbnail with optimized prompt');

    // Generate 3 thumbnail variations
    const thumbnails: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      // Build message content with images if provided
      const messageContent: any[] = [];
      
      // Add text prompt
      messageContent.push({
        type: 'text',
        text: optimizedPrompt + (i > 0 ? ` (Variation ${i + 1}: composition et style légèrement différents)` : '')
      });
      
      // Add images if provided
      if (images && images.length > 0) {
        for (const imageUrl of images) {
          messageContent.push({
            type: 'image_url',
            image_url: { url: imageUrl }
          });
        }
      }
      
      // Add brand logo if provided
      if (format?.includeLogo && format.brandLogoUrl) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: format.brandLogoUrl }
        });
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'user',
              content: messageContent.length === 1 ? messageContent[0].text : messageContent
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const status = response.status;
        console.error(`AI gateway error: ${status}`);
        
        if (status === 429) {
          return new Response(
            JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: 'Crédits épuisés. Veuillez recharger votre compte.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const errorText = await response.text();
        console.error('Error response:', errorText);
        continue; // Try next variation
      }

      const data = await response.json();
      console.log('AI response received for variation', i + 1);
      
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        thumbnails.push(imageUrl);
        console.log('Image generated successfully for variation', i + 1);
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
