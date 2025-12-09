import { AIModel, AI_MODELS } from "@/types/thumbnail";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Cpu } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const currentModel = AI_MODELS.find(m => m.value === selectedModel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Cpu className="w-4 h-4" />
          <span className="hidden sm:inline">{currentModel?.label || 'Modèle'}</span>
          <span className="sm:hidden">{currentModel?.icon}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 bg-popover">
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.value}
            onClick={() => onModelChange(model.value)}
            className={`flex items-start gap-3 p-3 cursor-pointer ${
              selectedModel === model.value ? 'bg-primary/10' : ''
            }`}
          >
            <span className="text-xl mt-0.5">{model.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{model.label}</p>
              <p className="text-xs text-muted-foreground">{model.description}</p>
            </div>
            {selectedModel === model.value && (
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}