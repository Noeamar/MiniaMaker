import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface GenerationProgressProps {
  isGenerating: boolean;
}

export function GenerationProgress({ isGenerating }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      return;
    }

    // Simulate progress up to 85%, then wait for completion
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          return prev;
        }
        // Slow down as we approach 85%
        const increment = Math.max(1, (85 - prev) / 10);
        return Math.min(85, prev + increment);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Jump to 100% when generation completes
  useEffect(() => {
    if (!isGenerating && progress > 0) {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isGenerating]);

  if (!isGenerating && progress === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Génération en cours...
            </h3>
            <p className="text-sm text-muted-foreground">
              L'IA crée vos miniatures YouTube
            </p>
          </div>
          <span className="text-2xl font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Analyse du prompt</span>
          <span>Génération d'images</span>
          <span>Finalisation</span>
        </div>
      </CardContent>
    </Card>
  );
}
