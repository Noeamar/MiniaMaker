import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sparkles,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Conversation } from '@/types/thumbnail';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onOpenBilling: () => void;
  remainingGemini: number;
  remainingPro?: number;
  limitGemini?: number | null;
  limitPro?: number | null;
  isAuthenticated: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

// Sidebar content component (reusable for desktop and mobile)
function SidebarContent({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenBilling,
  remainingGemini,
  remainingPro = 0,
  limitGemini,
  limitPro,
  isCollapsed,
  setIsCollapsed,
  setConversationToDelete,
  editingId,
  setEditingId,
  editValue,
  setEditValue
}: {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onOpenBilling: () => void;
  remainingGemini: number;
  remainingPro: number;
  limitGemini?: number | null;
  limitPro?: number | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setConversationToDelete: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editValue: string;
  setEditValue: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditValue(conversation.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editValue.trim() && onRenameConversation) {
      onRenameConversation(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-2 min-w-0">
        {!isCollapsed && (
          <Button 
            onClick={onNewConversation}
            size="sm"
            className="flex-1 gap-2 min-w-0"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Nouvelle conversation</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("flex-shrink-0 hidden md:flex", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all duration-150 min-w-0",
                "hover:bg-muted/80 active:bg-muted active:scale-[0.98]",
                currentConversation?.id === conversation.id 
                  ? "bg-primary/10 border border-primary/20 shadow-sm" 
                  : "hover:shadow-sm"
              )}
              onClick={() => editingId !== conversation.id && onSelectConversation(conversation)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              {!isCollapsed && (
                <>
                  {editingId === conversation.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-sm py-0 px-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(conversation.id);
                        }}
                      >
                        <Check className="w-3 h-3 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate min-w-0 max-w-[calc(100%-4.5rem)]">
                        {conversation.title}
                      </span>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        {onRenameConversation && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={(e) => handleStartEdit(e, conversation)}
                            title="Renommer"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conversation.id);
                          }}
                          title="Supprimer la conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Credits & Billing */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border/50 space-y-3">
          <div className="space-y-2">
            {/* MiniaMaker 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  MiniaMaker 2
                </span>
                <span className={cn(
                  "font-medium",
                  remainingGemini === 0 && "text-destructive",
                  remainingGemini === -1 && "text-primary"
                )}>
                  {remainingGemini === -1 ? '∞' : limitGemini ? `${remainingGemini}/${limitGemini}` : `${remainingGemini}`}
                </span>
              </div>
              {limitGemini && limitGemini > 0 && remainingGemini !== -1 && (
                <Progress 
                  value={(remainingGemini / limitGemini) * 100} 
                  className="h-1.5"
                />
              )}
            </div>

            {/* MiniaMaker Pro */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  MiniaMaker Pro
                </span>
                <span className={cn(
                  "font-medium",
                  remainingPro === 0 && "text-destructive",
                  remainingPro === -1 && "text-primary"
                )}>
                  {remainingPro === -1 ? '∞' : limitPro ? `${remainingPro}/${limitPro}` : `${remainingPro}`}
                </span>
              </div>
              {limitPro && limitPro > 0 && remainingPro !== -1 && (
                <Progress 
                  value={(remainingPro / limitPro) * 100} 
                  className="h-1.5"
                />
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            Réinitialisation mensuelle
          </p>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={onOpenBilling}
          >
            <CreditCard className="w-4 h-4" />
            Gérer l'abonnement
          </Button>
        </div>
      )}
    </>
  );
}

export function ConversationSidebar({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenBilling,
  remainingGemini,
  remainingPro = 0,
  limitGemini,
  limitPro,
  isAuthenticated,
  mobileOpen = false,
  onMobileOpenChange
}: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isAuthenticated) return null;

  const sidebarContent = (
    <SidebarContent
      conversations={conversations}
      currentConversation={currentConversation}
      onNewConversation={onNewConversation}
      onSelectConversation={onSelectConversation}
      onDeleteConversation={onDeleteConversation}
      onRenameConversation={onRenameConversation}
      onOpenBilling={onOpenBilling}
      remainingGemini={remainingGemini}
      remainingPro={remainingPro}
      limitGemini={limitGemini}
      limitPro={limitPro}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      setConversationToDelete={setConversationToDelete}
      editingId={editingId}
      setEditingId={setEditingId}
      editValue={editValue}
      setEditValue={setEditValue}
    />
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex h-full bg-secondary/30 border-r border-border/50 flex-col transition-all duration-300 overflow-hidden",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[85vw] sm:w-[320px] p-0">
          <div className="h-full bg-secondary/30 flex flex-col">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={conversationToDelete !== null} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La conversation et tous ses messages seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conversationToDelete) {
                  onDeleteConversation(conversationToDelete);
                  setConversationToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
