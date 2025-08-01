import { Blockchain } from './src/blockchain/blockchain';

async function debugValidation() {
  console.log('🔍 Starting blockchain validation debug...');
  
  const blockchain = new Blockchain();
  
  console.log('🔍 Using predefined test addresses...');
  const address1 = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
  const minerAddress = 'TOPAYminer234567890abcdef1234567890abcdef12345678';
  
  console.log('🔍 Mining first block...');
  await blockchain.minePendingTransactions(minerAddress);
  
  console.log('🔍 Mining second block...');
  await blockchain.minePendingTransactions(minerAddress);
  
  console.log('🔍 Chain length:', blockchain.chain.length);
  
  for (let i = 0; i < blockchain.chain.length; i++) {
    const block = blockchain.chain[i];
    console.log(`🔍 Block ${i}:`);
    console.log(`   Hash: ${block.hash?.substring(0, 40)}...`);
    console.log(`   Merkle Root: ${block.merkleRoot?.substring(0, 40)}...`);
    console.log(`   Transactions: ${block.transactions.length}`);
    console.log(`   Previous Hash: ${block.previousHash?.substring(0, 40)}...`);
    
    if (i > 0) {
      const isBlockValid = await block.isValid();
      console.log(`   Block valid: ${isBlockValid}`);
    }
  }
  
  console.log('🔍 Validating entire blockchain...');
  const isValid = await blockchain.isChainValid();
  console.log(`🔍 Blockchain valid: ${isValid}`);
  console.log('⚠️  Note: Wallet creation should be handled by external wallet applications');
}

debugValidation().catch(console.error);