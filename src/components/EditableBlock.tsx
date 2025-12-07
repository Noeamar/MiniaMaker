import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface EditableBlockProps {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

export function EditableBlock({
  icon,
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: EditableBlockProps) {
  return (
    <div className="editable-block group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-muted-foreground group-focus-within:text-foreground transition-colors">
          {label}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-0 bg-transparent p-0 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50 text-foreground"
      />
    </div>
  );
}
