import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, User, LogOut, CreditCard, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  onLogout?: () => void;
  onOpenBilling?: () => void;
  onOpenSidebar?: () => void;
}

export function Header({ isAuthenticated, userEmail, onLogout, onOpenBilling, onOpenSidebar }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-2 md:px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {isAuthenticated && onOpenSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onOpenSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight">
              Minia<span className="text-gradient">Maker</span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:block">
                {userEmail}
              </span>
              {onOpenBilling && (
                <Button variant="ghost" size="sm" onClick={onOpenBilling} className="hidden sm:flex">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Abonnement</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Connexion</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
