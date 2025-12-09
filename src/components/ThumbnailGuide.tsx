import { Card, CardContent } from "@/components/ui/card";
import { Target, Smile, MessageSquare, Zap } from "lucide-react";

const tips = [
  {
    icon: Target,
    title: "Point focal",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Smile,
    title: "Émotion forte",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: MessageSquare,
    title: "Texte court",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "Contraste",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export function ThumbnailGuide() {
  return (
    <Card className="bg-secondary/30 border-border/50 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-4 text-center text-muted-foreground uppercase tracking-wider">
          Les 4 Éléments Clés
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className={`p-3 rounded-xl ${tip.bgColor}`}>
                  <Icon className={`w-7 h-7 ${tip.color}`} />
                </div>
                <p className="font-medium text-foreground text-sm">{tip.title}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}