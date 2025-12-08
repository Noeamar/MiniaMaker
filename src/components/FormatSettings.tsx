import { FormatSettings as FormatSettingsType, ThumbnailRatio, ThumbnailResolution } from "@/types/thumbnail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Palette, Type, Image } from "lucide-react";

interface FormatSettingsProps {
  settings: FormatSettingsType;
  onSettingsChange: (settings: FormatSettingsType) => void;
}

const RATIOS: { value: ThumbnailRatio; label: string }[] = [
  { value: '16:9', label: '16:9 (YouTube)' },
  { value: '1:1', label: '1:1 (Carré)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: 'custom', label: 'Personnalisé' },
];

const RESOLUTIONS: { value: ThumbnailResolution; label: string }[] = [
  { value: '720p', label: '720p (1280×720)' },
  { value: '1080p', label: '1080p (1920×1080)' },
  { value: '4K', label: '4K (3840×2160)' },
];

const FONT_STYLES = [
  { value: 'bold', label: 'Gras et Impact' },
  { value: 'modern', label: 'Moderne Sans-Serif' },
  { value: 'playful', label: 'Ludique et Fun' },
  { value: 'elegant', label: 'Élégant et Classique' },
  { value: 'tech', label: 'Tech et Futuriste' },
];

export function FormatSettings({ settings, onSettingsChange }: FormatSettingsProps) {
  const updateSetting = <K extends keyof FormatSettingsType>(
    key: K,
    value: FormatSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="w-5 h-5 text-primary" />
          Paramètres de Format
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ratio & Resolution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Image className="w-4 h-4" />
              Format / Ratio
            </Label>
            <Select
              value={settings.ratio}
              onValueChange={(v) => updateSetting('ratio', v as ThumbnailRatio)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATIOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.ratio === 'custom' && (
              <Input
                placeholder="Ex: 4:3"
                value={settings.customRatio || ''}
                onChange={(e) => updateSetting('customRatio', e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Résolution</Label>
            <Select
              value={settings.resolution}
              onValueChange={(v) => updateSetting('resolution', v as ThumbnailResolution)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              Inclure un logo de marque
            </Label>
            <Switch
              checked={settings.includeLogo}
              onCheckedChange={(v) => updateSetting('includeLogo', v)}
            />
          </div>

          {settings.includeLogo && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label className="text-sm text-muted-foreground">
                URL du logo (optionnel)
              </Label>
              <Input
                placeholder="https://..."
                value={settings.brandLogoUrl || ''}
                onChange={(e) => updateSetting('brandLogoUrl', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Color & Font */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4" />
              Couleur de marque
            </Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.brandColor}
                onChange={(e) => updateSetting('brandColor', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={settings.brandColor}
                onChange={(e) => updateSetting('brandColor', e.target.value)}
                placeholder="#FF0000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Type className="w-4 h-4" />
              Style de police
            </Label>
            <Select
              value={settings.fontStyle}
              onValueChange={(v) => updateSetting('fontStyle', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_STYLES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
