'use client';

import React, { useState } from 'react';
import AIAssistant from '@/components/AIAssistant';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const AIAssistantPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Wallet</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Powered by TOPAY AI
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <AIAssistant 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isModal={false}
            className="h-[calc(100vh-12rem)]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>TOPAY AI Assistant - Your intelligent blockchain companion</p>
            <p className="mt-1">
              Get help with wallet operations, blockchain queries, and TOPAY ecosystem information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;