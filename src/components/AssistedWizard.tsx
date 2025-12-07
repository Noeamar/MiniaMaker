import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "./ImageUploader";
import { WizardAnswers, UploadedImage, TemplateData } from "@/types/thumbnail";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistedWizardProps {
  onComplete: (template: TemplateData) => void;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const questions = [
  {
    id: 'goal',
    question: "What's the goal of your thumbnail?",
    placeholder: "e.g., Get clicks from people interested in productivity",
    emoji: "🎯",
  },
  {
    id: 'subject',
    question: "Who or what is the main subject?",
    placeholder: "e.g., Me holding a laptop, looking excited",
    emoji: "👤",
  },
  {
    id: 'emotion',
    question: "What emotion should it convey?",
    placeholder: "e.g., Excitement, curiosity, urgency",
    emoji: "🎭",
  },
];

export function AssistedWizard({
  onComplete,
  images,
  onImagesChange,
  onGenerate,
  isGenerating,
}: AssistedWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    goal: '',
    subject: '',
    emotion: '',
  });
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[step];
  const isLastStep = step === questions.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      const template: TemplateData = {
        name: 'Assisted Template',
        videoContext: answers.goal,
        objective: answers.goal,
        mainSubject: answers.subject,
        emotion: answers.emotion,
        shortText: '',
        visualStyle: 'Modern, high contrast, YouTube-optimized',
      };
      onComplete(template);
      setIsComplete(true);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  if (isComplete) {
    return (
      <Card variant="elevated" className="opacity-0 animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Template Ready!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm"><strong>Goal:</strong> {answers.goal}</p>
            <p className="text-sm"><strong>Subject:</strong> {answers.subject}</p>
            <p className="text-sm"><strong>Emotion:</strong> {answers.emotion}</p>
          </div>

          <ImageUploader images={images} onImagesChange={onImagesChange} />

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

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setIsComplete(false);
              setStep(0);
            }}
          >
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Wizard</CardTitle>
          <div className="flex items-center gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[140px]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{currentQuestion.emoji}</span>
            <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
          </div>
          <Input
            value={answers[currentQuestion.id as keyof WizardAnswers]}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="text-base h-12"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant={isLastStep ? "gradient" : "default"}
            onClick={handleNext}
            disabled={!answers[currentQuestion.id as keyof WizardAnswers].trim()}
            className="flex-1"
          >
            {isLastStep ? (
              <>
                Complete
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
