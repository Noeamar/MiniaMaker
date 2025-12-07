import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Type, Contrast } from "lucide-react";

const tips = [
  {
    icon: Eye,
    title: "Clear Main Subject",
    description: "Make your focal point instantly recognizable",
  },
  {
    icon: Heart,
    title: "Visible Emotion",
    description: "Express feelings through faces and colors",
  },
  {
    icon: Type,
    title: "Short, Readable Text",
    description: "3-5 words max, large and bold",
  },
  {
    icon: Contrast,
    title: "Strong Contrast",
    description: "Make elements pop with color differences",
  },
];

export function ThumbnailGuide() {
  return (
    <Card variant="outline" className="bg-muted/30 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">
          ✨ 4 Key Elements of a High-Performing Thumbnail
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
