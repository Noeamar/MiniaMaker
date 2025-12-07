import { Button } from "@/components/ui/button";
import { Play, User, LogOut, FolderOpen } from "lucide-react";

interface HeaderProps {
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
  onLogout?: () => void;
}

export function Header({ isAuthenticated, onAuthClick, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Minia<span className="text-gradient">Maker</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Mes Templates
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onAuthClick}>
              <User className="w-4 h-4 mr-2" />
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
