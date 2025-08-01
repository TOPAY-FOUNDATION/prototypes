'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Wallet, Lock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import styles from './welcome.module.css';
import WelcomeIntro from '../components/welcome/WelcomeIntro';
import WalletCreation from '../components/welcome/WalletCreation';
import WalletImport from '../components/welcome/WalletImport';
import BackupPhrase from '../components/welcome/BackupPhrase';
import DevicePassword from '../components/welcome/DevicePassword';
import WelcomeComplete from '../components/welcome/WelcomeComplete';

type WelcomeStep = 'intro' | 'create' | 'import' | 'backup' | 'password' | 'complete';

interface WalletData {
  address: string;
  privateKey: string;
  publicKey: number[];
  seedPhrase: string[];
}

export default function WelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WelcomeStep>('intro');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [devicePassword, setDevicePassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const steps = [
    { id: 'intro', title: 'Welcome', icon: Shield },
    { id: 'create', title: 'Create Wallet', icon: Wallet },
    { id: 'backup', title: 'Backup Keys', icon: CheckCircle },
    { id: 'password', title: 'Device Security', icon: Lock },
    { id: 'complete', title: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleCreateWallet = () => {
    setIsImporting(false);
    setCurrentStep('create');
  };

  const handleImportWallet = () => {
    setIsImporting(true);
    setCurrentStep('import');
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id as WelcomeStep);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'create':
      case 'import':
        setCurrentStep('intro');
        break;
      case 'backup':
        setCurrentStep('create');
        break;
      case 'password':
        if (isImporting) {
          setCurrentStep('import');
        } else {
          setCurrentStep('backup');
        }
        break;
      case 'complete':
        setCurrentStep('password');
        break;
      default:
        setCurrentStep('intro');
    }
  };

  const handleWalletCreated = (wallet: WalletData) => {
    setWalletData(wallet);
    setCurrentStep('backup');
  };

  const handleWalletImported = (wallet: WalletData) => {
    setWalletData(wallet);
    // Skip backup step for imported wallets and go directly to password
    setCurrentStep('password');
  };

  const handleBackupComplete = () => {
    setCurrentStep('password');
  };

  const handlePasswordSet = (password: string) => {
    setDevicePassword(password);
    // Store device password securely
    localStorage.setItem('devicePasswordHash', btoa(password)); // In production, use proper hashing
    handleNext();
  };

  const handleWelcomeComplete = () => {
    // Mark welcome flow as completed
    localStorage.setItem('hasCompletedWelcome', 'true');
    
    // Save wallet data to localStorage
    if (walletData) {
      localStorage.setItem('walletAddress', walletData.address);
      localStorage.setItem('walletPrivateKey', walletData.privateKey);
      localStorage.setItem('walletPublicKey', JSON.stringify(walletData.publicKey));
      if (!isImporting) {
        localStorage.setItem('walletSeedPhrase', JSON.stringify(walletData.seedPhrase));
      }
    }
    
    // Save device password (in a real app, this would be hashed)
    if (devicePassword) {
      localStorage.setItem('devicePassword', devicePassword);
    }
    
    // Redirect to dashboard
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>TOPAY Wallet</h1>
        <p className={styles.subtitle}>Quantum-Safe Digital Currency</p>
      </div>

      {/* Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step.id} className={styles.progressStep}>
                <div className={`${styles.stepCircle} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                  <StepIcon size={16} />
                </div>
                <span className={`${styles.stepLabel} ${isActive ? styles.activeLabel : ''}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`${styles.stepConnector} ${isCompleted ? styles.completedConnector : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className={styles.content}>
        {currentStep === 'intro' && (
          <WelcomeIntro 
            onCreateWallet={handleCreateWallet}
            onImportWallet={handleImportWallet}
          />
        )}
        
        {currentStep === 'create' && (
          <WalletCreation onWalletCreated={handleWalletCreated} onBack={handleBack} />
        )}
        
        {currentStep === 'import' && (
          <WalletImport onWalletImported={handleWalletImported} onBack={handleBack} />
        )}
        
        {currentStep === 'backup' && walletData && (
          <BackupPhrase 
            walletData={walletData} 
            onBackupComplete={handleBackupComplete}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 'password' && (
          <DevicePassword 
            onPasswordSet={handlePasswordSet}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 'complete' && walletData && (
          <WelcomeComplete 
            walletData={walletData}
            onComplete={handleWelcomeComplete}
          />
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        {currentStepIndex > 0 && currentStep !== 'complete' && (
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        
        <div className={styles.stepIndicator}>
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        
        {currentStep === 'intro' && (
          <div className={styles.introButtons}>
            <button className={styles.nextButton} onClick={handleCreateWallet}>
              Create Wallet
              <ArrowRight size={16} />
            </button>
            <button className={styles.importButton} onClick={handleImportWallet}>
              Import Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}