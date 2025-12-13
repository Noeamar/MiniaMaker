import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, ConversationMessage } from '@/types/thumbnail';
import { toast } from 'sonner';

// Generate a short title (2-3 words) from message content
function generateShortTitle(content: string): string {
  // Remove extra whitespace and split into words
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Remove common stop words (French)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'pour', 'avec', 'sans',
    'sur', 'dans', 'par', 'à', 'en', 'ce', 'cette', 'ces', 'qui', 'que', 'quoi', 'où', 'quand',
    'comment', 'pourquoi', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
    'est', 'sont', 'était', 'étaient', 'être', 'avoir', 'a', 'as', 'ont',
    'créer', 'faire', 'générer', 'miniature', 'youtube', 'une', 'des', 'les'
  ]);
  
  // Filter out stop words and get meaningful words
  const meaningfulWords = words
    .map(word => word.toLowerCase().replace(/[.,!?;:()\[\]{}'"]/g, ''))
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 3); // Take first 3 meaningful words
  
  // If we have meaningful words, join them (max 3 words)
  if (meaningfulWords.length > 0) {
    return meaningfulWords.slice(0, 3).join(' ').substring(0, 30); // Max 30 chars total
  }
  
  // Fallback: take first 2-3 words regardless
  const fallback = words.slice(0, 3).join(' ');
  return fallback.length > 30 ? fallback.substring(0, 27) + '...' : fallback;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [userId]);

  const fetchConversations = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  const createConversation = async (title: string = 'Nouvelle conversation') => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      return null;
    }

    setConversations(prev => [data, ...prev]);
    setCurrentConversation(data);
    setMessages([]);
    return data;
  };

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } else {
      // Cast the data to our type
      const typedMessages: ConversationMessage[] = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        settings: msg.settings as Record<string, unknown>
      }));
      setMessages(typedMessages);
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id);

    if (error) {
      console.error('Error updating conversation:', error);
    } else {
      setConversations(prev => 
        prev.map(c => c.id === id ? { ...c, title } : c)
      );
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null);
      }
    }
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    } else {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      toast.success('Conversation supprimée');
    }
  };

  const addMessage = async (
    role: 'user' | 'assistant',
    content: string,
    imageUrls: string[] = [],
    modelUsed: string | null = null,
    settings: Record<string, unknown> = {}
  ) => {
    if (!currentConversation) return null;

    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([{
        conversation_id: currentConversation.id,
        role,
        content,
        image_urls: imageUrls,
        model_used: modelUsed,
        settings
      }] as any)
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    const typedMessage: ConversationMessage = {
      ...data,
      role: data.role as 'user' | 'assistant',
      settings: data.settings as Record<string, unknown>
    };

    setMessages(prev => [...prev, typedMessage]);
    
    // Update conversation title from first user message (2-3 words max)
    if (role === 'user' && messages.length === 0) {
      const shortTitle = generateShortTitle(content);
      await updateConversationTitle(currentConversation.id, shortTitle);
    }

    return typedMessage;
  };

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    createConversation,
    selectConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
    setCurrentConversation,
    setMessages
  };
}
