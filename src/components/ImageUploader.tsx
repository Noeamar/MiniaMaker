import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadedImage } from "@/types/thumbnail";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 3,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidImageFile = (file: File): boolean => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.tif'];
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/x-icon', 'image/tiff'];
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    return validExtensions.includes(extension) || validMimeTypes.includes(mimeType) || mimeType.startsWith('image/');
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    // Filter valid image files
    const validFiles = Array.from(files).filter(file => {
      if (!isValidImageFile(file)) {
        toast.error(`Le fichier "${file.name}" n'est pas un format d'image valide (jpg, jpeg, png, gif, webp, etc.)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newFiles = validFiles.slice(0, remainingSlots);
    const newImages: UploadedImage[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    onImagesChange([...images, ...newImages]);
    toast.success(`${newImages.length} image(s) ajoutée(s)`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-lg">📎</span>
        <span>Images de référence (optionnel, max {maxImages})</span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/x-icon,image/tiff,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.ico,.tiff"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragging ? "Déposez les images ici" : "Cliquez ou glissez des images"}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Formats acceptés : JPG, JPEG, PNG, GIF, WebP, BMP, SVG, etc.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group aspect-video">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(image.id)}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                <p className="text-xs text-primary-foreground truncate">{image.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
