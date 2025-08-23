'use client';

import { useState } from 'react';
import ExampleComponent from '@/components/ExampleComponent';
import { useTheme } from '@/app/theme-provider';

export default function StylesDemo() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('components');
  
  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Styles System Demo</h1>
        <p className="text-secondary mb-4">
          A demonstration of the CSS styling system for the TOPAY Block Explorer
        </p>
        
        <div className="flex justify-center gap-4 mb-4">
          <button 
            className="btn btn-primary"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            Toggle Theme ({theme})
          </button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button 
          className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          Layout
        </button>
        <button 
          className={`tab ${activeTab === 'utilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilities')}
        >
          Utilities
        </button>
      </div>
      
      {activeTab === 'components' && (
        <div>
          <ExampleComponent 
            title="Card Component"
            description="A versatile card component with header, body, and footer sections."
          >
            <p>This is nested content inside the card component.</p>
          </ExampleComponent>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Block Information</h3>
            </div>
            <div className="card-body">
              <div className="data-row">
                <span className="label">Block Number</span>
                <span className="value font-mono">12345678</span>
              </div>
              <div className="data-row">
                <span className="label">Hash</span>
                <span className="hash">0x1234567890abcdef1234567890abcdef1234567890abcdef</span>
              </div>
              <div className="data-row">
                <span className="label">Timestamp</span>
                <span className="value">2023-06-15 14:30:45</span>
              </div>
              <div className="data-row">
                <span className="label">Status</span>
                <span className="badge badge-success">Confirmed</span>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Transaction Information</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="address-container mb-2">
                  <span className="address-label address-from">From</span>
                  <span className="address">0xabcdef1234567890abcdef1234567890abcdef12</span>
                  <button className="copy-button ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex justify-center my-2">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                
                <div className="address-container">
                  <span className="address-label address-to">To</span>
                  <span className="address">0x1234567890abcdef1234567890abcdef12345678</span>
                  <button className="copy-button ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="data-row">
                <span className="label">Value</span>
                <span className="value text-success">1.25 ETH</span>
              </div>
              
              <div className="data-row">
                <span className="label">Gas Price</span>
                <span className="value">25 Gwei</span>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Loading States</h3>
            </div>
            <div className="card-body">
              <div className="loading-spinner mb-4">
                <div className="spinner"></div>
              </div>
              
              <div className="error-message">
                An error occurred while fetching data
              </div>
              
              <div className="empty-state mt-4">
                <div className="empty-state-icon">📭</div>
                <h4 className="empty-state-title">No Results Found</h4>
                <p className="empty-state-description">We couldn&apos;t find any transactions matching your search criteria.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'layout' && (
        <div>
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Grid Layout</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-muted p-4 rounded text-center">
                    Grid Item {i}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded text-center md:col-span-2">
                  Span 2 Columns
                </div>
                <div className="bg-muted p-4 rounded text-center">
                  1 Column
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Flex Layout</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Justify Content</h4>
                <div className="flex justify-between mb-2 bg-muted p-2 rounded">
                  <div className="bg-primary p-2 rounded">Item 1</div>
                  <div className="bg-primary p-2 rounded">Item 2</div>
                  <div className="bg-primary p-2 rounded">Item 3</div>
                </div>
                
                <div className="flex justify-center mb-2 bg-muted p-2 rounded">
                  <div className="bg-primary p-2 rounded mr-2">Center 1</div>
                  <div className="bg-primary p-2 rounded">Center 2</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Align Items</h4>
                <div className="flex items-center bg-muted p-2 rounded" style={{ height: '100px' }}>
                  <div className="bg-primary p-2 rounded h-8">Short</div>
                  <div className="bg-primary p-2 rounded h-16 ml-2">Medium</div>
                  <div className="bg-primary p-2 rounded h-24 ml-2">Tall</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Spacing</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Margin Examples</h4>
                <div className="bg-muted p-2 rounded">
                  <div className="bg-primary p-2 rounded mb-2">Margin Bottom 2</div>
                  <div className="bg-primary p-2 rounded mb-4">Margin Bottom 4</div>
                  <div className="bg-primary p-2 rounded mb-6">Margin Bottom 6</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Padding Examples</h4>
                <div className="flex gap-4">
                  <div className="bg-muted p-2 rounded">p-2</div>
                  <div className="bg-muted p-4 rounded">p-4</div>
                  <div className="bg-muted p-6 rounded">p-6</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'utilities' && (
        <div>
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Text Utilities</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Text Colors</h4>
                <p className="text-primary mb-1">Primary Text</p>
                <p className="text-secondary mb-1">Secondary Text</p>
                <p className="text-success mb-1">Success Text</p>
                <p className="text-error mb-1">Error Text</p>
                <p className="text-warning mb-1">Warning Text</p>
                <p className="text-info mb-1">Info Text</p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Font Weights</h4>
                <p className="font-light mb-1">Light Text</p>
                <p className="font-normal mb-1">Normal Text</p>
                <p className="font-medium mb-1">Medium Text</p>
                <p className="font-semibold mb-1">Semibold Text</p>
                <p className="font-bold mb-1">Bold Text</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Text Overflow</h4>
                <p className="truncate mb-2 border-default p-2 rounded">
                  This is a very long text that will be truncated with an ellipsis when it reaches the end of its container using the truncate utility class.
                </p>
                <p className="line-clamp-2 border-default p-2 rounded">
                  This text will be limited to 2 lines maximum. Any additional content beyond that will be truncated with an ellipsis. This is useful for descriptions or other text that should be kept to a specific number of lines for consistent layout purposes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Background Utilities</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded bg-primary text-center">Primary</div>
                <div className="p-4 rounded bg-secondary text-center">Secondary</div>
                <div className="p-4 rounded bg-success text-center">Success</div>
                <div className="p-4 rounded bg-error text-center">Error</div>
                <div className="p-4 rounded bg-warning text-center">Warning</div>
                <div className="p-4 rounded bg-info text-center">Info</div>
                <div className="p-4 rounded bg-muted text-center">Muted</div>
              </div>
            </div>
          </div>
          
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Badges & Indicators</h3>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Badges</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge badge-primary">Primary</span>
                  <span className="badge badge-success">Success</span>
                  <span className="badge badge-warning">Warning</span>
                  <span className="badge badge-error">Error</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Live Indicator</h4>
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <span>Live Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}