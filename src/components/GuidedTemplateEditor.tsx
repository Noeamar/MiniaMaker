import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableBlock } from "./EditableBlock";
import { ImageUploader } from "./ImageUploader";
import { TemplateData, UploadedImage } from "@/types/thumbnail";
import { Save, FolderOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface GuidedTemplateEditorProps {
  template: TemplateData;
  onTemplateChange: (template: TemplateData) => void;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GuidedTemplateEditor({
  template,
  onTemplateChange,
  images,
  onImagesChange,
  onGenerate,
  isGenerating,
}: GuidedTemplateEditorProps) {
  const [templateName, setTemplateName] = useState(template.name);

  const updateField = (field: keyof TemplateData, value: string) => {
    onTemplateChange({ ...template, [field]: value });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    onTemplateChange({ ...template, name: templateName });
    toast.success("Template saved successfully!");
  };

  const handleLoadTemplate = () => {
    toast.info("Template library coming soon!");
  };

  return (
    <Card variant="elevated" className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Template Editor</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-40 h-9 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
              <FolderOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <EditableBlock
          icon="🎬"
          label="Video Context"
          value={template.videoContext}
          onChange={(v) => updateField('videoContext', v)}
          placeholder="What is your video about? (e.g., 'A tutorial about building a startup')"
        />
        
        <EditableBlock
          icon="🎯"
          label="Thumbnail Objective"
          value={template.objective}
          onChange={(v) => updateField('objective', v)}
          placeholder="What should the thumbnail achieve? (e.g., 'Attract entrepreneurs')"
        />
        
        <EditableBlock
          icon="😎"
          label="Main Subject"
          value={template.mainSubject}
          onChange={(v) => updateField('mainSubject', v)}
          placeholder="Who or what is the focus? (e.g., 'A confident person at a desk')"
        />
        
        <EditableBlock
          icon="🎭"
          label="Emotion / Tone"
          value={template.emotion}
          onChange={(v) => updateField('emotion', v)}
          placeholder="What feeling should it convey? (e.g., 'Excitement, curiosity')"
        />
        
        <EditableBlock
          icon="📝"
          label="Short Text (3-5 words)"
          value={template.shortText}
          onChange={(v) => updateField('shortText', v)}
          placeholder="Text overlay on thumbnail (e.g., 'START TODAY!')"
          rows={1}
        />
        
        <EditableBlock
          icon="🎨"
          label="Visual Style"
          value={template.visualStyle}
          onChange={(v) => updateField('visualStyle', v)}
          placeholder="Art style or aesthetic (e.g., 'Cinematic, vibrant colors')"
        />

        <div className="pt-4">
          <ImageUploader images={images} onImagesChange={onImagesChange} />
        </div>

        <div className="pt-6">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={onGenerate}
            disabled={isGenerating}
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
        </div>
      </CardContent>
    </Card>
  );
}
