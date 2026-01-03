/**
 * KYC Application Storage
 * Simple localStorage-based storage for KYC applications
 * In production, replace with backend API
 */

export interface KycApplication {
  id: string;
  wallet: string;
  fullName: string;
  email: string;
  country: string;
  documentType: string; // passport, drivers_license, national_id
  documentNumber: string;
  dateOfBirth: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  onchainIdAddress?: string; // Set when KYC Provider creates OnchainID
  rejectionReason?: string;
  notes?: string;
}

const STORAGE_KEY = 'kyc_applications';

/**
 * Get all KYC applications
 */
export function getAllApplications(): KycApplication[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get applications for a specific wallet
 */
export function getApplicationByWallet(wallet: string): KycApplication | null {
  const apps = getAllApplications();
  return apps.find(app => app.wallet.toLowerCase() === wallet.toLowerCase()) || null;
}

/**
 * Get pending applications (for KYC Provider review)
 */
export function getPendingApplications(): KycApplication[] {
  return getAllApplications().filter(app => app.status === 'pending');
}

/**
 * Get approved applications with OnchainID (for Issuer whitelist)
 */
export function getApprovedApplications(): KycApplication[] {
  return getAllApplications().filter(
    app => app.status === 'approved' && app.onchainIdAddress
  );
}

/**
 * Submit a new KYC application
 */
export function submitApplication(
  application: Omit<KycApplication, 'id' | 'status' | 'submittedAt'>
): KycApplication {
  const apps = getAllApplications();
  
  // Check if wallet already has an application
  const existing = apps.find(
    app => app.wallet.toLowerCase() === application.wallet.toLowerCase()
  );
  
  if (existing && existing.status === 'pending') {
    throw new Error('You already have a pending KYC application');
  }
  
  const newApp: KycApplication = {
    ...application,
    id: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    submittedAt: Date.now(),
  };
  
  apps.push(newApp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  
  return newApp;
}

/**
 * Approve a KYC application and associate OnchainID
 */
export function approveApplication(
  applicationId: string,
  onchainIdAddress: string,
  reviewerWallet: string
): KycApplication {
  const apps = getAllApplications();
  const app = apps.find(a => a.id === applicationId);
  
  if (!app) {
    throw new Error('Application not found');
  }
  
  if (app.status !== 'pending') {
    throw new Error('Application already reviewed');
  }
  
  app.status = 'approved';
  app.onchainIdAddress = onchainIdAddress;
  app.reviewedAt = Date.now();
  app.reviewedBy = reviewerWallet;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  
  return app;
}

/**
 * Reject a KYC application
 */
export function rejectApplication(
  applicationId: string,
  reason: string,
  reviewerWallet: string
): KycApplication {
  const apps = getAllApplications();
  const app = apps.find(a => a.id === applicationId);
  
  if (!app) {
    throw new Error('Application not found');
  }
  
  if (app.status !== 'pending') {
    throw new Error('Application already reviewed');
  }
  
  app.status = 'rejected';
  app.rejectionReason = reason;
  app.reviewedAt = Date.now();
  app.reviewedBy = reviewerWallet;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  
  return app;
}

/**
 * Update application notes
 */
export function updateNotes(applicationId: string, notes: string): void {
  const apps = getAllApplications();
  const app = apps.find(a => a.id === applicationId);
  
  if (!app) {
    throw new Error('Application not found');
  }
  
  app.notes = notes;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

/**
 * Clear all applications (for testing)
 */
export function clearAllApplications(): void {
  localStorage.removeItem(STORAGE_KEY);
}
