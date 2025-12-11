import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, X } from 'lucide-react';

interface AdvancedPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string) => void;
}

interface PromptAnswers {
  sujet: string;
  contexte: string;
  emotion: string;
  texte: string;
  style: string;
  couleurs: string;
  composition: string;
  cible: string;
}

export function AdvancedPromptDialog({ open, onOpenChange, onGenerate }: AdvancedPromptDialogProps) {
  const [answers, setAnswers] = useState<PromptAnswers>({
    sujet: '',
    contexte: '',
    emotion: '',
    texte: '',
    style: '',
    couleurs: '',
    composition: '',
    cible: '',
  });

  const generatePrompt = () => {
    const parts: string[] = [];
    
    if (answers.sujet) parts.push(`Sujet principal: ${answers.sujet}`);
    if (answers.contexte) parts.push(`Contexte de la vidéo: ${answers.contexte}`);
    if (answers.emotion) parts.push(`Émotion à transmettre: ${answers.emotion}`);
    if (answers.texte) parts.push(`Texte à afficher: ${answers.texte}`);
    if (answers.style) parts.push(`Style visuel: ${answers.style}`);
    if (answers.couleurs) parts.push(`Palette de couleurs: ${answers.couleurs}`);
    if (answers.composition) parts.push(`Composition: ${answers.composition}`);
    if (answers.cible) parts.push(`Public cible: ${answers.cible}`);

    const fullPrompt = parts.join('. ');
    onGenerate(fullPrompt);
    onOpenChange(false);
    // Reset form
    setAnswers({
      sujet: '',
      contexte: '',
      emotion: '',
      texte: '',
      style: '',
      couleurs: '',
      composition: '',
      cible: '',
    });
  };

  const updateAnswer = (key: keyof PromptAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Prompt Avancé
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sujet">Sujet principal *</Label>
              <Textarea
                id="sujet"
                placeholder="Qui ou quoi est le sujet principal de la miniature ? (ex: Une personne tenant un produit, un paysage, un objet...)"
                value={answers.sujet}
                onChange={(e) => updateAnswer('sujet', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contexte">Contexte de la vidéo</Label>
              <Textarea
                id="contexte"
                placeholder="De quoi parle votre vidéo ? Quel est le thème principal ?"
                value={answers.contexte}
                onChange={(e) => updateAnswer('contexte', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotion">Émotion à transmettre</Label>
              <Input
                id="emotion"
                placeholder="ex: Excitation, curiosité, urgence, joie, surprise..."
                value={answers.emotion}
                onChange={(e) => updateAnswer('emotion', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="texte">Texte à afficher</Label>
              <Input
                id="texte"
                placeholder="Le texte principal à afficher sur la miniature (3-5 mots max recommandé)"
                value={answers.texte}
                onChange={(e) => updateAnswer('texte', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style visuel</Label>
              <Input
                id="style"
                placeholder="ex: Moderne, minimaliste, dynamique, épuré, coloré..."
                value={answers.style}
                onChange={(e) => updateAnswer('style', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couleurs">Palette de couleurs</Label>
              <Input
                id="couleurs"
                placeholder="ex: Rouge et blanc, dégradé bleu-vert, tons chauds..."
                value={answers.couleurs}
                onChange={(e) => updateAnswer('couleurs', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="composition">Composition</Label>
              <Textarea
                id="composition"
                placeholder="Comment organiser les éléments ? (ex: Sujet au centre, texte en haut, logo en bas à droite...)"
                value={answers.composition}
                onChange={(e) => updateAnswer('composition', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cible">Public cible</Label>
              <Input
                id="cible"
                placeholder="Qui est votre audience ? (ex: Développeurs, entrepreneurs, étudiants...)"
                value={answers.cible}
                onChange={(e) => updateAnswer('cible', e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={generatePrompt}
            disabled={!answers.sujet.trim()}
          >
            Générer avec ce prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

