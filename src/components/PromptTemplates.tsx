import { Button } from '@/components/ui/button';
import { Gamepad2, Video, TrendingUp, Utensils, Dumbbell, BookOpen, Music, Palette } from 'lucide-react';

interface PromptTemplatesProps {
  onSelect: (prompt: string) => void;
}

const templates = [
  {
    icon: Gamepad2,
    label: 'Gaming',
    prompt: 'Crée une miniature gaming dynamique avec des couleurs vives, un personnage expressif au centre, et un texte accrocheur en gros caractères. Style moderne et énergique.',
    color: 'text-purple-500'
  },
  {
    icon: Video,
    label: 'Vlog',
    prompt: 'Crée une miniature de vlog lifestyle avec un fond coloré et attrayant, une expression faciale engageante, et un titre court et percutant. Ambiance chaleureuse et authentique.',
    color: 'text-pink-500'
  },
  {
    icon: TrendingUp,
    label: 'Business',
    prompt: 'Crée une miniature professionnelle style business/entrepreneuriat avec un design épuré, des graphiques de croissance, et un texte impactant. Couleurs : bleu, blanc, touches de vert.',
    color: 'text-blue-500'
  },
  {
    icon: Utensils,
    label: 'Cuisine',
    prompt: 'Crée une miniature de vidéo cuisine avec un plat appétissant bien présenté, des couleurs chaudes, et un titre gourmand. Style lumineux et professionnel.',
    color: 'text-orange-500'
  },
  {
    icon: Dumbbell,
    label: 'Fitness',
    prompt: 'Crée une miniature fitness/sport dynamique avec une pose athlétique, des couleurs énergiques (rouge, noir, blanc), et un message motivant en gros caractères.',
    color: 'text-red-500'
  },
  {
    icon: BookOpen,
    label: 'Tuto',
    prompt: 'Crée une miniature de tutoriel claire et informative avec des éléments visuels explicatifs, des flèches ou numéros, et un titre qui explique ce qu\'on va apprendre.',
    color: 'text-green-500'
  },
  {
    icon: Music,
    label: 'Musique',
    prompt: 'Crée une miniature musicale artistique avec des ondes sonores visuelles, un style moderne et créatif, des couleurs vives et contrastées.',
    color: 'text-indigo-500'
  },
  {
    icon: Palette,
    label: 'Style MrBeast',
    prompt: 'Crée une miniature style MrBeast : expression faciale TRÈS exagérée (bouche grande ouverte, yeux écarquillés), fond coloré explosif, texte ÉNORME avec contour, éléments visuels spectaculaires.',
    color: 'text-yellow-500'
  }
];

export function PromptTemplates({ onSelect }: PromptTemplatesProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Ou commencez avec un template :
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {templates.map((template) => (
          <Button
            key={template.label}
            variant="outline"
            size="sm"
            className="gap-1.5 hover:bg-secondary/80 transition-colors"
            onClick={() => onSelect(template.prompt)}
          >
            <template.icon className={`w-3.5 h-3.5 ${template.color}`} />
            {template.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
