import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PackageIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, profile } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle automatic redirection when logged in
  useEffect(() => {
    if (user && profile) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn({
      email: formData.email,
      password: formData.password
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // Navigation will be handled by the useEffect above when user/profile state updates
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
              disabled={loading}
              className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

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
