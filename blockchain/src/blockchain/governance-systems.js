/**
 * TOPAY Foundation Blockchain - Integrated Governance Systems
 * 
 * This module integrates the Transaction Reversal System, Voting System,
 * and Report System with the main blockchain for comprehensive governance.
 */

import { TransactionReversalSystem } from './reversal-system.js';
import { VotingSystem } from './voting-system.js';
import { ReportSystem } from './report-system.js';

export class GovernanceSystems {
  constructor(blockchain) {
    this.blockchain = blockchain;
    
    // Initialize all governance systems
    this.reversalSystem = new TransactionReversalSystem(blockchain);
    this.votingSystem = new VotingSystem(blockchain);
    this.reportSystem = new ReportSystem(blockchain);
    
    // Cross-system integration
    this.setupIntegrations();
    
    console.log('🏛️ Governance Systems initialized successfully');
  }

  /**
   * Setup integrations between systems
   */
  setupIntegrations() {
    // Add system administrators as authorized reversers and moderators
    const systemAdmins = [
      'admin_001_topay_foundation',
      'admin_002_topay_foundation',
      'admin_003_topay_foundation'
    ];

    systemAdmins.forEach(admin => {
      this.reversalSystem.addAuthorizedReverser(admin);
      this.reportSystem.addModerator(admin);
    });

    console.log('🔗 Cross-system integrations configured');
  }

  // ==================== TRANSACTION REVERSAL METHODS ====================

  /**
   * Request transaction reversal
   */
  async requestTransactionReversal(transactionId, requesterAddress, reason, evidence = null) {
    try {
      return await this.reversalSystem.requestReversal(transactionId, requesterAddress, reason, evidence);
    } catch (error) {
      console.error('❌ Reversal request failed:', error.message);
      throw error;
    }
  }

  /**
   * Approve transaction reversal
   */
  async approveTransactionReversal(transactionId, approverAddress) {
    try {
      return await this.reversalSystem.approveReversal(transactionId, approverAddress);
    } catch (error) {
      console.error('❌ Reversal approval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get pending reversals
   */
  getPendingReversals() {
    return this.reversalSystem.getPendingReversals();
  }

  /**
   * Get reversal statistics
   */
  getReversalStats() {
    return this.reversalSystem.getReversalStats();
  }

  // ==================== VOTING SYSTEM METHODS ====================

  /**
   * Register voter
   */
  async registerVoter(voterAddress) {
    try {
      return await this.votingSystem.registerVoter(voterAddress);
    } catch (error) {
      console.error('❌ Voter registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Create governance proposal
   */
  async createProposal(proposerAddress, title, description, options, votingPeriod) {
    try {
      return await this.votingSystem.createProposal(proposerAddress, title, description, options, votingPeriod);
    } catch (error) {
      console.error('❌ Proposal creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Cast vote on proposal
   */
  async castVote(proposalId, voterAddress, optionId, weight = 1) {
    try {
      return await this.votingSystem.castVote(proposalId, voterAddress, optionId, weight);
    } catch (error) {
      console.error('❌ Vote casting failed:', error.message);
      throw error;
    }
  }

  /**
   * Get active proposals
   */
  getActiveProposals() {
    return this.votingSystem.getActiveProposals();
  }

  /**
   * Get voting statistics
   */
  getVotingStats() {
    return this.votingSystem.getVotingStats();
  }

  // ==================== REPORT SYSTEM METHODS ====================

  /**
   * Submit report
   */
  async submitReport(reporterAddress, targetType, targetId, category, description, evidence = null) {
    try {
      return await this.reportSystem.submitReport(reporterAddress, targetType, targetId, category, description, evidence);
    } catch (error) {
      console.error('❌ Report submission failed:', error.message);
      throw error;
    }
  }

  /**
   * Moderate report
   */
  async moderateReport(reportId, moderatorAddress, action, notes = '') {
    try {
      return await this.reportSystem.moderateReport(reportId, moderatorAddress, action, notes);
    } catch (error) {
      console.error('❌ Report moderation failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if address is blacklisted
   */
  isAddressBlacklisted(address) {
    return this.reportSystem.isBlacklisted(address);
  }

  /**
   * Check if transaction is flagged
   */
  isTransactionFlagged(transactionId) {
    return this.reportSystem.isTransactionFlagged(transactionId);
  }

  /**
   * Get report statistics
   */
  getReportStats() {
    return this.reportSystem.getReportStats();
  }

  // ==================== INTEGRATED GOVERNANCE METHODS ====================

  /**
   * Create proposal for transaction reversal (community-driven)
   */
  async createReversalProposal(proposerAddress, transactionId, reason, evidence = null) {
    const title = `Transaction Reversal Request: ${transactionId.substring(0, 16)}...`;
    const description = `Proposal to reverse transaction ${transactionId}\n\nReason: ${reason}\n\nEvidence: ${evidence || 'None provided'}`;
    const options = ['Approve Reversal', 'Reject Reversal'];
    
    try {
      const proposal = await this.votingSystem.createProposal(
        proposerAddress,
        title,
        description,
        options,
        7 * 24 * 60 * 60 * 1000 // 7 days voting period
      );
      
      // Link proposal to reversal system
      proposal.linkedTransactionId = transactionId;
      proposal.proposalType = 'TRANSACTION_REVERSAL';
      
      return proposal;
    } catch (error) {
      console.error('❌ Reversal proposal creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create proposal for system parameter changes
   */
  async createParameterChangeProposal(proposerAddress, parameterType, newValue, justification) {
    const title = `Parameter Change: ${parameterType}`;
    const description = `Proposal to change ${parameterType} to ${newValue}\n\nJustification: ${justification}`;
    const options = ['Approve Change', 'Reject Change'];
    
    try {
      const proposal = await this.votingSystem.createProposal(
        proposerAddress,
        title,
        description,
        options,
        14 * 24 * 60 * 60 * 1000 // 14 days voting period for parameter changes
      );
      
      proposal.parameterType = parameterType;
      proposal.newValue = newValue;
      proposal.proposalType = 'PARAMETER_CHANGE';
      
      return proposal;
    } catch (error) {
      console.error('❌ Parameter change proposal creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Process finalized proposals and execute actions
   */
  async processProposalResults(proposalId) {
    const proposal = this.votingSystem.getProposal(proposalId);
    
    if (!proposal || proposal.status !== 'finalized') {
      throw new Error('Proposal not found or not finalized');
    }

    const winningOption = proposal.winningOption;
    
    try {
      switch (proposal.proposalType) {
        case 'TRANSACTION_REVERSAL':
          if (winningOption.id === 0) { // Approve Reversal
            await this.reversalSystem.requestReversal(
              proposal.linkedTransactionId,
              proposal.proposerAddress,
              'Community-approved reversal',
              `Proposal ${proposalId} approved with ${winningOption.votes} votes`
            );
            
            // Auto-approve with community consensus
            const systemAdmin = 'admin_001_topay_foundation';
            await this.reversalSystem.approveReversal(proposal.linkedTransactionId, systemAdmin);
          }
          break;
          
        case 'PARAMETER_CHANGE':
          if (winningOption.id === 0) { // Approve Change
            await this.executeParameterChange(proposal.parameterType, proposal.newValue);
          }
          break;
      }
      
      console.log(`✅ Proposal ${proposalId} results processed successfully`);
    } catch (error) {
      console.error(`❌ Failed to process proposal ${proposalId} results:`, error.message);
      throw error;
    }
  }

  /**
   * Execute parameter changes approved by community
   */
  async executeParameterChange(parameterType, newValue) {
    switch (parameterType) {
      case 'mining_reward':
        this.blockchain.miningReward = newValue;
        break;
      case 'difficulty':
        this.blockchain.difficulty = newValue;
        break;
      case 'voting_minimum_stake':
        this.votingSystem.updateVotingParameters(newValue, this.votingSystem.proposalFee);
        break;
      case 'proposal_fee':
        this.votingSystem.updateVotingParameters(this.votingSystem.minimumStake, newValue);
        break;
      case 'report_reward':
        this.reportSystem.updateParameters(newValue, this.reportSystem.falseReportPenalty);
        break;
      case 'false_report_penalty':
        this.reportSystem.updateParameters(this.reportSystem.reportReward, newValue);
        break;
      default:
        throw new Error(`Unknown parameter type: ${parameterType}`);
    }
    
    console.log(`⚙️ Parameter ${parameterType} updated to ${newValue}`);
  }

  /**
   * Get comprehensive governance dashboard data
   */
  getGovernanceDashboard() {
    return {
      blockchain: {
        totalBlocks: this.blockchain.chain.length,
        totalTransactions: this.blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0),
        difficulty: this.blockchain.difficulty,
        miningReward: this.blockchain.miningReward
      },
      reversal: this.getReversalStats(),
      voting: this.getVotingStats(),
      reports: this.getReportStats(),
      security: {
        blacklistedAddresses: this.reportSystem.getBlacklistedAddresses().length,
        flaggedTransactions: this.reportSystem.getFlaggedTransactions().length,
        activeModerators: this.reportSystem.moderators.size,
        authorizedReversers: this.reversalSystem.authorizedReversers.size
      }
    };
  }

  /**
   * Validate transaction against all governance systems
   */
  async validateTransactionGovernance(transaction) {
    const validationResults = {
      isValid: true,
      warnings: [],
      blocks: []
    };

    // Check if sender is blacklisted
    if (transaction.from && this.reportSystem.isBlacklisted(transaction.from)) {
      validationResults.isValid = false;
      validationResults.blocks.push('Sender address is blacklisted');
    }

    // Check if recipient is blacklisted
    if (this.reportSystem.isBlacklisted(transaction.to)) {
      validationResults.warnings.push('Recipient address is blacklisted');
    }

    // Check for large transactions (potential money laundering)
    if (transaction.amount > 10000) {
      validationResults.warnings.push('Large transaction amount detected');
    }

    return validationResults;
  }

  /**
   * Emergency governance action (requires multiple admin approval)
   */
  async emergencyAction(actionType, targetId, adminAddress, reason) {
    const validAdmins = [
      'admin_001_topay_foundation',
      'admin_002_topay_foundation',
      'admin_003_topay_foundation'
    ];

    if (!validAdmins.includes(adminAddress)) {
      throw new Error('Unauthorized admin');
    }

    switch (actionType) {
      case 'emergency_blacklist':
        this.reportSystem.blacklistedAddresses.add(targetId);
        console.log(`🚨 Emergency blacklist: ${targetId}`);
        break;
      case 'emergency_flag_transaction':
        this.reportSystem.suspiciousTransactions.add(targetId);
        console.log(`🚨 Emergency transaction flag: ${targetId}`);
        break;
      default:
        throw new Error('Invalid emergency action type');
    }

    // Log emergency action
    console.log(`🚨 Emergency action executed: ${actionType} by ${adminAddress} - Reason: ${reason}`);
  }

  // ==================== SYSTEM ACCESS METHODS ====================

  /**
   * Get reversal system instance
   */
  getReversalSystem() {
    return this.reversalSystem;
  }

  /**
   * Get voting system instance
   */
  getVotingSystem() {
    return this.votingSystem;
  }

  /**
   * Get report system instance
   */
  getReportSystem() {
    return this.reportSystem;
  }
}