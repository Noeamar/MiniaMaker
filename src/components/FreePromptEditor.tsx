import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { UploadedImage } from "@/types/thumbnail";
import { Sparkles } from "lucide-react";

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
    <Card variant="elevated" className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Free Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe your ideal YouTube thumbnail... Be as creative as you want!

Example: A dramatic cinematic thumbnail showing a person looking shocked at their laptop screen, with glowing code in the background. Bold yellow text says 'IT WORKED!' The style is modern and tech-focused with high contrast."
            rows={8}
            className="resize-none text-base"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Tip: The more details you provide, the better the results will be.
          </p>
        </div>

        <ImageUploader images={images} onImagesChange={onImagesChange} />

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Thumbnails
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
