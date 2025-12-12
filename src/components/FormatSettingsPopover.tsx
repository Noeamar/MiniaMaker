import { FormatSettings as FormatSettingsType, ThumbnailRatio, ThumbnailResolution } from "@/types/thumbnail";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Palette, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatSettingsPopoverProps {
  settings: FormatSettingsType;
  onSettingsChange: (settings: FormatSettingsType) => void;
}

const RATIOS: { value: ThumbnailRatio; label: string; width: number; height: number }[] = [
  { value: '16:9', label: '16:9', width: 32, height: 18 },
  { value: '1:1', label: '1:1', width: 24, height: 24 },
  { value: '9:16', label: '9:16', width: 18, height: 32 },
  { value: 'custom', label: 'Custom', width: 28, height: 20 },
];

const RESOLUTIONS: { value: ThumbnailResolution; label: string }[] = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: '4K', label: '4K' },
];

const FONT_STYLES = [
  { value: 'bold', label: 'Gras et Impact' },
  { value: 'modern', label: 'Moderne Sans-Serif' },
  { value: 'playful', label: 'Ludique et Fun' },
  { value: 'elegant', label: 'Élégant et Classique' },
  { value: 'tech', label: 'Tech et Futuriste' },
];

export function FormatSettingsPopover({ settings, onSettingsChange }: FormatSettingsPopoverProps) {
  const updateSetting = <K extends keyof FormatSettingsType>(
    key: K,
    value: FormatSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const currentRatio = RATIOS.find(r => r.value === settings.ratio);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 md:gap-2 w-full md:w-auto">
          <Settings2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline text-xs md:text-sm">Format</span>
          {/* Mini ratio preview */}
          <div 
            className="border border-current rounded-sm opacity-60"
            style={{ 
              width: currentRatio ? currentRatio.width / 2 : 16,
              height: currentRatio ? currentRatio.height / 2 : 9 
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="center">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Paramètres de Format</h4>
          
          {/* Ratio Selection with visual rectangles */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Format / Ratio</Label>
            <div className="flex gap-2">
              {RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => updateSetting('ratio', ratio.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                    settings.ratio === ratio.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div 
                    className={cn(
                      "border-2 rounded-sm transition-colors",
                      settings.ratio === ratio.value
                        ? "border-primary bg-primary/20"
                        : "border-muted-foreground/30"
                    )}
                    style={{ width: ratio.width, height: ratio.height }}
                  />
                  <span className="text-xs font-medium">{ratio.label}</span>
                </button>
              ))}
            </div>
            {settings.ratio === 'custom' && (
              <Input
                placeholder="Ex: 4:3"
                value={settings.customRatio || ''}
                onChange={(e) => updateSetting('customRatio', e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Résolution</Label>
            <Select
              value={settings.resolution}
              onValueChange={(v) => updateSetting('resolution', v as ThumbnailResolution)}
            >
              <SelectTrigger className="h-9">
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

          {/* Branding */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Inclure un logo</Label>
              <Switch
                checked={settings.includeLogo}
                onCheckedChange={(v) => updateSetting('includeLogo', v)}
              />
            </div>

            {settings.includeLogo && (
              <Input
                placeholder="URL du logo..."
                value={settings.brandLogoUrl || ''}
                onChange={(e) => updateSetting('brandLogoUrl', e.target.value)}
                className="h-9"
              />
            )}
          </div>

          {/* Color & Font */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Palette className="w-3 h-3" />
                Couleur
              </Label>
              <div className="flex gap-1">
                <Input
                  type="color"
                  value={settings.brandColor}
                  onChange={(e) => updateSetting('brandColor', e.target.value)}
                  className="w-10 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={settings.brandColor}
                  onChange={(e) => updateSetting('brandColor', e.target.value)}
                  className="flex-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Type className="w-3 h-3" />
                Police
              </Label>
              <Select
                value={settings.fontStyle}
                onValueChange={(v) => updateSetting('fontStyle', v)}
              >
                <SelectTrigger className="h-9 text-xs">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}