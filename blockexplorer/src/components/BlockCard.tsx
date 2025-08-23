'use client';

import Link from 'next/link';
import { Block } from '@/lib/blockchain';
import { formatHash, formatTimeAgo, formatNumber, formatGas } from '@/lib/utils';

interface BlockCardProps {
  block: Block;
  className?: string;
}

export default function BlockCard({ block, className = '' }: BlockCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Block #{formatNumber(block.number)}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatTimeAgo(block.timestamp)}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Hash:</span>
          <Link 
            href={`/block/${block.hash}`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
          >
            {formatHash(block.hash)}
          </Link>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Parent Hash:</span>
          <Link 
            href={`/block/${block.parentHash}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-mono"
          >
            {formatHash(block.parentHash)}
          </Link>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Miner:</span>
          <Link 
            href={`/address/${block.miner}`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
          >
            {formatHash(block.miner)}
          </Link>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Transactions:</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {formatNumber(block.transactions.length)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Gas Used:</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {formatGas(block.gasUsed)} / {formatGas(block.gasLimit)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link 
          href={`/block/${block.number}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}