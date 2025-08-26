/**
 * TOPAY Foundation Blockchain - Transaction Reversal System
 * 
 * Implements secure transaction reversal mechanisms with multi-signature approval
 * and time-based constraints for enhanced security.
 */

import { computeHash } from '@topayfoundation/topayz512';
import { Transaction } from './transaction.js';

export class TransactionReversalSystem {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.reversalRequests = new Map(); // Store reversal requests
    this.reversalHistory = []; // Track all reversals
    this.authorizedReversers = new Set(); // Authorized addresses for reversals
    this.reversalTimeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.requiredApprovals = 3; // Minimum approvals needed
  }

  /**
   * Add authorized reverser address
   */
  addAuthorizedReverser(address) {
    this.authorizedReversers.add(address);
    console.log(`✅ Added authorized reverser: ${address.substring(0, 10)}...`);
  }

  /**
   * Remove authorized reverser address
   */
  removeAuthorizedReverser(address) {
    this.authorizedReversers.delete(address);
    console.log(`❌ Removed authorized reverser: ${address.substring(0, 10)}...`);
  }

  /**
   * Request transaction reversal
   */
  async requestReversal(transactionId, requesterAddress, reason, evidence = null) {
    console.log(`🔄 Processing reversal request for transaction: ${transactionId}`);

    // Find the transaction
    const transaction = this.findTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Check if reversal is within time limit
    const timeSinceTransaction = Date.now() - transaction.blockTimestamp;
    if (timeSinceTransaction > this.reversalTimeLimit) {
      throw new Error('Reversal request exceeds time limit (24 hours)');
    }

    // Check if requester is involved in the transaction
    if (transaction.from !== requesterAddress && transaction.to !== requesterAddress) {
      throw new Error('Only transaction participants can request reversal');
    }

    // Check if reversal already exists
    if (this.reversalRequests.has(transactionId)) {
      throw new Error('Reversal request already exists for this transaction');
    }

    // Create reversal request
    const reversalRequest = {
      id: await this.generateReversalId(transactionId, requesterAddress),
      transactionId,
      requesterAddress,
      reason,
      evidence,
      timestamp: Date.now(),
      approvals: new Set(),
      rejections: new Set(),
      status: 'pending',
      transaction: transaction
    };

    this.reversalRequests.set(transactionId, reversalRequest);
    console.log(`📝 Reversal request created: ${reversalRequest.id}`);
    
    return reversalRequest;
  }

  /**
   * Approve reversal request
   */
  async approveReversal(transactionId, approverAddress) {
    if (!this.authorizedReversers.has(approverAddress)) {
      throw new Error('Unauthorized approver');
    }

    const request = this.reversalRequests.get(transactionId);
    if (!request) {
      throw new Error('Reversal request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Reversal request is not pending');
    }

    // Add approval
    request.approvals.add(approverAddress);
    console.log(`✅ Approval added by: ${approverAddress.substring(0, 10)}...`);

    // Check if enough approvals
    if (request.approvals.size >= this.requiredApprovals) {
      await this.executeReversal(request);
    }

    return request;
  }

  /**
   * Reject reversal request
   */
  async rejectReversal(transactionId, rejecterAddress, rejectionReason) {
    if (!this.authorizedReversers.has(rejecterAddress)) {
      throw new Error('Unauthorized rejecter');
    }

    const request = this.reversalRequests.get(transactionId);
    if (!request) {
      throw new Error('Reversal request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Reversal request is not pending');
    }

    request.rejections.add({
      address: rejecterAddress,
      reason: rejectionReason,
      timestamp: Date.now()
    });

    request.status = 'rejected';
    console.log(`❌ Reversal request rejected by: ${rejecterAddress.substring(0, 10)}...`);
    
    return request;
  }

  /**
   * Execute approved reversal
   */
  async executeReversal(request) {
    console.log(`🔄 Executing reversal for transaction: ${request.transactionId}`);

    const originalTx = request.transaction;
    
    // Create reversal transaction
    const reversalTx = new Transaction(
      originalTx.to,    // Reverse the direction
      originalTx.from,
      originalTx.amount,
      {
        type: 'REVERSAL',
        originalTransactionId: request.transactionId,
        reversalRequestId: request.id,
        reason: request.reason,
        approvers: Array.from(request.approvals)
      }
    );

    // Sign with system authority
    await reversalTx.signTransaction('system_reversal');

    // Add to blockchain
    await this.blockchain.addTransaction(reversalTx);

    // Update request status
    request.status = 'executed';
    request.executionTimestamp = Date.now();
    request.reversalTransactionId = reversalTx.id;

    // Add to history
    this.reversalHistory.push({
      ...request,
      executedAt: Date.now()
    });

    console.log(`✅ Reversal executed successfully: ${reversalTx.id}`);
    return reversalTx;
  }

  /**
   * Find transaction by ID across all blocks
   */
  findTransaction(transactionId) {
    for (const block of this.blockchain.chain) {
      for (const transaction of block.transactions) {
        if (transaction.id === transactionId) {
          return {
            ...transaction.toJSON(),
            blockIndex: block.index,
            blockTimestamp: block.timestamp,
            blockHash: block.hash
          };
        }
      }
    }
    return null;
  }

  /**
   * Generate unique reversal ID
   */
  async generateReversalId(transactionId, requesterAddress) {
    const data = `${transactionId}-${requesterAddress}-${Date.now()}`;
    const encoder = new TextEncoder();
    const hash = await computeHash(encoder.encode(data));
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  /**
   * Get all pending reversal requests
   */
  getPendingReversals() {
    return Array.from(this.reversalRequests.values())
      .filter(request => request.status === 'pending');
  }

  /**
   * Get reversal history
   */
  getReversalHistory() {
    return this.reversalHistory;
  }

  /**
   * Get reversal request by transaction ID
   */
  getReversalRequest(transactionId) {
    return this.reversalRequests.get(transactionId);
  }

  /**
   * Check if transaction can be reversed
   */
  canReverse(transactionId) {
    const transaction = this.findTransaction(transactionId);
    if (!transaction) return false;

    const timeSinceTransaction = Date.now() - transaction.blockTimestamp;
    return timeSinceTransaction <= this.reversalTimeLimit;
  }

  /**
   * Get reversal statistics
   */
  getReversalStats() {
    const pending = this.getPendingReversals().length;
    const executed = this.reversalHistory.filter(r => r.status === 'executed').length;
    const rejected = Array.from(this.reversalRequests.values())
      .filter(r => r.status === 'rejected').length;

    return {
      pending,
      executed,
      rejected,
      total: pending + executed + rejected,
      authorizedReversers: this.authorizedReversers.size
    };
  }
}