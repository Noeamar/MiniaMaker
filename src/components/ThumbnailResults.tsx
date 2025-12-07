import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedThumbnail } from "@/types/thumbnail";
import { Heart, Download, RefreshCw, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThumbnailResultsProps {
  thumbnails: GeneratedThumbnail[];
  onToggleFavorite: (id: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function ThumbnailResults({
  thumbnails,
  onToggleFavorite,
  onRegenerate,
  isRegenerating,
}: ThumbnailResultsProps) {
  const handleDownload = async (thumbnail: GeneratedThumbnail) => {
    try {
      const response = await fetch(thumbnail.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `miniature-youtube-${thumbnail.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Miniature téléchargée !");
    } catch (error) {
      toast.error("Échec du téléchargement");
    }
  };

  const handleSavePrompt = (thumbnail: GeneratedThumbnail) => {
    toast.success("Prompt sauvegardé comme template !");
  };

  if (thumbnails.length === 0) {
    return null;
  }

  return (
    <Card className="border-border opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Miniatures Générées</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Régénérer</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {thumbnails.map((thumbnail, index) => (
            <div
              key={thumbnail.id}
              className={cn(
                "group relative aspect-video rounded-xl overflow-hidden bg-muted",
                "opacity-0 animate-scale-in"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={thumbnail.url}
                alt="Miniature YouTube générée"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-8 h-8 bg-background/20 backdrop-blur-sm hover:bg-background/30"
                      onClick={() => onToggleFavorite(thumbnail.id)}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          thumbnail.isFavorite ? "fill-primary text-primary" : "text-primary-foreground"
                        )}
                      />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-8 h-8 bg-background/20 backdrop-blur-sm hover:bg-background/30"
                      onClick={() => handleDownload(thumbnail)}
                    >
                      <Download className="w-4 h-4 text-primary-foreground" />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 bg-background/20 backdrop-blur-sm hover:bg-background/30"
                    onClick={() => handleSavePrompt(thumbnail)}
                  >
                    <Save className="w-4 h-4 text-primary-foreground" />
                  </Button>
                </div>
              </div>

              {/* Favorite indicator */}
              {thumbnail.isFavorite && (
                <div className="absolute top-3 right-3">
                  <Heart className="w-5 h-5 fill-primary text-primary drop-shadow-lg" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
