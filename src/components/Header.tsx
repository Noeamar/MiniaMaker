import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, User, LogOut, FolderOpen } from "lucide-react";

interface HeaderProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  onLogout?: () => void;
}

export function Header({ isAuthenticated, userEmail, onLogout }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Minia<span className="text-gradient">Maker</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {userEmail}
              </span>
              <Button variant="ghost" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Mes Templates
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}