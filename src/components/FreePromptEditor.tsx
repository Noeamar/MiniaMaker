import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { UploadedImage } from "@/types/thumbnail";
import { Play, Loader2 } from "lucide-react";

interface FreePromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function FreePromptEditor({
  prompt,
  onPromptChange,
  images,
  onImagesChange,
  onGenerate,
  isGenerating,
}: FreePromptEditorProps) {
  return (
    <Card className="border-border opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Prompt Libre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Décrivez votre miniature YouTube idéale... Soyez aussi créatif que vous voulez !

Exemple : Une miniature cinématique montrant une personne choquée devant son écran d'ordinateur, avec du code lumineux en arrière-plan. Un texte jaune en gras dit 'ÇA MARCHE !' Le style est moderne et tech avec un fort contraste."
            rows={8}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Astuce : Plus vous donnez de détails, meilleurs seront les résultats.
          </p>
        </div>

        <ImageUploader images={images} onImagesChange={onImagesChange} />

        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2 fill-current" />
              Générer les Miniatures
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
