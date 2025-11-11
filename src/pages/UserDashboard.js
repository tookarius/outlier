// src/pages/UserDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  DollarSign,
  Calendar,
  Activity,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Crown,
  Smartphone,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import Confetti from 'react-confetti';
import 'react-toastify/dist/ReactToastify.css';
import availableTasks from '../data/availableTasks';
import { useAuth } from '../context/AuthContext';


const EXCHANGE_RATE = 129.55; // 1 USD = 129.55 KES
const formatKES = (usd) =>
  `Ksh.${(usd * EXCHANGE_RATE)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const vipPlans = {
  Bronze: { priceUSD: 10 },
  Silver: { priceUSD: 20 },
  Gold: { priceUSD: 50 },
};

const getNextThursday = () => {
  const now = new Date();
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 7));
  thursday.setHours(23, 59, 59, 0);
  return thursday;
};

const formatTime = (ms) => {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${days}d ${hours}h ${minutes}m`;
};

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-100 text-purple-700 border-purple-200',
  Expert: 'bg-red-100 text-red-700 border-red-200',
};

const statusConfig = {
  'in-progress': {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  completed: {
    label: 'Under Review',
    icon: RefreshCw,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
};

/* ────────────────────── Phone helpers ────────────────────── */
const normalizePhoneNumber = (input) => {
  if (!input) return null;
  const cleaned = input.replace(/\D/g, '');

  if ((input.startsWith('07') || input.startsWith('01')) && cleaned.length === 10) {
    return `254${cleaned.slice(1)}`;
  }
  if (input.startsWith('+254') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  return null;
};

const isValidMpesaNumber = (input) =>
  /^0[17]\d{8}$/.test(input) || /^\+254[17]\d{8}$/.test(input);

/* ────────────────────── Main Component ────────────────────── */
const UserDashboard = () => {
  const { currentUser } = useAuth();               // <-- fixed
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [dailyTasksRemaining, setDailyTasksRemaining] = useState(2);
  const [myTasks, setMyTasks] = useState([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVIP, setSelectedVIP] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getNextThursday() - new Date());

  /* ────── Payout countdown ────── */
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = getNextThursday() - new Date();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ────── Load profile + daily-task reset ────── */
  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setUserProfile(data);

      const today = new Date().toDateString();
      const lastReset = data.lastTaskResetDate?.toDate?.()?.toDateString();
      const isVIP = data.isVIP || false;
      const vipTiers = { Bronze: 10, Silver: 20, Gold: 50 };
      const maxTasks = isVIP ? vipTiers[data.vipTier] || 10 : 2;

      if (lastReset !== today) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          dailyTasksRemaining: maxTasks,
          lastTaskResetDate: serverTimestamp(),
        });
        setDailyTasksRemaining(maxTasks);
      } else {
        setDailyTasksRemaining(data.dailyTasksRemaining ?? maxTasks);
      }
    });

    // Load local myTasks
    const saved = localStorage.getItem(`myTasks_${currentUser.uid}`);
    if (saved) setMyTasks(JSON.parse(saved));

    return () => unsub();
  }, [currentUser]);

  /* ────── Persist myTasks to localStorage ────── */
  useEffect(() => {
    if (currentUser && myTasks.length) {
      localStorage.setItem(`myTasks_${currentUser.uid}`, JSON.stringify(myTasks));
    }
  }, [myTasks, currentUser]);

  /* ────── Auto-approval simulation ────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setMyTasks((prev) => {
        let changed = false;
        const updated = prev.map((task) => {
          // Schedule approval if not yet scheduled
          if (task.status === 'completed' && !task.approvalScheduled) {
            task.approvalScheduled = Date.now() + (Math.random() * 240000 + 60000);
            changed = true;
          }

          // Actually approve when time is up
          if (
            task.approvalScheduled &&
            Date.now() >= task.approvalScheduled &&
            task.status !== 'approved'
          ) {
            task.status = 'approved';
            task.approvedAt = new Date();
            changed = true;

            updateDoc(doc(db, 'users', currentUser.uid), {
              balance: increment(task.paymentAmount),
              thisMonthEarned: increment(task.paymentAmount),
              totalEarned: increment(task.paymentAmount),
              completedTasks: increment(1),
            });

            toast.success(`+$${task.paymentAmount.toFixed(2)} approved!`, {
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }
          return task;
        });

        if (changed) {
          localStorage.setItem(`myTasks_${currentUser.uid}`, JSON.stringify(updated));
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  /* ────── Start a fresh task ────── */
  const startTask = async (task) => {
    const vipTiers = { Bronze: 10, Silver: 20, Gold: 50 };
    const maxAllowed = userProfile?.isVIP
      ? vipTiers[userProfile.vipTier] || 10
      : 2;

    const usedToday = myTasks.filter(
      (t) => new Date(t.startedAt).toDateString() === new Date().toDateString()
    ).length;

    if (usedToday >= maxAllowed) {
      setShowVIPModal(true);
      return;
    }

    const newTask = {
      id: `${task.id}_${Date.now()}`, // unique per attempt
      ...task,
      status: 'in-progress',
      startedAt: new Date(),
      completedQuestions: 0,
      totalQuestions: task.questions.length,
    };

    setMyTasks((prev) => [...prev, newTask]);
    setDailyTasksRemaining((prev) => Math.max(0, prev - 1));

    toast.success('Task started', {
      icon: <Briefcase className="w-5 h-5 text-blue-600" />,
    });

    // NEW: use URL param route
    navigate(`/working/${task.id}`);
  };

  /* ────── VIP Upgrade with STK Push ────── */
  const handleRealVIPUpgrade = async () => {
    if (!selectedVIP) return toast.error('Select a VIP tier');
    const normalized = normalizePhoneNumber(mpesaNumber);
    if (!normalized || !isValidMpesaNumber(mpesaNumber))
      return toast.error('Invalid M-Pesa number');

    setIsProcessing(true);
    const clientReference = `VIP_${currentUser.uid}_${Date.now()}`;
    const amount = vipPlans[selectedVIP].priceUSD;
    let poll = null;

    try {
      const init = await fetch('/api/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalized,
          amount,
          reference: clientReference,
        }),
      });
      const { success, payheroReference, error } = await init.json();

      if (!success) throw new Error(error || 'STK push failed');
      if (!payheroReference) throw new Error('Missing PayHero reference');

      toast.info(`STK push sent to ${mpesaNumber}…`, { autoClose: 5000 });

      poll = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/transaction-status?reference=${encodeURIComponent(payheroReference)}`
          );
          const { success, status, error } = await statusRes.json();

          if (!success) throw new Error(error);

          if (status === 'SUCCESS') {
            clearInterval(poll);
            toast.success('Payment confirmed!');
            await finalizeVIPUpgrade();
          } else if (['FAILED', 'CANCELLED'].includes(status)) {
            clearInterval(poll);
            toast.error('Payment failed');
            setIsProcessing(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);

      // timeout after 2 min
      setTimeout(() => {
        if (poll) {
          clearInterval(poll);
          if (isProcessing) {
            toast.warn('Payment timed out');
            setIsProcessing(false);
          }
        }
      }, 120_000);
    } catch (e) {
      toast.error(e.message || 'Upgrade failed');
      setIsProcessing(false);
    }
  };

  const finalizeVIPUpgrade = async () => {
    const tasksMap = { Bronze: 10, Silver: 20, Gold: 50 };
    const newMax = tasksMap[selectedVIP];

    await updateDoc(doc(db, 'users', currentUser.uid), {
      isVIP: true,
      vipTier: selectedVIP,
      dailyTasksRemaining: newMax,
      lastTaskResetDate: serverTimestamp(),
      vipUpgradedAt: serverTimestamp(),
    });

    setDailyTasksRemaining(newMax);
    setUserProfile((p) => ({ ...p, isVIP: true, vipTier: selectedVIP }));

    toast.success(`${selectedVIP} VIP activated! ${newMax} tasks/day unlocked!`, {
      icon: <Crown className="w-6 h-6 text-amber-500" />,
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
    setShowVIPModal(false);
    setSelectedVIP('');
    setMpesaNumber('');
    setIsProcessing(false);
  };

  /* ────── Guard: no user → login ────── */
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-blue-100">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  /* ────── Today’s stats ────── */
  const todayTasks = myTasks.filter(
    (t) => new Date(t.startedAt).toDateString() === new Date().toDateString()
  );
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const approvedCount = todayTasks.filter((t) => t.status === 'approved').length;
  const todayEarnings = todayTasks
    .filter((t) => t.status === 'approved')
    .reduce((s, t) => s + t.paymentAmount, 0);

  const categories = ['all', ...new Set(availableTasks.map((t) => t.category))];
  const filteredTasks =
    selectedCategory === 'all'
      ? availableTasks
      : availableTasks.filter((t) => t.category === selectedCategory);

  const myTaskMap = {};
  myTasks.forEach((t) => {
    const originalId = t.id.split('_')[0];
    myTaskMap[originalId] = t;
  });

  /* ────── Render ────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.3} />}

      {/* ── Header ── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-amber-400/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900">Outlier AI</h1>
                  <p className="text-xs text-slate-500">AI Training Platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center justify-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.name?.[0] ?? 'U'}
                </div>
                <div className="ml-2 text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {userProfile?.name ?? 'User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {userProfile?.vipTier ? `${userProfile.vipTier} VIP` : 'Standard'}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  auth.signOut().then(() => {
                    localStorage.clear();
                    navigate('/signin');
                  })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance + Next Payout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-400/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Available Balance</p>
                <h2 className="text-5xl font-black text-slate-800">
                  ${(userProfile?.balance ?? 0).toFixed(2)}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{formatKES(userProfile?.balance ?? 0)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="font-medium">
                +${(userProfile?.thisMonthEarned ?? 0).toFixed(2)} this month
              </span>
            </div>

            <button
              onClick={() => navigate('/withdraw')}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-lg py-4 rounded-xl hover:shadow-2xl transform hover:scale-105 transition"
            >
              Withdraw Funds
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-amber-400/20 text-center">
            <Calendar className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-xs text-slate-600 mb-1">Next Payout</p>
            <p className="text-2xl font-bold text-slate-800">{formatTime(timeLeft)}</p>
            <p className="text-xs text-slate-500 mt-1">Every Thursday</p>
          </div>
        </div>

        {/* Today’s quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-amber-400/20 text-center">
            <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Today’s Earnings</p>
            <p className="text-2xl font-bold text-green-600">${todayEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-amber-400/20 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Tasks Completed</p>
            <p className="text-2xl font-bold text-slate-800">{approvedCount}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-amber-400/20 text-center">
            <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Under Review</p>
            <p className="text-2xl font-bold text-orange-500">{completedCount}</p>
          </div>
        </div>

        {/* Available Tasks */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-amber-400/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Available Tasks
            </h3>
            <span className="text-sm text-slate-500">{filteredTasks.length} tasks</span>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-sm'
                    : 'bg-white/80 text-slate-600 border border-slate-300 hover:bg-white'
                }`}
              >
                {cat === 'all' ? 'All Tasks' : cat}
              </button>
            ))}
          </div>

          {/* Task cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => {
              const myTask = myTaskMap[task.id];
              const isDone = myTask && ['completed', 'approved'].includes(myTask.status);
              const isInProgress = myTask?.status === 'in-progress';
              const cfg = myTask ? statusConfig[myTask.status] : null;
              const Icon = cfg?.icon;

              return (
                <div
                  key={task.id}
                  className={`bg-white/80 rounded-2xl p-5 border transition-all group ${
                    isDone
                      ? 'border-slate-200 opacity-70 bg-slate-50'
                      : 'border-slate-200 hover:border-amber-400 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${difficultyColors[task.difficulty]}`}
                    >
                      {task.difficulty}
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">${task.paymentAmount}</div>
                      <div className="text-xs text-slate-500">{task.duration}</div>
                    </div>
                  </div>

                  {myTask && cfg && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 w-fit ${cfg.bg} ${cfg.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                  )}

                  <h4
                    className={`font-semibold mb-3 line-clamp-2 transition ${
                      isDone ? 'text-slate-500' : 'text-slate-900 group-hover:text-amber-600'
                    }`}
                  >
                    {task.title}
                  </h4>

                  <button
                    onClick={() =>
                      isInProgress
                        ? navigate(`/working/${task.id}`)               // resume
                        : startTask(task)                                 // fresh start
                    }
                    disabled={isDone || dailyTasksRemaining === 0}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isDone
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : dailyTasksRemaining > 0
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isDone
                      ? 'Completed'
                      : isInProgress
                      ? (
                          <>
                            CONTINUE <ChevronRight className="w-4 h-4" />
                          </>
                        )
                      : dailyTasksRemaining > 0
                      ? (
                          <>
                            START TASK <ChevronRight className="w-4 h-4" />
                          </>
                        )
                      : 'Upgrade to VIP'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── VIP Modal ── */}
      {showVIPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-amber-400/20 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Upgrade to VIP</h2>
              <button onClick={() => setShowVIPModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 mb-6">
              Choose your tier and enter your M-Pesa number to receive an STK push.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { tier: 'Bronze', tasks: 10, priceUSD: 10, color: 'from-amber-400 to-orange-500' },
                { tier: 'Silver', tasks: 20, priceUSD: 20, color: 'from-slate-400 to-slate-600' },
                { tier: 'Gold', tasks: 50, priceUSD: 50, color: 'from-yellow-400 to-amber-600' },
              ].map((p) => (
                <label
                  key={p.tier}
                  className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                    selectedVIP === p.tier
                      ? `border-amber-500 bg-gradient-to-br ${p.color} text-white shadow-lg`
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="vipTier"
                    value={p.tier}
                    checked={selectedVIP === p.tier}
                    onChange={(e) => setSelectedVIP(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Crown
                      className={`w-8 h-8 mx-auto mb-2 ${selectedVIP === p.tier ? 'text-white' : 'text-amber-500'}`}
                    />
                    <h3 className={`font-black text-lg ${selectedVIP === p.tier ? 'text-white' : 'text-slate-800'}`}>
                      {p.tier} VIP
                    </h3>
                    <p className={`text-3xl font-black my-2 ${selectedVIP === p.tier ? 'text-white' : 'text-slate-900'}`}>
                      ${p.priceUSD}
                    </p>
                    <p className={`text-sm ${selectedVIP === p.tier ? 'text-white/90' : 'text-slate-500'}`}>
                      {formatKES(p.priceUSD)}
                    </p>
                    <p className={`mt-3 font-bold ${selectedVIP === p.tier ? 'text-white' : 'text-green-600'}`}>
                      {p.tasks} Tasks/Day
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">M-Pesa Number</label>
              <input
                type="tel"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                placeholder="07..., 01..., or +254712345678"
                className="w-full px-4 py-3 rounded-xl border-2 border-green-400 focus:ring-2 focus:ring-green-400/20 transition"
              />
            </div>

            <button
              onClick={handleRealVIPUpgrade}
              disabled={isProcessing || !selectedVIP || !isValidMpesaNumber(mpesaNumber)}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                selectedVIP && isValidMpesaNumber(mpesaNumber)
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              } ${isProcessing ? 'opacity-70' : ''}`}
            >
              {isProcessing ? (
                <>Processing Payment…</>
              ) : (
                <>
                  Pay with M-Pesa <Smartphone className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              You’ll receive an STK push. Enter your PIN to complete.
            </p>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" theme="light" />
    </div>
  );
};

export default UserDashboard;