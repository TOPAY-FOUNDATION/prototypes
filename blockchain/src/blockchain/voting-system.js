/**
 * TOPAY Foundation Blockchain - Voting System
 * 
 * Implements a comprehensive on-chain voting system for governance,
 * proposals, and community decision-making with quantum-safe security.
 */

import { computeHash } from '@topayfoundation/topayz512';
import { Transaction } from './transaction.js';

export class VotingSystem {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.proposals = new Map(); // Store all proposals
    this.votes = new Map(); // Store votes by proposal ID
    this.voters = new Set(); // Registered voters
    this.votingHistory = []; // Track voting history
    this.minimumStake = 100; // Minimum TOPAY tokens to vote
    this.proposalFee = 50; // Fee to create a proposal
  }

  /**
   * Register a voter
   */
  async registerVoter(voterAddress) {
    const balance = this.blockchain.getBalance(voterAddress);
    if (balance < this.minimumStake) {
      throw new Error(`Insufficient balance. Minimum ${this.minimumStake} TOPAY required to vote`);
    }

    this.voters.add(voterAddress);
    console.log(`🗳️ Voter registered: ${voterAddress.substring(0, 10)}...`);
    return true;
  }

  /**
   * Create a new proposal
   */
  async createProposal(proposerAddress, title, description, options, votingPeriod = 7 * 24 * 60 * 60 * 1000) {
    console.log(`📝 Creating new proposal: ${title}`);

    // Check if proposer has sufficient balance
    const balance = this.blockchain.getBalance(proposerAddress);
    if (balance < this.proposalFee) {
      throw new Error(`Insufficient balance. ${this.proposalFee} TOPAY required to create proposal`);
    }

    // Validate options
    if (!options || options.length < 2) {
      throw new Error('Proposal must have at least 2 options');
    }

    // Generate proposal ID
    const proposalId = await this.generateProposalId(proposerAddress, title);

    // Create proposal
    const proposal = {
      id: proposalId,
      title,
      description,
      options: options.map((option, index) => ({
        id: index,
        text: option,
        votes: 0,
        voters: new Set()
      })),
      proposerAddress,
      createdAt: Date.now(),
      votingStartTime: Date.now(),
      votingEndTime: Date.now() + votingPeriod,
      status: 'active',
      totalVotes: 0,
      participationRate: 0
    };

    // Create fee transaction
    const feeTransaction = new Transaction(
      proposerAddress,
      'SYSTEM',
      this.proposalFee,
      {
        type: 'PROPOSAL_FEE',
        proposalId: proposalId,
        title: title
      }
    );

    await feeTransaction.signTransaction('proposal_fee');
    await this.blockchain.addTransaction(feeTransaction);

    // Store proposal
    this.proposals.set(proposalId, proposal);
    this.votes.set(proposalId, new Map());

    console.log(`✅ Proposal created: ${proposalId}`);
    return proposal;
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(proposalId, voterAddress, optionId, weight = 1) {
    console.log(`🗳️ Processing vote from: ${voterAddress.substring(0, 10)}...`);

    // Check if voter is registered
    if (!this.voters.has(voterAddress)) {
      throw new Error('Voter not registered');
    }

    // Get proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check if voting is still active
    if (proposal.status !== 'active') {
      throw new Error('Voting is not active for this proposal');
    }

    if (Date.now() > proposal.votingEndTime) {
      proposal.status = 'ended';
      throw new Error('Voting period has ended');
    }

    // Check if option exists
    if (optionId >= proposal.options.length) {
      throw new Error('Invalid option ID');
    }

    // Check if voter already voted
    const existingVotes = this.votes.get(proposalId);
    if (existingVotes.has(voterAddress)) {
      throw new Error('Voter has already voted on this proposal');
    }

    // Calculate voting weight based on stake
    const voterBalance = this.blockchain.getBalance(voterAddress);
    const calculatedWeight = Math.min(weight, Math.floor(voterBalance / this.minimumStake));

    // Record vote
    const vote = {
      voterAddress,
      optionId,
      weight: calculatedWeight,
      timestamp: Date.now(),
      blockHeight: this.blockchain.chain.length
    };

    existingVotes.set(voterAddress, vote);

    // Update proposal statistics
    proposal.options[optionId].votes += calculatedWeight;
    proposal.options[optionId].voters.add(voterAddress);
    proposal.totalVotes += calculatedWeight;
    proposal.participationRate = (existingVotes.size / this.voters.size) * 100;

    // Create vote transaction for transparency
    const voteTransaction = new Transaction(
      voterAddress,
      'VOTING_SYSTEM',
      0, // No transfer, just record
      {
        type: 'VOTE',
        proposalId,
        optionId,
        weight: calculatedWeight,
        proposalTitle: proposal.title
      }
    );

    await voteTransaction.signTransaction('vote_cast');
    await this.blockchain.addTransaction(voteTransaction);

    console.log(`✅ Vote recorded: Option ${optionId} with weight ${calculatedWeight}`);
    return vote;
  }

  /**
   * End voting and finalize results
   */
  async finalizeProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'active') {
      throw new Error('Proposal is not active');
    }

    // Check if voting period has ended
    if (Date.now() < proposal.votingEndTime) {
      throw new Error('Voting period has not ended yet');
    }

    // Determine winner
    let winningOption = proposal.options[0];
    for (const option of proposal.options) {
      if (option.votes > winningOption.votes) {
        winningOption = option;
      }
    }

    // Update proposal status
    proposal.status = 'finalized';
    proposal.finalizedAt = Date.now();
    proposal.winningOption = winningOption;
    proposal.results = proposal.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes,
      percentage: proposal.totalVotes > 0 ? (option.votes / proposal.totalVotes * 100).toFixed(2) : 0
    }));

    // Add to voting history
    this.votingHistory.push({
      ...proposal,
      finalizedAt: Date.now()
    });

    console.log(`🏆 Proposal finalized: "${proposal.title}" - Winner: "${winningOption.text}"`);
    return proposal;
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId) {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all active proposals
   */
  getActiveProposals() {
    return Array.from(this.proposals.values())
      .filter(proposal => proposal.status === 'active' && Date.now() <= proposal.votingEndTime);
  }

  /**
   * Get all proposals
   */
  getAllProposals() {
    return Array.from(this.proposals.values());
  }

  /**
   * Get voting history for an address
   */
  getVotingHistory(voterAddress) {
    const history = [];
    
    for (const [proposalId, votes] of this.votes.entries()) {
      const vote = votes.get(voterAddress);
      if (vote) {
        const proposal = this.proposals.get(proposalId);
        history.push({
          proposalId,
          proposalTitle: proposal.title,
          optionId: vote.optionId,
          optionText: proposal.options[vote.optionId].text,
          weight: vote.weight,
          timestamp: vote.timestamp
        });
      }
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get proposal results
   */
  getProposalResults(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    return {
      proposalId,
      title: proposal.title,
      status: proposal.status,
      totalVotes: proposal.totalVotes,
      participationRate: proposal.participationRate,
      options: proposal.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option.votes,
        percentage: proposal.totalVotes > 0 ? (option.votes / proposal.totalVotes * 100).toFixed(2) : 0,
        voterCount: option.voters.size
      })),
      winningOption: proposal.winningOption,
      votingPeriod: {
        start: proposal.votingStartTime,
        end: proposal.votingEndTime,
        duration: proposal.votingEndTime - proposal.votingStartTime
      }
    };
  }

  /**
   * Generate unique proposal ID
   */
  async generateProposalId(proposerAddress, title) {
    const data = `${proposerAddress}-${title}-${Date.now()}`;
    const encoder = new TextEncoder();
    const hash = await computeHash(encoder.encode(data));
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  /**
   * Get voting system statistics
   */
  getVotingStats() {
    const activeProposals = this.getActiveProposals().length;
    const totalProposals = this.proposals.size;
    const totalVoters = this.voters.size;
    const completedProposals = Array.from(this.proposals.values())
      .filter(p => p.status === 'finalized').length;

    return {
      activeProposals,
      totalProposals,
      completedProposals,
      totalVoters,
      averageParticipation: this.calculateAverageParticipation()
    };
  }

  /**
   * Calculate average participation rate
   */
  calculateAverageParticipation() {
    const completedProposals = Array.from(this.proposals.values())
      .filter(p => p.status === 'finalized');
    
    if (completedProposals.length === 0) return 0;
    
    const totalParticipation = completedProposals
      .reduce((sum, proposal) => sum + proposal.participationRate, 0);
    
    return (totalParticipation / completedProposals.length).toFixed(2);
  }

  /**
   * Check if address can vote
   */
  canVote(voterAddress) {
    return this.voters.has(voterAddress) && 
           this.blockchain.getBalance(voterAddress) >= this.minimumStake;
  }

  /**
   * Update voting parameters
   */
  updateVotingParameters(minimumStake, proposalFee) {
    this.minimumStake = minimumStake;
    this.proposalFee = proposalFee;
    console.log(`⚙️ Voting parameters updated: Stake=${minimumStake}, Fee=${proposalFee}`);
  }
}