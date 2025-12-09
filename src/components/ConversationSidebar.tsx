import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Conversation } from '@/types/thumbnail';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onOpenBilling: () => void;
  remainingNano: number;
  remainingGemini: number;
  isAuthenticated: boolean;
}

export function ConversationSidebar({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenBilling,
  remainingNano,
  remainingGemini,
  isAuthenticated
}: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div 
      className={cn(
        "h-full bg-secondary/30 border-r border-border/50 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        {!isCollapsed && (
          <Button 
            onClick={onNewConversation}
            size="sm"
            className="flex-1 gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
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
                "group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors",
                currentConversation?.id === conversation.id && "bg-secondary"
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-sm truncate">
                    {conversation.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Credits & Billing */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border/50 space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Nano Banana
              </span>
              <span className={cn(
                "font-medium",
                remainingNano === 0 && "text-destructive",
                remainingNano === -1 && "text-primary"
              )}>
                {remainingNano === -1 ? '∞' : `${remainingNano} restantes`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini 3 Pro
              </span>
              <span className={cn(
                "font-medium",
                remainingGemini === 0 && "text-destructive",
                remainingGemini === -1 && "text-primary"
              )}>
                {remainingGemini === -1 ? '∞' : `${remainingGemini} restantes`}
              </span>
            </div>
          </div>
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
    </div>
  );
}
