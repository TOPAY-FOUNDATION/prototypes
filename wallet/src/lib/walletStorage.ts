interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  createdAt: string;
}

const WALLET_STORAGE_KEY = 'topay_wallet';

export class WalletStorage {
  static saveWallet(walletData: WalletData): void {
    try {
      const encryptedData = btoa(JSON.stringify(walletData));
      localStorage.setItem(WALLET_STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to save wallet:', error);
      throw new Error('Failed to save wallet to browser storage');
    }
  }

  static getWallet(): WalletData | null {
    try {
      const encryptedData = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!encryptedData) return null;
      
      const walletData = JSON.parse(atob(encryptedData));
      return walletData;
    } catch (error) {
      console.error('Failed to retrieve wallet:', error);
      return null;
    }
  }

  static hasWallet(): boolean {
    return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
  }

  static removeWallet(): void {
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }

  static exportWallet(): string | null {
    const wallet = this.getWallet();
    if (!wallet) return null;
    
    return JSON.stringify(wallet, null, 2);
  }

  static importWallet(walletJson: string): boolean {
    try {
      const walletData = JSON.parse(walletJson);
      
      // Validate wallet data structure
      if (!walletData.address || !walletData.privateKey || !walletData.publicKey) {
        throw new Error('Invalid wallet data structure');
      }
      
      this.saveWallet(walletData);
      return true;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      return false;
    }
  }
}