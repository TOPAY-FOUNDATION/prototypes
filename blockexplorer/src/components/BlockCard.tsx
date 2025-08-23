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
    <div className={`card p-6 block-card ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Block #{formatNumber(block.number)}
        </h3>
        <span className="text-sm timestamp">
          {formatTimeAgo(block.timestamp)}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="data-row">
          <span className="label">Hash:</span>
          <Link 
            href={`/block/${block.hash}`}
            className="hash link"
          >
            {formatHash(block.hash)}
          </Link>
        </div>
        
        <div className="data-row">
          <span className="label">Parent Hash:</span>
          <Link 
            href={`/block/${block.parentHash}`}
            className="hash link"
          >
            {formatHash(block.parentHash)}
          </Link>
        </div>
        
        <div className="data-row">
          <span className="label">Miner:</span>
          <Link 
            href={`/address/${block.miner}`}
            className="address link"
          >
            {formatHash(block.miner)}
          </Link>
        </div>
        
        <div className="data-row">
          <span className="label">Transactions:</span>
          <span className="value">{formatNumber(block.transactions.length)}</span>
        </div>
        
        <div className="data-row">
          <span className="label">Gas Used:</span>
          <span className="value">{formatGas(block.gasUsed)} ({(block.gasUsed / block.gasLimit * 100).toFixed(2)}%)</span>
        </div>
        
        <div className="progress-bar mt-2">
          <div 
            className="progress-bar-fill"
            style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="card-footer">
        <Link 
          href={`/block/${block.number}`}
          className="btn btn-primary"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}