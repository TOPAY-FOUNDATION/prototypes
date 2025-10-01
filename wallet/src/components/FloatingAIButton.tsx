'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAIAssistant } from '../hooks/useAIAssistant';
import AIAssistant from './AIAssistant';

interface FloatingAIButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ 
  position = 'bottom-right' 
}) => {
  const { 
    isOpen, 
    hasUnreadMessages, 
    unreadCount, 
    closeAssistant, 
    toggleAssistant
  } = useAIAssistant();

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  const buttonStyles = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
  };

  const hoverStyles = {
    backgroundColor: '#0056b3',
    transform: 'scale(1.1)',
    boxShadow: '0 6px 16px rgba(0, 123, 255, 0.4)',
  };

  const notificationBadgeStyles = {
    position: 'absolute' as const,
    top: '-5px',
    right: '-5px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '2px solid white',
  };

  const pulseAnimation = hasUnreadMessages ? {
    animation: 'pulse 2s infinite',
  } : {};

  const modalStyles = {
    position: 'fixed' as const,
    bottom: position.includes('bottom') ? '90px' : 'auto',
    top: position.includes('top') ? '90px' : 'auto',
    right: position.includes('right') ? '20px' : 'auto',
    left: position.includes('left') ? '20px' : 'auto',
    width: '400px',
    height: '600px',
    maxWidth: 'calc(100vw - 40px)',
    maxHeight: 'calc(100vh - 120px)',
    zIndex: 1001,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }
          50% {
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.6), 0 0 0 10px rgba(0, 123, 255, 0.1);
          }
          100% {
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }
        }
      `}</style>
      
      <div style={getPositionStyles()}>
        <button
          onClick={toggleAssistant}
          style={{
            ...buttonStyles,
            ...pulseAnimation,
          }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, hoverStyles);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyles);
          }}
          title="AI Assistant"
        >
          <MessageCircle size={24} />
          {hasUnreadMessages && (
            <span style={notificationBadgeStyles}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* AI Assistant Popup */}
        {isOpen && (
          <div style={modalStyles}>
            <AIAssistant 
              isOpen={isOpen}
              onClose={closeAssistant}
              isModal={true}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingAIButton;