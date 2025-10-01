import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAIAssistantOptions {
  autoOpen?: boolean;
  defaultMinimized?: boolean;
  persistState?: boolean;
}

interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  unreadCount: number;
  lastInteraction: Date | null;
}

export const useAIAssistant = (options: UseAIAssistantOptions = {}) => {
  const {
    autoOpen = false,
    defaultMinimized = false,
    persistState = true
  } = options;

  // Initialize state from localStorage if persistence is enabled
  const getInitialState = (): AIAssistantState => {
    if (persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem('topay-ai-assistant-state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            lastInteraction: parsed.lastInteraction ? new Date(parsed.lastInteraction) : null
          };
        } catch (error) {
          console.warn('Failed to parse saved AI assistant state:', error);
        }
      }
    }
    
    return {
      isOpen: autoOpen,
      isMinimized: defaultMinimized,
      unreadCount: 0,
      lastInteraction: null
    };
  };

  const [state, setState] = useState<AIAssistantState>(getInitialState);
  const stateRef = useRef(state);

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist state to localStorage
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem('topay-ai-assistant-state', JSON.stringify(state));
    }
  }, [state, persistState]);

  const openAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      unreadCount: 0,
      lastInteraction: new Date()
    }));
  }, []);

  const closeAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      lastInteraction: new Date()
    }));
  }, []);

  const toggleAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: prev.isOpen ? prev.isMinimized : false,
      unreadCount: !prev.isOpen ? 0 : prev.unreadCount,
      lastInteraction: new Date()
    }));
  }, []);

  const minimizeAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: true,
      lastInteraction: new Date()
    }));
  }, []);

  const maximizeAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: false,
      unreadCount: 0,
      lastInteraction: new Date()
    }));
  }, []);

  const incrementUnreadCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      unreadCount: prev.unreadCount + 1
    }));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      unreadCount: 0
    }));
  }, []);

  const updateLastInteraction = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastInteraction: new Date()
    }));
  }, []);

  // Auto-minimize after period of inactivity (optional)
  useEffect(() => {
    if (!state.isOpen || state.isMinimized) return;

    const timeout = setTimeout(() => {
      if (stateRef.current.isOpen && !stateRef.current.isMinimized) {
        const timeSinceLastInteraction = stateRef.current.lastInteraction 
          ? Date.now() - stateRef.current.lastInteraction.getTime()
          : 0;
        
        // Auto-minimize after 10 minutes of inactivity
        if (timeSinceLastInteraction > 10 * 60 * 1000) {
          minimizeAssistant();
        }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearTimeout(timeout);
  }, [state.isOpen, state.isMinimized, state.lastInteraction, minimizeAssistant]);

  return {
    // State
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    unreadCount: state.unreadCount,
    lastInteraction: state.lastInteraction,
    
    // Actions
    openAssistant,
    closeAssistant,
    toggleAssistant,
    minimizeAssistant,
    maximizeAssistant,
    incrementUnreadCount,
    resetUnreadCount,
    updateLastInteraction,
    
    // Computed values
    hasUnreadMessages: state.unreadCount > 0,
    isActive: state.isOpen && !state.isMinimized
  };
};