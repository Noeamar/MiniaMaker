import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Type, Contrast } from "lucide-react";

const tips = [
  {
    icon: Eye,
    title: "Sujet principal clair",
    description: "Rendez votre point focal immédiatement reconnaissable",
  },
  {
    icon: Heart,
    title: "Émotion visible",
    description: "Exprimez les sentiments à travers les visages et couleurs",
  },
  {
    icon: Type,
    title: "Texte court et lisible",
    description: "3-5 mots max, gros et en gras",
  },
  {
    icon: Contrast,
    title: "Contraste fort",
    description: "Faites ressortir les éléments avec des couleurs contrastées",
  },
];

export function ThumbnailGuide() {
  return (
    <Card className="bg-muted/30 border-border opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">
          ✨ Les 4 Éléments Clés d'une Miniature YouTube Performante
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-xs">{tip.title}</p>
                  <p className="text-muted-foreground text-xs">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
