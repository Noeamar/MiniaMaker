import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableBlock } from "./EditableBlock";
import { ImageUploader } from "./ImageUploader";
import { TemplateData, UploadedImage } from "@/types/thumbnail";
import { Save, FolderOpen, Play, Loader2 } from "lucide-react";
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
      toast.error("Veuillez entrer un nom de template");
      return;
    }
    onTemplateChange({ ...template, name: templateName });
    toast.success("Template sauvegardé !");
  };

  const handleLoadTemplate = () => {
    toast.info("Bibliothèque de templates bientôt disponible !");
  };

  return (
    <Card className="border-border opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Éditeur de Template</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nom du template..."
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
          label="Contexte de la vidéo"
          value={template.videoContext}
          onChange={(v) => updateField('videoContext', v)}
          placeholder="De quoi parle votre vidéo ? (ex: 'Un tutoriel sur le montage vidéo')"
        />
        
        <EditableBlock
          icon="🎯"
          label="Objectif de la miniature"
          value={template.objective}
          onChange={(v) => updateField('objective', v)}
          placeholder="Que doit accomplir la miniature ? (ex: 'Attirer les créateurs YouTube')"
        />
        
        <EditableBlock
          icon="😎"
          label="Sujet principal"
          value={template.mainSubject}
          onChange={(v) => updateField('mainSubject', v)}
          placeholder="Qui ou quoi est au centre ? (ex: 'Mon visage surpris devant un écran')"
        />
        
        <EditableBlock
          icon="🎭"
          label="Émotion / Ton"
          value={template.emotion}
          onChange={(v) => updateField('emotion', v)}
          placeholder="Quel sentiment transmettre ? (ex: 'Excitation, curiosité')"
        />
        
        <EditableBlock
          icon="📝"
          label="Texte court (3-5 mots)"
          value={template.shortText}
          onChange={(v) => updateField('shortText', v)}
          placeholder="Texte sur la miniature (ex: 'C'EST INCROYABLE !')"
          rows={1}
        />
        
        <EditableBlock
          icon="🎨"
          label="Style visuel"
          value={template.visualStyle}
          onChange={(v) => updateField('visualStyle', v)}
          placeholder="Style artistique (ex: 'Cinématique, couleurs vives')"
        />

        <div className="pt-4">
          <ImageUploader images={images} onImagesChange={onImagesChange} />
        </div>

        <div className="pt-6">
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Générer les Miniatures
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
