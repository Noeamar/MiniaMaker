import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
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

    // Build optimized prompt for YouTube thumbnail generation
    const optimizedPrompt = `Génère une miniature YouTube professionnelle et accrocheuse avec les caractéristiques suivantes:
${prompt}

Caractéristiques techniques obligatoires:
- Format 16:9 (ratio YouTube standard)
- Couleurs vives et contrastées
- Texte gros et lisible même en petit format
- Sujet principal bien visible et centré
- Style dynamique et professionnel
- Haute résolution, qualité professionnelle`;

    console.log('Generating thumbnail with prompt:', optimizedPrompt);

    // Generate 3 thumbnail variations
    const thumbnails: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: optimizedPrompt + (i > 0 ? ` (Variation ${i + 1}: style légèrement différent)` : '')
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
            JSON.stringify({ error: 'Limite de requêtes atteinte' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ error: 'Crédits épuisés' }),
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
        JSON.stringify({ error: 'Échec de la génération des miniatures' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ thumbnails }),
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
