import { AIModel, AI_MODELS } from "@/types/thumbnail";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Modèle IA
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AI_MODELS.map((model) => (
          <Card
            key={model.value}
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 hover:border-primary/50",
              selectedModel === model.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
            onClick={() => onModelChange(model.value)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{model.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground">
                  {model.label}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {model.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
