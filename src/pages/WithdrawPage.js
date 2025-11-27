// src/pages/WithdrawPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import {
  DollarSign,
  Smartphone,
  CreditCard,
  Building2,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  X,
  Check,
  Lock,
  ShieldCheck,
  TrendingUp,
  Crown,
  User,
  Sparkles,
  Zap,
  PartyPopper,
  Rocket,
  BadgeCheck,
  RefreshCw
} from 'lucide-react';
import Confetti from 'react-confetti';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentExchangeRate, formatKES } from './UserDashboard';

// VIP Config (same as dashboard)
const VIP_CONFIG = {
  Bronze: { priceUSD: 0.99, dailyTasks: 4 },
  Silver: { priceUSD: 3.99, dailyTasks: 7 },
  Gold:   { priceUSD: 9.99, dailyTasks: 10 },
};

const MIN_WITHDRAWAL_USD = 10.00;
const MIN_COMPLETED_TASKS = 15;
const FEE_PERCENTAGE = 2;

const normalizeMpesa = (input) => {
  if (!input) return null;
  const cleaned = input.replace(/\D/g, '');
  if (/^0[71]/.test(input) && cleaned.length === 10) return `+254${cleaned.slice(1)}`;
  if (/^\+254[71]/.test(input) && cleaned.length === 12) return `+254${cleaned.slice(3)}`;
  if (/^254[71]/.test(cleaned) && cleaned.length === 12) return `+${cleaned}`;
  return null;
};

const isValidMpesaNumber = (input) =>
  /^0[17]\d{8}$/.test(input) || /^\+254[17]\d{8}$/.test(input);

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [eligibility, setEligibility] = useState({
    kycComplete: false,
    minAmount: false,
    minTasks: false,
  });

  // VIP Upgrade State
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [selectedVIP, setSelectedVIP] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Animated Withdrawal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [refreshingWithdrawals, setRefreshingWithdrawals] = useState(false);

  // Fixed: getStatusIcon inside component
  const getStatusIcon = useCallback((status) => {
    const config = {
      pending: { Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
      processing: { Icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
      completed: { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
      failed: { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    }[status] || { Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' };

    const Icon = config.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }, []);

  // Load withdrawals with NO INDEX REQUIRED - SIMPLE QUERY
  const loadWithdrawals = useCallback(async (userId) => {
    if (!userId) return;
    
    setRefreshingWithdrawals(true);
    try {
      console.log('🔍 Loading withdrawals for user:', userId);
      
      // SIMPLE QUERY - No composite index required
      const q = query(
        collection(db, 'withdrawals'),
        where('userId', '==', userId)
        // Removed orderBy to avoid index requirement for now
      );
      
      const querySnapshot = await getDocs(q);
      const withdrawalsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Withdrawal document:', doc.id, data);
        withdrawalsData.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
        });
      });
      
      // Sort manually by date (newest first)
      withdrawalsData.sort((a, b) => b.requestedAt - a.requestedAt);
      
      // Limit to 10 manually
      const limitedWithdrawals = withdrawalsData.slice(0, 10);
      
      console.log('✅ Total withdrawals found:', limitedWithdrawals.length);
      setWithdrawals(limitedWithdrawals);
      
    } catch (error) {
      console.error('❌ Error loading withdrawals:', error);
      toast.error('Failed to load withdrawal history');
    } finally {
      setRefreshingWithdrawals(false);
    }
  }, []);

  // Real-time listener for withdrawals - NO INDEX REQUIRED
  const setupWithdrawalsListener = useCallback((userId) => {
    if (!userId) return;
    
    console.log('🎯 Setting up real-time listener for user:', userId);
    
    // SIMPLE QUERY - No composite index required
    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId)
      // Removed orderBy to avoid index requirement for now
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('🔄 Real-time update: withdrawals changed');
        let withdrawalsData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          requestedAt: d.data().requestedAt?.toDate() || new Date(),
        }));
        
        // Sort manually by date (newest first)
        withdrawalsData.sort((a, b) => b.requestedAt - a.requestedAt);
        
        // Limit to 10 manually
        withdrawalsData = withdrawalsData.slice(0, 10);
        
        console.log('📊 Updated withdrawals:', withdrawalsData.length);
        setWithdrawals(withdrawalsData);
      },
      (error) => {
        console.error('❌ Error in withdrawals listener:', error);
        // Fallback to one-time load if real-time fails
        loadWithdrawals(userId);
      }
    );
    
    return unsubscribe;
  }, [loadWithdrawals]);

  // PROTECTED ROUTE + AUTH + DATA LOADING
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser === null) return; // still loading

      if (!currentUser) {
        toast.info('Please sign in to withdraw your earnings', {
          icon: <Lock className="w-5 h-5" />,
          position: 'top-center',
          autoClose: 4000,
          style: { background: '#1e293b', color: '#e2e8f0' },
        });
        navigate('/signin', { replace: true });
        return;
      }

      setUser(currentUser);
      console.log('👤 User authenticated:', currentUser.uid);

      const userRef = doc(db, 'users', currentUser.uid);
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          toast.error('Profile not found');
          navigate('/dashboard');
          return;
        }
        const data = snap.data();
        console.log('📋 User profile loaded:', data);
        setProfile(data);
        setBalance(data.currentbalance || 0);
        setPhone(data.phone || '');
      });

      // Set up withdrawals listener
      const unsubWithdrawals = setupWithdrawalsListener(currentUser.uid);

      return () => {
        unsubUser();
        if (unsubWithdrawals) unsubWithdrawals();
      };
    });

    return () => unsubAuth();
  }, [navigate, setupWithdrawalsListener]);

  // Manual refresh function
  const refreshWithdrawals = () => {
    if (user) {
      loadWithdrawals(user.uid);
    }
  };

  // Eligibility check - USING ONBOARDING TASK LOGIC
  useEffect(() => {
    if (!profile) return;
    
    // Use onboarding task completion as KYC verification
    const hasCompletedOnboarding = profile.hasDoneOnboardingTask || false;
    const tasksDone = profile.ApprovedTasks || 0;
    
    // Calculate minimum amount needed (accounting for 2% fee)
    const minAmountNeeded = MIN_WITHDRAWAL_USD / (1 - FEE_PERCENTAGE / 100);
    const amountOk = balance >= minAmountNeeded;
    
    setEligibility({
      kycComplete: hasCompletedOnboarding,
      minAmount: amountOk,
      minTasks: tasksDone >= MIN_COMPLETED_TASKS,
    });
  }, [profile, balance]);

  // Animated Withdrawal Process
  const startWithdrawalAnimation = (data) => {
    setWithdrawalData(data);
    setShowSuccessModal(true);
    setAnimationStep(0);
    setShowConfetti(true);

    // Step 1: Processing
    setTimeout(() => {
      setAnimationStep(1);
    }, 1500);

    // Step 2: Approved
    setTimeout(() => {
      setAnimationStep(2);
    }, 3000);

    // Step 3: Completed
    setTimeout(() => {
      setAnimationStep(3);
    }, 4500);

    // Stop confetti after 6 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 6000);

    // Refresh withdrawals list after successful withdrawal
    setTimeout(() => {
      if (user) {
        loadWithdrawals(user.uid);
      }
    }, 5000);
  };

  // VIP Upgrade Functions
  const handleRealVIPUpgrade = async () => {
    if (!selectedVIP) return toast.error('Select a VIP tier');
    
    const normalized = normalizeMpesa(mpesaNumber);
    if (!normalized || !isValidMpesaNumber(mpesaNumber)) 
      return toast.error('Invalid M-Pesa number');

    setIsProcessing(true);

    const liveRate = getCurrentExchangeRate();
    const usdPrice = VIP_CONFIG[selectedVIP].priceUSD;
    const kesAmount = Math.round(usdPrice * liveRate);

    const clientReference = `VIP_${user.uid}_${Date.now()}`;

    try {
      const res = await fetch('/api/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalized,
          amount: kesAmount,
          reference: clientReference,
          description: `${selectedVIP} VIP Upgrade • $${usdPrice} USD @ ${liveRate.toFixed(2)} KES/USD`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'STK push failed');

      toast.info(
        <div className="text-xs">
          <p>STK push sent to {mpesaNumber}</p>
          <p className="text-emerald-300 mt-1">
            Amount: Ksh.{kesAmount.toLocaleString()} (≈ ${usdPrice} @ {liveRate.toFixed(2)} KES/USD)
          </p>
        </div>,
        { autoClose: 15000 }
      );

      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/transaction-status?reference=${encodeURIComponent(data.payheroReference)}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'SUCCESS') {
            clearInterval(poll);
            toast.success('Payment confirmed! VIP upgraded 🎉');
            await finalizeVIPUpgrade();
          } else if (['FAILED', 'CANCELLED'].includes(statusData.status)) {
            clearInterval(poll);
            toast.error('Payment failed or cancelled');
            setIsProcessing(false);
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(poll);
        if (isProcessing) {
          toast.warn('Payment timed out — check your phone');
          setIsProcessing(false);
        }
      }, 120000);

    } catch (e) {
      toast.error(e.message || 'Upgrade failed');
      setIsProcessing(false);
    }
  };

  const finalizeVIPUpgrade = async () => {
    const newMax = VIP_CONFIG[selectedVIP].dailyTasks;
    await updateDoc(doc(db, 'users', user.uid), {
      isVIP: true,
      tier: `${selectedVIP}VIP`,
      dailyTasksRemaining: newMax,
      lastTaskResetDate: serverTimestamp(),
      vipUpgradedAt: serverTimestamp(),
    });

    setProfile(prev => ({ ...prev, isVIP: true, tier: `${selectedVIP}VIP` }));
    toast.success(`${selectedVIP} VIP Activated! ${newMax} tasks/day unlocked!`);
    setShowVIPModal(false);
    setIsProcessing(false);
    setSelectedVIP('');
    setMpesaNumber('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usd = parseFloat(amount);
    if (isNaN(usd) || usd <= 0) return toast.error('Enter valid amount');

    // Use onboarding task completion as verification
    const hasCompletedOnboarding = profile?.hasDoneOnboardingTask || false;
    const tasksDone = profile?.ApprovedTasks || 0;
    
    // Calculate amount after fee
    const feeAmount = (usd * FEE_PERCENTAGE) / 100;
    const amountAfterFee = usd - feeAmount;
    
    // Check if amount after fee is at least $10
    const amountValid = amountAfterFee >= MIN_WITHDRAWAL_USD && balance >= usd;
    const tasksValid = tasksDone >= MIN_COMPLETED_TASKS;

    if (!hasCompletedOnboarding || !amountValid || !tasksValid) {
      setEligibility({ 
        kycComplete: hasCompletedOnboarding, 
        minAmount: amountValid, 
        minTasks: tasksValid 
      });
      setShowModal(true);
      return;
    }

    if (method === 'mpesa') {
      const normalized = normalizeMpesa(phone);
      if (!normalized) return toast.error('Invalid M-Pesa number');
      setPhone(normalized);
    }
    if (method === 'paypal' && !paypalEmail.includes('@')) {
      return toast.error('Invalid PayPal email');
    }
    if (method === 'bank') {
      const { bankName, accountName, accountNumber } = bankDetails;
      if (!bankName || !accountName || !accountNumber) {
        return toast.error('Complete bank details');
      }
    }

    setLoading(true);
    try {
      // DOUBLE-CHECK BALANCE BEFORE DEDUCTING
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      const currentBalance = userSnap.data()?.currentbalance || 0;

      if (currentBalance < usd) {
        toast.error('Insufficient balance');
        setLoading(false);
        return;
      }

      const withdrawalId = `${user.uid}_${Date.now()}`;
      const payload = {
        userId: user.uid,
        name: profile.name || user.displayName || 'User',
        email: user.email,
        amount: usd,
        method,
        status: 'pending',
        requestedAt: serverTimestamp(),
      };

      if (method === 'mpesa') payload.phone = normalizeMpesa(phone);
      if (method === 'paypal') payload.paypalEmail = paypalEmail;
      if (method === 'bank') payload.bankDetails = bankDetails;

      console.log('💸 Creating withdrawal:', payload);
      await setDoc(doc(db, 'withdrawals', withdrawalId), payload);
      await updateDoc(userDoc, { currentbalance: increment(-usd) });

      // Start animated success process
      const withdrawalInfo = {
        id: withdrawalId,
        amount: usd,
        method,
        fee: feeAmount,
        receive: amountAfterFee,
        phone: method === 'mpesa' ? phone : null,
        email: method === 'paypal' ? paypalEmail : null,
        bankDetails: method === 'bank' ? bankDetails : null,
        timestamp: new Date(),
      };

      startWithdrawalAnimation(withdrawalInfo);
      resetForm();
      setAmount('');
    } catch (err) {
      console.error('❌ Withdrawal error:', err);
      toast.error('Failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaypalEmail('');
    setBankDetails({ bankName: '', accountName: '', accountNumber: '', swiftCode: '' });
  };

  const fee = amount ? (parseFloat(amount) * FEE_PERCENTAGE) / 100 : 0;
  const receive = amount ? parseFloat(amount) - fee : 0;

  // Check if all requirements are met
  const allRequirementsMet = eligibility.kycComplete && eligibility.minAmount && eligibility.minTasks;

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-blue-100">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-center" theme="light" autoClose={3000} />
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} gravity={0.3} />}

      {/* Animated Success Modal */}
      {showSuccessModal && withdrawalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-amber-200/30 relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-emerald-400/5 to-blue-400/5 animate-pulse" />
            
            {/* Animated Content */}
            <div className="relative z-10 text-center">
              {/* Step 1: Processing */}
              {animationStep === 0 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-200">
                    <Zap className="w-10 h-10 text-blue-600 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Processing Withdrawal</h3>
                  <p className="text-slate-600 mb-6">Setting up your payment...</p>
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}

              {/* Step 2: Approved */}
              {animationStep === 1 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
                    <BadgeCheck className="w-10 h-10 text-green-600 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Payment Approved!</h3>
                  <p className="text-slate-600 mb-6">Funds are being transferred...</p>
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Step 3: Completed */}
              {animationStep === 2 && (
                <div className="animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <PartyPopper className="w-10 h-10 text-white animate-tada" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Success! 🎉</h3>
                  <p className="text-slate-600 mb-2">Withdrawal processed successfully</p>
                  
                  {/* Payment Details */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-emerald-200 mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-600">Amount:</span>
                      <span className="text-2xl font-black text-emerald-600">
                        ${withdrawalData.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Fee (2%):</span>
                      <span className="text-red-500">-${withdrawalData.fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-500">You receive:</span>
                      <span className="font-bold text-slate-900">${withdrawalData.receive.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500">
                        {withdrawalData.method === 'mpesa' && `To: ${withdrawalData.phone}`}
                        {withdrawalData.method === 'paypal' && `To: ${withdrawalData.email}`}
                        {withdrawalData.method === 'bank' && `To: ${withdrawalData.bankDetails?.bankName}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Expected: {withdrawalData.method === 'mpesa' ? 'Instant' : '24-48 hours'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition transform hover:scale-[1.02]"
                    >
                      Continue Earning
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Final Step: Celebration */}
              {animationStep === 3 && (
                <div className="animate-fade-in">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                    <Rocket className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3">You're Amazing! 🚀</h3>
                  <p className="text-slate-600 mb-4">Your funds are on the way!</p>
                  
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white mb-6">
                    <p className="font-bold text-lg">${withdrawalData.receive.toFixed(2)}</p>
                    <p className="text-sm opacity-90">Coming to your {withdrawalData.method} soon</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Transaction ID: {withdrawalData.id.slice(-8)}</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>

                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold py-4 rounded-xl hover:shadow-xl transition transform hover:scale-[1.02] animate-bounce"
                  >
                    Start Another Task!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIP Upgrade Modal */}
      {showVIPModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-amber-200/50">

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Upgrade to VIP
                </h2>
              </div>
              <button 
                onClick={() => setShowVIPModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Value Props */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 mb-5 text-center">
              <p className="text-sm font-semibold text-amber-900">
                <span className="text-lg">Earn 3–4× more daily • Faster withdrawals</span>
              </p>
            </div>

            {/* VIP Tiers */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(VIP_CONFIG).map(([tier, config]) => {
                const isSelected = selectedVIP === tier;
                const isRecommended = tier === 'Silver';

                return (
                  <label
                    key={tier}
                    className={`relative cursor-pointer rounded-xl border-2 transition-all p-4 text-center
                      ${isSelected 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg' 
                        : 'border-slate-300 bg-white hover:border-amber-400'
                      }`}
                  >
                    <input
                      type="radio"
                      name="vipTier"
                      value={tier}
                      checked={isSelected}
                      onChange={(e) => {
                        setSelectedVIP(e.target.value);
                        setTimeout(() => document.getElementById('mpesa-input')?.focus(), 100);
                      }}
                      className="sr-only"
                    />

                    {isRecommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}

                    <Crown className={`w-7 h-7 mx-auto mb-1 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                    
                    <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {tier}
                    </p>
                    
                    <p className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      ${config.priceUSD}
                    </p>
                    
                    <p className={`text-sm font-bold mt-1 ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                      {formatKES(config.priceUSD)}
                    </p>
                    
                    <p className={`text-xs font-medium mt-2 ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                      {config.dailyTasks} tasks/day
                    </p>
                  </label>
                );
              })}
            </div>

            {/* Final Confirmation */}
            {selectedVIP && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-center mb-5">
                <p className="text-sm font-medium text-slate-700">You will pay</p>
                <p className="text-2xl font-black text-emerald-600">
                  {formatKES(VIP_CONFIG[selectedVIP].priceUSD)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Rate: 1 USD = {getCurrentExchangeRate().toFixed(2)} KES
                </p>
              </div>
            )}

            {/* M-Pesa Input + Pay Button */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  M-Pesa Number
                </label>
                <input
                  id="mpesa-input"
                  type="tel"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  placeholder="0712345678"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-400/20 transition-all text-base"
                />
              </div>

              <button
                onClick={handleRealVIPUpgrade}
                disabled={isProcessing || !selectedVIP || !isValidMpesaNumber(mpesaNumber)}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  selectedVIP && isValidMpesaNumber(mpesaNumber)
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg active:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                } ${isProcessing ? 'opacity-90' : ''}`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Pay {selectedVIP ? formatKES(VIP_CONFIG[selectedVIP].priceUSD) : ''} Now
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500">
                Secure • Instant Access • Money-Back Guarantee
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-xl font-bold text-slate-900">Withdrawal Requirements</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-5">
              <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Withdrawal Status: Available anytime once all requirements are met
              </p>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Complete these simple steps to unlock your earnings. You're making great progress!
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {eligibility.kycComplete ? (
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Identity Verification (Onboarding)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eligibility.kycComplete 
                      ? "✓ Your identity has been verified" 
                      : "Complete the onboarding task to verify your identity"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {eligibility.minAmount ? (
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Payout Threshold
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eligibility.minAmount
                      ? `✓ You have the required minimum amount`
                      : `You must have at least ${(MIN_WITHDRAWAL_USD / (1 - FEE_PERCENTAGE / 100)).toFixed(2)} to receive ${MIN_WITHDRAWAL_USD.toFixed(2)} after fees. (Current Balance: ${balance.toFixed(2)})`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {eligibility.minTasks ? (
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Task Completion</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eligibility.minTasks
                      ? `✓ You have completed the required number of tasks`
                      : `Complete at least ${MIN_COMPLETED_TASKS} tasks to qualify. (${profile?.ApprovedTasks || 0}/${MIN_COMPLETED_TASKS})`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
              >
                Close
              </button>
              
              {!allRequirementsMet && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowVIPModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold py-3 rounded-xl hover:shadow-lg transition"
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-100 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {/* Header with VIP Upgrade Option */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Withdraw Earnings</h1>
              <p className="text-blue-100">Fast, secure payouts — available daily</p>
            </div>
            
            {!profile?.isVIP && (
              <button
                onClick={() => setShowVIPModal(true)}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Upgrade to VIP
              </button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <div>
                    <p className="text-sm text-slate-600">Available Balance</p>
                    <p className="text-3xl font-black text-slate-900">${balance.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{formatKES(balance)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-amber-500" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Amount (USD) – Min ${MIN_WITHDRAWAL_USD.toFixed(2)} after 2% fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-amber-400 focus:ring focus:ring-amber-200 transition"
                      placeholder="10.21"
                      min="0.01"
                      max={balance}
                    />
                    {amount && parseFloat(amount) > 0 && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${
                        receive >= MIN_WITHDRAWAL_USD ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className="flex justify-between">
                          <span>Amount Entered</span>
                          <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Fee (2%)</span>
                          <span className="font-medium">-${fee.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${
                          receive >= MIN_WITHDRAWAL_USD ? 'text-green-700' : 'text-red-700'
                        }`}>
                          <span>You Receive</span>
                          <span>${receive.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">≈ {formatKES(receive)}</p>
                        {receive < MIN_WITHDRAWAL_USD && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            ⚠ Amount after fee must be at least ${MIN_WITHDRAWAL_USD.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[10.21, 25, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val.toFixed(2))}
                        disabled={val > balance}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 transition"
                      >
                        ${val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(balance.toFixed(2))}
                      className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 rounded-lg text-sm font-bold hover:shadow transition"
                    >
                      Max
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'green' },
                        { id: 'paypal', label: 'PayPal', icon: CreditCard, color: 'blue' },
                        { id: 'bank', label: 'Bank', icon: Building2, color: 'purple' },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <label
                            key={opt.id}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                              method === opt.id
                                ? `border-${opt.color}-500 bg-${opt.color}-50`
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <input
                              type="radio"
                              name="method"
                              value={opt.id}
                              checked={method === opt.id}
                              onChange={(e) => setMethod(e.target.value)}
                              className="sr-only"
                            />
                            <Icon className={`w-6 h-6 mb-1 ${method === opt.id ? `text-${opt.color}-600` : 'text-slate-600'}`} />
                            <span className="text-xs font-medium">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {method === 'mpesa' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        M-Pesa Number (07xx, +2547xx, etc.)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0712345678"
                        className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring focus:ring-green-200"
                      />
                    </div>
                  )}

                  {method === 'paypal' && (
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="you@paypal.com"
                      className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:ring focus:ring-blue-200"
                    />
                  )}

                  {method === 'bank' && (
                    <div className="space-y-3">
                      {['bankName', 'accountName', 'accountNumber', 'swiftCode'].map((field) => (
                        <input
                          key={field}
                          type="text"
                          value={bankDetails[field]}
                          onChange={(e) =>
                            setBankDetails({ ...bankDetails, [field]: e.target.value })
                          }
                          placeholder={
                            field === 'swiftCode' ? 'SWIFT (optional)' : field.replace(/([A-Z])/g, ' $1').trim()
                          }
                          className="w-full px-4 py-3 border-2 border-purple-400 rounded-lg focus:ring focus:ring-purple-200"
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold py-4 rounded-xl hover:shadow-xl transform hover:scale-[1.02] transition disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* User Info Card */}
              <div className="bg-white p-5 rounded-2xl shadow border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {profile?.name?.[0] ?? <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{profile?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{profile?.tier || 'Standard'}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1 text-slate-600">
                  <p>Tasks Completed: <strong>{profile?.ApprovedTasks || 0}</strong></p>
                  <p>Status: <strong className={profile?.isVIP ? 'text-amber-600' : 'text-slate-600'}>
                    {profile?.isVIP ? 'VIP Member' : 'Standard'}
                  </strong></p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow border border-slate-200">
                <h3 className="font-bold flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-amber-500" /> Payout Schedule
                </h3>
                <div className="text-sm space-y-1 text-slate-600">
                  <p>M-Pesa: <strong>Instant</strong></p>
                  <p>PayPal: <strong>24–48 hrs</strong></p>
                  <p>Bank: <strong>2–3 days</strong></p>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" /> Requirements
                </h3>
                <ul className="text-xs space-y-1 text-slate-700">
                  <li>• Complete <strong>onboarding task</strong></li>
                  <li>• Min <strong>${MIN_WITHDRAWAL_USD.toFixed(2)} after fee</strong></li>
                  <li>• Complete <strong>{MIN_COMPLETED_TASKS} tasks</strong></li>
                  <li>• Available <strong>daily</strong></li>
                </ul>
              </div>

              {/* Recent Withdrawals Section */}
              <div className="bg-white p-5 rounded-2xl shadow border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold">Recent Withdrawals</h3>
                  <button
                    onClick={refreshWithdrawals}
                    disabled={refreshingWithdrawals}
                    className="p-1 hover:bg-slate-100 rounded-lg transition"
                    title="Refresh withdrawals"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshingWithdrawals ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {withdrawals.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">${w.amount?.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">{formatKES(w.amount)}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {w.method === 'mpesa' && w.phone 
                                ? `M-Pesa •••${w.phone?.slice(-4)}`
                                : w.method === 'paypal' && w.paypalEmail
                                ? `PayPal •••@${w.paypalEmail?.split('@')[1]}`
                                : w.method === 'bank' && w.bankDetails
                                ? `Bank •••${w.bankDetails?.accountNumber?.slice(-4)}`
                                : w.method}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {w.requestedAt?.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="ml-2">
                            {getStatusIcon(w.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm mb-2">No withdrawals yet</p>
                    <p className="text-xs text-slate-400">
                      Your withdrawal history will appear here
                    </p>
                    <button
                      onClick={refreshWithdrawals}
                      className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawPage;