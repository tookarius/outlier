import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Referral code: AB1234C
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) {
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength
  const getPasswordStrength = () => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Weak', color: 'text-red-500' };
    if (password.length < 10) return { text: 'Medium', color: 'text-amber-500' };
    return { text: 'Strong', color: 'text-green-500' };
  };

  // Validate phone (kept generic – you can tighten later)
  const isValidPhone = (num) => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // === Validation ===
    if (!name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting signup for:', email.trim());

      const signupProcess = async () => {
        // Step 1: Create Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        console.log('Auth success! UID:', user.uid);

        // Step 2: Minimal Firestore write
        const role = email.trim() === 'workfromhome.onlinepay@gmail.com' ? 'admin' : 'user';
        const referralCode = generateReferralCode();

        await setDoc(doc(db, 'users', user.uid), {
          createdAt: serverTimestamp(),
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: phone.trim(),
          referralCode,
          role,
        });

        console.log('Firestore write success!');
        return user;
      };

      // 20-second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 20000)
      );

      await Promise.race([signupProcess(), timeoutPromise]);

      toast.success('Account created! Welcome to Outlier AI!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed:', err.code, err.message);
      let msg = 'Failed to create account. Please try again.';

      if (err.message === 'Request timeout') {
        msg = 'Connection timeout. Account created! Login to Outlier AI or Retry.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already registered. Try signing in.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'No internet connection. Connect and retry.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait 2 minutes.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password too weak. Use 6+ characters.';
      } else if (err.code && err.code.includes('firestore')) {
        msg = 'Database error. Please contact support.';
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">

        {/* Left Side – Hero */}
        <div className="text-white space-y-8">
          <div className="flex items-center space-x-3">
            <div className="text-4xl font-black text-amber-400">Outlier AI</div>
            <span className="text-sm bg-amber-400/20 px-3 py-1 rounded-full">by ComoAI Labs</span>
          </div>

          <h1 className="text-5xl font-black leading-tight">
            Start Earning<br />
            <span className="text-amber-400">$15–$50/hour</span><br />
            Today
          </h1>

          <p className="text-xl text-blue-100 leading-relaxed">
            Join 50,000+ members training AI from home. No experience needed.
            Complete your first paid task in under 10 minutes.
          </p>

          <div className="space-y-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between text-sm">
              <span>First task payout</span>
              <span className="font-bold text-amber-400">$18–$35</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Time to complete</span>
              <span className="font-bold">6–12 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Available now</span>
              <span className="font-bold text-green-400">3,124 tasks</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Paid weekly via PayPal, Bank or Crypto
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Right Side – Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-amber-400/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800">Create Your Free Account</h2>
            <p className="text-gray-600 mt-2">Takes less than 2 minutes</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 border border-red-200 animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
              {password && (
                <span className={`absolute right-4 top-3.5 text-xs font-medium ${getPasswordStrength().color}`}>
                  {getPasswordStrength().text}
                </span>
              )}
            </div>

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black text-xl py-5 rounded-xl hover:shadow-2xl transform hover:scale-105 transition disabled:opacity-60 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-4 border-white"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-amber-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;