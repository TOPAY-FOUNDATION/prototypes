/**
 * ManualConnection.js
 * UI component for manually connecting to a blockchain node
 */

class ManualConnection {
    constructor(container, validatorService) {
        this.container = container;
        this.validatorService = validatorService;
        this.render();
    }

    async handleConnect(event) {
        event.preventDefault();
        
        const urlInput = document.getElementById('blockchain-url-input');
        const statusEl = document.getElementById('connection-status');
        const resultEl = document.getElementById('connection-result');
        
        if (!urlInput || !urlInput.value) {
            if (statusEl) statusEl.textContent = 'Please enter a blockchain URL';
            return;
        }
        
        const blockchainUrl = urlInput.value.trim();
        
        try {
            if (statusEl) {
                statusEl.textContent = `Connecting to ${blockchainUrl}...`;
                statusEl.className = 'status connecting';
            }
            
            // Make API call to connect endpoint
            const response = await fetch('/api/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ blockchainUrl })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                if (statusEl) {
                    statusEl.textContent = `Connected successfully to ${blockchainUrl}`;
                    statusEl.className = 'status success';
                }
                
                if (resultEl) {
                    resultEl.innerHTML = `<div class="success-message">
                        <h4>✅ Connection Successful</h4>
                        <p>The validator has been connected to ${blockchainUrl}</p>
                        <p>Validator client has been reinitialized.</p>
                    </div>`;
                }
                
                // Refresh status after 2 seconds
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('refresh-status'));
                }, 2000);
                
            } else {
                if (statusEl) {
                    statusEl.textContent = `Connection failed: ${result.message || 'Unknown error'}`;
                    statusEl.className = 'status error';
                }
                
                if (resultEl) {
                    resultEl.innerHTML = `<div class="error-message">
                        <h4>❌ Connection Failed</h4>
                        <p>${result.message || 'Unknown error'}</p>
                        <p>Please check the URL and try again.</p>
                    </div>`;
                }
            }
        } catch (error) {
            console.error('Connection error:', error);
            
            if (statusEl) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'status error';
            }
            
            if (resultEl) {
                resultEl.innerHTML = `<div class="error-message">
                    <h4>❌ Connection Error</h4>
                    <p>${error.message}</p>
                    <p>Please check your network connection and try again.</p>
                </div>`;
            }
        }
    }

    render() {
        // Get current blockchain URL from validator service status
        let currentUrl = '';
        try {
            const status = this.validatorService.getStatus();
            currentUrl = status.connection?.blockchainUrl || '';
        } catch (error) {
            console.error('Error getting current blockchain URL:', error);
        }
        
        const html = `
            <div class="manual-connection-panel">
                <h3>Manual Blockchain Connection</h3>
                <div class="connection-form">
                    <form id="blockchain-connect-form">
                        <div class="form-group">
                            <label for="blockchain-url-input">Blockchain URL:</label>
                            <input 
                                type="text" 
                                id="blockchain-url-input" 
                                placeholder="http://localhost:8545" 
                                value="${currentUrl}" 
                                class="form-control"
                            />
                            <small class="form-text">Enter the URL of the blockchain node to connect to</small>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Connect</button>
                        </div>
                    </form>
                </div>
                <div id="connection-status" class="status"></div>
                <div id="connection-result" class="result-container"></div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Add event listener to form
        const form = document.getElementById('blockchain-connect-form');
        if (form) {
            form.addEventListener('submit', this.handleConnect.bind(this));
        }
    }
}

export default ManualConnection;