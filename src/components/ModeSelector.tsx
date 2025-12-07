import { Card, CardContent } from "@/components/ui/card";
import { InputMode } from "@/types/thumbnail";
import { FileText, Layout, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  selectedMode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const modes = [
  {
    id: 'free' as InputMode,
    title: 'Free Prompt',
    description: 'Write anything you want',
    icon: FileText,
  },
  {
    id: 'guided' as InputMode,
    title: 'Guided Template',
    description: 'Structured editor with sections',
    icon: Layout,
  },
  {
    id: 'assisted' as InputMode,
    title: 'Assisted Mode',
    description: 'Quick wizard with 3 questions',
    icon: Wand2,
  },
];

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modes.map((mode, index) => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.id;
        
        return (
          <Card
            key={mode.id}
            variant="interactive"
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "opacity-0 animate-fade-in-up cursor-pointer transition-all duration-300",
              isSelected && "ring-2 ring-primary border-primary/50 shadow-glow",
              !isSelected && "hover:border-primary/30"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-xl transition-colors duration-300",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
