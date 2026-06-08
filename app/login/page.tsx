'use client';

/**
 * UNIFIED AUTH PAGE - SIGN IN & SIGN UP
 * Premium SaaS authentication with role-based redirect
 * Handles both vendor and admin authentication
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AUTH] Checking existing session...');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('[AUTH] ✅ Existing session found for:', session.user.email);
          
          // Fetch profile for redirect
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profileError || !profile) {
              console.warn('[AUTH] Profile fetch error during redirect:', profileError);
              router.push('/dashboard/vendor');
              return;
            }

            const userRole = profile.role || 'vendor';
            console.log('[AUTH] ✅ User role:', userRole);

            if (userRole === 'admin') {
              console.log('[AUTH] ✅ Redirecting to admin dashboard');
              router.push('/dashboard/admin');
            } else {
              console.log('[AUTH] ✅ Redirecting to vendor dashboard');
              router.push('/dashboard/vendor');
            }
          } catch (err) {
            console.error('[AUTH] Redirect error:', err);
            router.push('/dashboard/vendor');
          }
        } else {
          console.log('[AUTH] No existing session');
        }
      } catch (err) {
        console.error('[AUTH] Session check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  /**
   * Redirect to appropriate dashboard based on user role
   */
  const redirectToDashboard = async (userId: string) => {
    try {
      console.log('[AUTH] Fetching user profile for redirect...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.warn('[AUTH] Profile fetch error during redirect:', profileError);
        // Default to vendor if profile doesn't exist
        router.push('/dashboard/vendor');
        return;
      }

      const userRole = profile.role || 'vendor';
      console.log('[AUTH] ✅ User role:', userRole);

      if (userRole === 'admin') {
        console.log('[AUTH] ✅ Redirecting to admin dashboard');
        router.push('/dashboard/admin');
      } else {
        console.log('[AUTH] ✅ Redirecting to vendor dashboard');
        router.push('/dashboard/vendor');
      }
    } catch (err) {
      console.error('[AUTH] Redirect error:', err);
      router.push('/dashboard/vendor');
    }
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation (only for signup)
    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle sign in
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      console.log('[AUTH] Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = formData.email.trim().toLowerCase();
      const passwordLength = formData.password.length;

      console.log('[AUTH] ===== SIGN IN ATTEMPT START =====');
      console.log('[AUTH] Email:', trimmedEmail);
      console.log('[AUTH] Password length:', passwordLength);
      console.log('[AUTH] Supabase configured:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      // Attempt sign in
      console.log('[AUTH] Calling supabase.auth.signInWithPassword...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: formData.password,
      });

      console.log('[AUTH] Response received from signInWithPassword');

      // Handle errors with comprehensive error detection
      if (signInError) {
        // Check for empty error object
        if (Object.keys(signInError).length === 0) {
          console.error('[AUTH] ⚠️ Empty error object received!', {
            raw: signInError,
            keys: Object.keys(signInError),
          });
          throw new Error(
            'Authentication error: Unable to process request. Please check your credentials and try again.'
          );
        }

        console.error('[AUTH] ❌ Sign-in error:', {
          message: signInError.message,
          status: (signInError as any).status,
          code: (signInError as any).code,
          details: (signInError as any).__isAuthError,
        });

        // Specific error messages
        if (
          signInError.message?.includes('Invalid login credentials') ||
          signInError.message?.includes('invalid credentials')
        ) {
          setError('Email or password is incorrect. Please try again.');
        } else if (signInError.message?.includes('Email not confirmed')) {
          setError('Please verify your email address first.');
        } else if (signInError.message?.includes('User not found')) {
          setError('This email address is not registered. Please sign up first.');
        } else if (signInError.message?.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(signInError.message || 'An authentication error occurred.');
        }

        setLoading(false);
        return;
      }

      // Check for user data
      if (!data?.user) {
        console.error('[AUTH] No user data returned from Supabase');
        setError('Login failed: No user data returned. Please try again.');
        setLoading(false);
        return;
      }

      console.log('[AUTH] ✅ User authenticated successfully');
      console.log('[AUTH] User ID:', data.user.id);
      console.log('[AUTH] User Email:', data.user.email);
      console.log('[AUTH] Session token:', data.session?.access_token ? 'Present' : 'Missing');

      // Fetch or create user profile
      console.log('[AUTH] Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows returned (profile doesn't exist)
        console.error('[AUTH] Profile fetch error:', profileError);
      } else if (!profile) {
        // Profile doesn't exist - create default vendor profile
        console.log('[AUTH] Profile missing - creating default vendor profile...');
        const { error: createError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            role: 'vendor',
          },
        ]);

        if (createError) {
          console.warn('[AUTH] Profile creation failed (non-blocking):', createError);
        } else {
          console.log('[AUTH] ✅ Default vendor profile created');
        }
      }

      console.log('[AUTH] ✅ Sign-in successful');
      console.log('[AUTH] ===== SIGN IN ATTEMPT COMPLETE =====');

      // Redirect to appropriate dashboard
      await redirectToDashboard(data.user.id);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      console.error('[AUTH] Unexpected error:', err);
      setError(errorMsg);
      setLoading(false);
    }
  };

  /**
   * Handle sign up
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      console.log('[AUTH] Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = formData.email.trim().toLowerCase();

      console.log('[AUTH] ===== SIGN UP ATTEMPT START =====');
      console.log('[AUTH] Email:', trimmedEmail);

      // Attempt sign up
      console.log('[AUTH] Calling supabase.auth.signUp...');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('[AUTH] ❌ Sign-up error:', signUpError);

        if (signUpError.message?.includes('User already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else if (signUpError.message?.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(signUpError.message || 'Sign-up failed. Please try again.');
        }

        setLoading(false);
        return;
      }

      console.log('[AUTH] ✅ Sign-up successful');

      if (data?.user) {
        // Auto-create vendor profile
        console.log('[AUTH] Creating vendor profile...');
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            role: 'vendor',
          },
        ]);

        if (profileError) {
          console.warn('[AUTH] Profile creation failed:', profileError);
        } else {
          console.log('[AUTH] ✅ Vendor profile created');
        }
      }

      console.log('[AUTH] ===== SIGN UP ATTEMPT COMPLETE =====');

      setSuccess(
        'Account created successfully! Please check your email to verify your address.'
      );

      // Reset form
      setFormData({ email: '', password: '', confirmPassword: '' });
      setValidationErrors({});

      // Optionally switch to sign in after delay
      setTimeout(() => {
        setMode('signin');
        setSuccess(null);
      }, 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      console.error('[AUTH] Unexpected error:', err);
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4">
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isSignIn = mode === 'signin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding & Features (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center space-y-8 px-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Receipt Pro
              </h1>
              <p className="text-xl text-slate-300">
                Generate, Manage & Send Professional Receipts Instantly
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              {[
                { icon: '✨', title: 'Smart Receipts', desc: 'Auto-generate beautiful PDFs' },
                {
                  icon: '📊',
                  title: 'Analytics',
                  desc: 'Track all your transactions',
                },
                { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
                { icon: '⚡', title: 'Fast', desc: 'Lightning quick processing' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-auto"
          >
            {/* Glassmorphism card */}
            <div className="relative group">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000" />

              <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl space-y-6">
                {/* Tab buttons */}
                <div className="flex space-x-2 bg-slate-800/30 p-1 rounded-lg">
                  {['signin', 'signup'].map((tab) => (
                    <motion.button
                      key={tab}
                      onClick={() => {
                        setMode(tab as AuthMode);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                        mode === tab
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tab === 'signin' ? 'Sign In' : 'Create Account'}
                    </motion.button>
                  ))}
                </div>

                {/* Header */}
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-bold text-white">
                    {isSignIn ? 'Welcome back' : 'Get started'}
                  </h2>
                  <p className="text-slate-400">
                    {isSignIn
                      ? 'Sign in to your account to continue'
                      : 'Create a new account to get started'}
                  </p>
                </div>

                {/* Success message */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-start space-x-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-400">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-start space-x-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
                  {/* Email field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                      Email address
                    </label>
                    <motion.input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setValidationErrors({ ...validationErrors, email: '' });
                      }}
                      required
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.email
                          ? 'border-red-500/50 focus:ring-red-500'
                          : 'border-slate-700/50'
                      }`}
                      whileFocus={{ scale: 1.02 }}
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-400">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <div className="relative">
                      <motion.input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setValidationErrors({ ...validationErrors, password: '' });
                        }}
                        required
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.password
                            ? 'border-red-500/50 focus:ring-red-500'
                            : 'border-slate-700/50'
                        }`}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-red-400">{validationErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm password field (signup only) */}
                  {!isSignIn && (
                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-slate-200"
                      >
                        Confirm password
                      </label>
                      <div className="relative">
                        <motion.input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            setValidationErrors({ ...validationErrors, confirmPassword: '' });
                          }}
                          required
                          placeholder="••••••••"
                          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-lg text-white placeholder-slate-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.confirmPassword
                              ? 'border-red-500/50 focus:ring-red-500'
                              : 'border-slate-700/50'
                          }`}
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </motion.button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {/* Remember me / Forgot password */}
                  {isSignIn && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span>Remember me</span>
                      </label>
                      <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-2 mt-6 shadow-lg hover:shadow-blue-500/50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isSignIn ? 'Sign in' : 'Create account'}</span>
                  </motion.button>
                </form>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-700/30 text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      onClick={() => {
                        setMode(isSignIn ? 'signup' : 'signin');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-medium transition"
                    >
                      {isSignIn ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>

                  <Link
                    href="/"
                    className="block text-sm text-slate-400 hover:text-slate-200 transition"
                  >
                    ← Back to home
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
