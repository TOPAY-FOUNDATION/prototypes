import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Blockchain utility functions
export function formatAddress(address: string, length: number = 8): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatHash(hash: string, length: number = 8): string {
  if (!hash) return '';
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function formatBalance(balance: string, decimals: number = 18): string {
  if (!balance) return '0';
  const balanceNum = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const wholePart = balanceNum / divisor;
  const fractionalPart = balanceNum % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  // Convert fractional part to decimal representation
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Remove trailing zeros, then remove leading zeros (but keep at least one digit)
  const trimmedFractional = fractionalStr.replace(/0+$/, '').replace(/^0+/, '') || '0';
  
  // If the fractional part becomes empty or just '0', don't show it
  if (trimmedFractional === '0') {
    return wholePart.toString();
  }
  
  // Limit to maximum 5 decimal places
  const limitedFractional = trimmedFractional.length > 5 ? trimmedFractional.substring(0, 5) : trimmedFractional;
  
  return `${wholePart}.${limitedFractional}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - (timestamp * 1000);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

export function formatGas(gas: number): string {
  return gas.toLocaleString();
}

export function formatGwei(wei: string): string {
  const weiNum = BigInt(wei);
  const gwei = weiNum / BigInt(1000000000);
  return `${gwei.toString()} nTPY`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return '0';
  }
  return num.toLocaleString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}