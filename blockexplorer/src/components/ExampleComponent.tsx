'use client';

import { useState } from 'react';
import { useTheme } from '@/app/theme-provider';

interface ExampleComponentProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function ExampleComponent({
  title,
  description,
  children
}: ExampleComponentProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card mb-6">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <span className="text-muted text-sm">
          Current theme: {theme}
        </span>
      </div>
      
      <div className="card-body">
        {description && (
          <p className="mb-4 text-secondary">{description}</p>
        )}
        
        <div className="flex flex-col gap-4">
          {/* Button examples */}
          <div>
            <h4 className="font-medium mb-2">Buttons</h4>
            <div className="flex gap-2">
              <button className="btn btn-primary">Primary</button>
              <button className="btn btn-secondary">Secondary</button>
              <button 
                className="copy-button"
                onClick={() => setIsOpen(!isOpen)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          
          {/* Text examples */}
          <div>
            <h4 className="font-medium mb-2">Text Styles</h4>
            <p className="text-primary mb-1">Primary text</p>
            <p className="text-secondary mb-1">Secondary text</p>
            <p className="text-success mb-1">Success text</p>
            <p className="text-error mb-1">Error text</p>
            <p className="text-warning mb-1">Warning text</p>
            <p className="text-info mb-1">Info text</p>
          </div>
          
          {/* Background examples */}
          <div>
            <h4 className="font-medium mb-2">Background Styles</h4>
            <div className="flex gap-2 flex-wrap">
              <div className="p-4 rounded bg-primary">Primary</div>
              <div className="p-4 rounded bg-secondary">Secondary</div>
              <div className="p-4 rounded bg-success">Success</div>
              <div className="p-4 rounded bg-error">Error</div>
              <div className="p-4 rounded bg-warning">Warning</div>
              <div className="p-4 rounded bg-info">Info</div>
              <div className="p-4 rounded bg-muted">Muted</div>
            </div>
          </div>
          
          {/* Data row examples */}
          <div>
            <h4 className="font-medium mb-2">Data Rows</h4>
            <div className="border-default rounded overflow-hidden">
              <div className="data-row">
                <span className="label">Block Number</span>
                <span className="value font-mono">12345678</span>
              </div>
              <div className="data-row">
                <span className="label">Transaction Hash</span>
                <span className="value font-mono truncate">0x1234567890abcdef1234567890abcdef1234567890abcdef</span>
              </div>
              <div className="data-row">
                <span className="label">Status</span>
                <span className="badge badge-success">Success</span>
              </div>
            </div>
          </div>
          
          {/* Address examples */}
          <div>
            <h4 className="font-medium mb-2">Address Display</h4>
            <div className="flex flex-col gap-2">
              <div className="address-container">
                <span className="address-label address-from">From</span>
                <span className="address">0xabcdef1234567890abcdef1234567890abcdef12</span>
              </div>
              <div className="address-container">
                <span className="address-label address-to">To</span>
                <span className="address">0x1234567890abcdef1234567890abcdef12345678</span>
              </div>
            </div>
          </div>
        </div>
        
        {isOpen && (
          <div className="mt-4 p-4 border-default rounded bg-muted">
            <p>This is a collapsible section that demonstrates state management.</p>
            {children}
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="flex justify-between items-center">
          <span className="text-sm text-secondary">Last updated: {new Date().toLocaleDateString()}</span>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>
    </div>
  );
}