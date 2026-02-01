import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Settings, Download } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Bienvenue sur MiniaMaker ! 🎉',
    description: 'Créez des miniatures YouTube professionnelles en quelques secondes grâce à l\'IA. Laissez-nous vous montrer comment ça marche.',
  },
  {
    icon: MessageSquare,
    title: 'Décrivez votre miniature',
    description: 'Tapez simplement ce que vous voulez voir dans votre miniature. Par exemple : "Une miniature gaming avec un personnage surpris et le texte INCROYABLE"',
  },
  {
    icon: Settings,
    title: 'Personnalisez le format',
    description: 'Choisissez le ratio (16:9 pour YouTube), la résolution, et ajoutez votre logo. Vous pouvez aussi télécharger des images de référence.',
  },
  {
    icon: Download,
    title: 'Téléchargez et utilisez !',
    description: 'Prévisualisez vos miniatures, téléchargez celles que vous aimez, et utilisez-les directement sur YouTube. C\'est aussi simple que ça !',
  },
];

const ONBOARDING_KEY = 'miniamaker_onboarding_completed';

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to let the page render first
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-primary/20">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-bold">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>

            <Button onClick={handleNext} className="gap-1">
              {currentStep === steps.length - 1 ? (
                'Commencer'
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer le tutoriel
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to reset onboarding (for testing)
export function useResetOnboarding() {
  return () => localStorage.removeItem(ONBOARDING_KEY);
}
