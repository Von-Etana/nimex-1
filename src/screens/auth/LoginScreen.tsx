import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PackageIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { getFriendlyErrorMessage } from '../../utils/errorHandling';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, user, profile, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Track if we've initiated a sign-in to detect stuck states
  const signInAttempted = useRef(false);
  const signInTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle automatic redirection when logged in
  useEffect(() => {
    if (user && profile) {
      // Clear loading states on successful login
      setLoading(false);
      setGoogleLoading(false);
      signInAttempted.current = false;

      // Clear any timeout
      if (signInTimeout.current) {
        clearTimeout(signInTimeout.current);
        signInTimeout.current = null;
      }

      // If there's a return url, go there
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Otherwise redirect based on role
      switch (profile.role) {
        case 'vendor':
          navigate('/vendor/dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'marketer':
          navigate('/marketer/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, profile, navigate, location]);

  // Reset loading state if user exists but profile is null (profile fetch failed or doesn't exist)
  useEffect(() => {
    if (user && !profile && !authLoading && signInAttempted.current) {
      // User is authenticated but has no profile - this could mean:
      // 1. Profile doesn't exist in Firestore
      // 2. Profile fetch failed
      setLoading(false);
      setGoogleLoading(false);
      setError('Account not found. Your profile may not exist in the system. Please contact support.');
      signInAttempted.current = false;
    }
  }, [user, profile, authLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (signInTimeout.current) {
        clearTimeout(signInTimeout.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    signInAttempted.current = true;

    // Set a timeout to prevent infinite loading state
    signInTimeout.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Sign in is taking longer than expected. Please try again.');
        signInAttempted.current = false;
      }
    }, 15000); // 15 second timeout

    const { error: signInError } = await signIn({
      email: formData.email,
      password: formData.password
    });

    if (signInError) {
      setError(getFriendlyErrorMessage(signInError));
      setLoading(false);
      signInAttempted.current = false;
      if (signInTimeout.current) {
        clearTimeout(signInTimeout.current);
        signInTimeout.current = null;
      }
    }
    // Navigation will be handled by the useEffect above when user/profile state updates
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    signInAttempted.current = true;

    // Set a timeout to prevent infinite loading state
    signInTimeout.current = setTimeout(() => {
      if (googleLoading) {
        setGoogleLoading(false);
        setError('Sign in is taking longer than expected. Please try again.');
        signInAttempted.current = false;
      }
    }, 15000); // 15 second timeout

    // For login, we use 'buyer' as default role - existing users will keep their role
    const { error: googleError } = await signInWithGoogle('buyer');

    if (googleError) {
      setError(getFriendlyErrorMessage(googleError));
      setGoogleLoading(false);
      signInAttempted.current = false;
      if (signInTimeout.current) {
        clearTimeout(signInTimeout.current);
        signInTimeout.current = null;
      }
    }
    // Navigation will be handled by the useEffect above
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-12 flex flex-col justify-center items-center text-white">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <PackageIcon className="w-10 h-10 text-white" />
            </div>
            <span className="font-heading font-bold text-4xl">NIMEX</span>
          </div>

          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Welcome Back to Nigeria's Trusted Marketplace
          </h1>

          <p className="font-sans text-lg opacity-90 leading-body">
            Connect with verified vendors, discover authentic Nigerian products, and shop with confidence.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">Secure Escrow</h3>
                <p className="font-sans text-sm opacity-80">Your money is protected until delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">Verified Sellers</h3>
                <p className="font-sans text-sm opacity-80">All vendors undergo KYC verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-2">
            Sign In
          </h2>
          <p className="font-sans text-neutral-600 mb-8">
            Enter your credentials to access your account
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="font-sans text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-sans font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-sans font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full h-12 px-4 pr-12 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                <span className="font-sans text-sm text-neutral-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-sans text-sm text-primary-500 hover:text-primary-600">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 font-sans">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            variant="outline"
            className="w-full h-12 border-neutral-200 hover:bg-neutral-50 font-sans font-medium rounded-lg flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="mt-8 text-center">
            <p className="font-sans text-neutral-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-500 hover:text-primary-600">
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="font-sans text-sm text-neutral-500 text-center">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-primary-500 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-500 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
