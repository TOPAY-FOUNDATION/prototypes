/**
 * TOPAY Foundation Blockchain - Report System
 * 
 * Implements a comprehensive reporting system for suspicious activities,
 * fraud detection, compliance monitoring, and community safety.
 */

import { computeHash } from '@topayfoundation/topayz512';
import { Transaction } from './transaction.js';

export class ReportSystem {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.reports = new Map(); // Store all reports
    this.reportHistory = []; // Track report history
    this.moderators = new Set(); // Authorized moderators
    this.blacklistedAddresses = new Set(); // Flagged addresses
    this.suspiciousTransactions = new Set(); // Flagged transactions
    this.reportCategories = [
      'suspicious_activity',
      'scam',
      'fraud',
      'phishing',
      'money_laundering',
      'illegal_activity',
      'spam',
      'other'
    ];
    this.reportReward = 10; // TOPAY reward for valid reports
    this.falseReportPenalty = 25; // Penalty for false reports
  }

  /**
   * Add authorized moderator
   */
  addModerator(moderatorAddress) {
    this.moderators.add(moderatorAddress);
    console.log(`👮 Moderator added: ${moderatorAddress.substring(0, 10)}...`);
  }

  /**
   * Remove moderator
   */
  removeModerator(moderatorAddress) {
    this.moderators.delete(moderatorAddress);
    console.log(`👮 Moderator removed: ${moderatorAddress.substring(0, 10)}...`);
  }

  /**
   * Submit a report
   */
  async submitReport(reporterAddress, targetType, targetId, category, description, evidence = null) {
    console.log(`🚨 Processing report from: ${reporterAddress.substring(0, 10)}...`);

    // Validate category
    if (!this.reportCategories.includes(category)) {
      throw new Error('Invalid report category');
    }

    // Validate target type
    if (!['transaction', 'address', 'block'].includes(targetType)) {
      throw new Error('Invalid target type. Must be: transaction, address, or block');
    }

    // Verify target exists
    if (!await this.verifyTarget(targetType, targetId)) {
      throw new Error('Target not found in blockchain');
    }

    // Check for duplicate reports
    const existingReport = this.findExistingReport(targetType, targetId, reporterAddress);
    if (existingReport) {
      throw new Error('You have already reported this target');
    }

    // Generate report ID
    const reportId = await this.generateReportId(reporterAddress, targetType, targetId);

    // Create report
    const report = {
      id: reportId,
      reporterAddress,
      targetType,
      targetId,
      category,
      description,
      evidence,
      timestamp: Date.now(),
      status: 'pending',
      priority: this.calculatePriority(category),
      moderatorActions: [],
      votes: {
        valid: new Set(),
        invalid: new Set()
      },
      resolution: null,
      rewardPaid: false
    };

    // Store report
    this.reports.set(reportId, report);

    // Create report transaction for transparency
    const reportTransaction = new Transaction(
      reporterAddress,
      'REPORT_SYSTEM',
      0, // No transfer, just record
      {
        type: 'REPORT_SUBMISSION',
        reportId,
        targetType,
        targetId,
        category,
        priority: report.priority
      }
    );

    await reportTransaction.signTransaction('report_submission');
    await this.blockchain.addTransaction(reportTransaction);

    console.log(`📝 Report submitted: ${reportId}`);
    return report;
  }

  /**
   * Moderate a report (moderator action)
   */
  async moderateReport(reportId, moderatorAddress, action, notes = '') {
    if (!this.moderators.has(moderatorAddress)) {
      throw new Error('Unauthorized moderator');
    }

    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'pending') {
      throw new Error('Report is not pending moderation');
    }

    // Valid actions
    const validActions = ['approve', 'reject', 'investigate', 'escalate'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid moderation action');
    }

    // Record moderator action
    const moderatorAction = {
      moderatorAddress,
      action,
      notes,
      timestamp: Date.now()
    };

    report.moderatorActions.push(moderatorAction);

    // Process action
    switch (action) {
      case 'approve':
        await this.approveReport(report, moderatorAddress);
        break;
      case 'reject':
        await this.rejectReport(report, moderatorAddress, notes);
        break;
      case 'investigate':
        report.status = 'investigating';
        report.investigator = moderatorAddress;
        break;
      case 'escalate':
        report.status = 'escalated';
        report.priority = Math.min(report.priority + 1, 5);
        break;
    }

    console.log(`⚖️ Report ${reportId} ${action}ed by moderator`);
    return report;
  }

  /**
   * Approve report and take action
   */
  async approveReport(report, moderatorAddress) {
    report.status = 'approved';
    report.approvedBy = moderatorAddress;
    report.approvedAt = Date.now();

    // Take action based on target type
    switch (report.targetType) {
      case 'address':
        this.blacklistedAddresses.add(report.targetId);
        console.log(`🚫 Address blacklisted: ${report.targetId.substring(0, 10)}...`);
        break;
      case 'transaction':
        this.suspiciousTransactions.add(report.targetId);
        console.log(`⚠️ Transaction flagged: ${report.targetId}`);
        break;
    }

    // Pay reward to reporter
    await this.payReportReward(report);

    // Add to history
    this.reportHistory.push({
      ...report,
      resolvedAt: Date.now()
    });
  }

  /**
   * Reject report
   */
  async rejectReport(report, moderatorAddress, reason) {
    report.status = 'rejected';
    report.rejectedBy = moderatorAddress;
    report.rejectedAt = Date.now();
    report.rejectionReason = reason;

    // Apply penalty for false reports (if applicable)
    const reporterBalance = this.blockchain.getBalance(report.reporterAddress);
    if (reporterBalance >= this.falseReportPenalty) {
      const penaltyTransaction = new Transaction(
        report.reporterAddress,
        'SYSTEM',
        this.falseReportPenalty,
        {
          type: 'FALSE_REPORT_PENALTY',
          reportId: report.id,
          reason: 'False report penalty'
        }
      );

      await penaltyTransaction.signTransaction('false_report_penalty');
      await this.blockchain.addTransaction(penaltyTransaction);
      console.log(`💰 False report penalty applied: ${this.falseReportPenalty} TOPAY`);
    }

    // Add to history
    this.reportHistory.push({
      ...report,
      resolvedAt: Date.now()
    });
  }

  /**
   * Pay reward for valid report
   */
  async payReportReward(report) {
    if (report.rewardPaid) return;

    const rewardTransaction = new Transaction(
      'SYSTEM',
      report.reporterAddress,
      this.reportReward,
      {
        type: 'REPORT_REWARD',
        reportId: report.id,
        category: report.category
      }
    );

    await rewardTransaction.signTransaction('report_reward');
    await this.blockchain.addTransaction(rewardTransaction);
    
    report.rewardPaid = true;
    console.log(`💰 Report reward paid: ${this.reportReward} TOPAY`);
  }

  /**
   * Vote on report validity (community voting)
   */
  async voteOnReport(reportId, voterAddress, isValid) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'pending') {
      throw new Error('Report is not open for voting');
    }

    // Check if voter has sufficient stake
    const voterBalance = this.blockchain.getBalance(voterAddress);
    if (voterBalance < 50) { // Minimum 50 TOPAY to vote
      throw new Error('Insufficient balance to vote on reports');
    }

    // Remove previous vote if exists
    report.votes.valid.delete(voterAddress);
    report.votes.invalid.delete(voterAddress);

    // Add new vote
    if (isValid) {
      report.votes.valid.add(voterAddress);
    } else {
      report.votes.invalid.add(voterAddress);
    }

    console.log(`🗳️ Vote recorded on report ${reportId}: ${isValid ? 'Valid' : 'Invalid'}`);
    return report;
  }

  /**
   * Get reports by status
   */
  getReportsByStatus(status) {
    return Array.from(this.reports.values())
      .filter(report => report.status === status);
  }

  /**
   * Get reports by category
   */
  getReportsByCategory(category) {
    return Array.from(this.reports.values())
      .filter(report => report.category === category);
  }

  /**
   * Get reports by reporter
   */
  getReportsByReporter(reporterAddress) {
    return Array.from(this.reports.values())
      .filter(report => report.reporterAddress === reporterAddress);
  }

  /**
   * Check if address is blacklisted
   */
  isBlacklisted(address) {
    return this.blacklistedAddresses.has(address);
  }

  /**
   * Check if transaction is flagged
   */
  isTransactionFlagged(transactionId) {
    return this.suspiciousTransactions.has(transactionId);
  }

  /**
   * Get blacklisted addresses
   */
  getBlacklistedAddresses() {
    return Array.from(this.blacklistedAddresses);
  }

  /**
   * Get flagged transactions
   */
  getFlaggedTransactions() {
    return Array.from(this.suspiciousTransactions);
  }

  /**
   * Verify target exists in blockchain
   */
  async verifyTarget(targetType, targetId) {
    switch (targetType) {
      case 'transaction':
        return this.findTransaction(targetId) !== null;
      case 'address':
        return this.blockchain.getBalance(targetId) !== undefined;
      case 'block':
        const blockIndex = parseInt(targetId);
        return blockIndex >= 0 && blockIndex < this.blockchain.chain.length;
      default:
        return false;
    }
  }

  /**
   * Find transaction by ID
   */
  findTransaction(transactionId) {
    for (const block of this.blockchain.chain) {
      for (const transaction of block.transactions) {
        if (transaction.id === transactionId) {
          return transaction;
        }
      }
    }
    return null;
  }

  /**
   * Find existing report
   */
  findExistingReport(targetType, targetId, reporterAddress) {
    return Array.from(this.reports.values())
      .find(report => 
        report.targetType === targetType &&
        report.targetId === targetId &&
        report.reporterAddress === reporterAddress
      );
  }

  /**
   * Calculate report priority
   */
  calculatePriority(category) {
    const priorityMap = {
      'money_laundering': 5,
      'illegal_activity': 5,
      'fraud': 4,
      'scam': 4,
      'phishing': 3,
      'suspicious_activity': 2,
      'spam': 1,
      'other': 1
    };
    return priorityMap[category] || 1;
  }

  /**
   * Generate unique report ID
   */
  async generateReportId(reporterAddress, targetType, targetId) {
    const data = `${reporterAddress}-${targetType}-${targetId}-${Date.now()}`;
    const encoder = new TextEncoder();
    const hash = await computeHash(encoder.encode(data));
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  /**
   * Get report statistics
   */
  getReportStats() {
    const pending = this.getReportsByStatus('pending').length;
    const approved = this.getReportsByStatus('approved').length;
    const rejected = this.getReportsByStatus('rejected').length;
    const investigating = this.getReportsByStatus('investigating').length;
    
    const categoryStats = {};
    for (const category of this.reportCategories) {
      categoryStats[category] = this.getReportsByCategory(category).length;
    }

    return {
      total: this.reports.size,
      pending,
      approved,
      rejected,
      investigating,
      blacklistedAddresses: this.blacklistedAddresses.size,
      flaggedTransactions: this.suspiciousTransactions.size,
      moderators: this.moderators.size,
      categoryBreakdown: categoryStats
    };
  }

  /**
   * Get report by ID
   */
  getReport(reportId) {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports
   */
  getAllReports() {
    return Array.from(this.reports.values());
  }

  /**
   * Get report history
   */
  getReportHistory() {
    return this.reportHistory;
  }

  /**
   * Update system parameters
   */
  updateParameters(reportReward, falseReportPenalty) {
    this.reportReward = reportReward;
    this.falseReportPenalty = falseReportPenalty;
    console.log(`⚙️ Report system parameters updated: Reward=${reportReward}, Penalty=${falseReportPenalty}`);
  }

  /**
   * Remove address from blacklist (moderator action)
   */
  removeFromBlacklist(address, moderatorAddress) {
    if (!this.moderators.has(moderatorAddress)) {
      throw new Error('Unauthorized moderator');
    }

    this.blacklistedAddresses.delete(address);
    console.log(`✅ Address removed from blacklist: ${address.substring(0, 10)}...`);
  }

  /**
   * Remove transaction from flagged list (moderator action)
   */
  removeFlaggedTransaction(transactionId, moderatorAddress) {
    if (!this.moderators.has(moderatorAddress)) {
      throw new Error('Unauthorized moderator');
    }

    this.suspiciousTransactions.delete(transactionId);
    console.log(`✅ Transaction removed from flagged list: ${transactionId}`);
  }
}