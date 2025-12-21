import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PackageIcon, ShoppingBag, UserIcon, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { referralService } from '../../services/referralService';
import { Button } from '../../components/ui/button';
import type { UserRole } from '../../types/database';
import { getFriendlyErrorMessage } from '../../utils/errorHandling';

export const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralValidation, setReferralValidation] = useState<{
    valid: boolean;
    type: 'vendor' | 'marketer' | null;
    checking: boolean;
  }>({ valid: false, type: null, checking: false });

  const validateReferralCode = useCallback(async (code: string) => {
    if (!code) {
      setReferralValidation({ valid: false, type: null, checking: false });
      return;
    }

    setReferralValidation({ valid: false, type: null, checking: true });
    const result = await referralService.validateReferralCode(code);
    setReferralValidation({
      valid: result.valid,
      type: result.type,
      checking: false,
    });
  }, []);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
      validateReferralCode(refCode);
    }
  }, [searchParams, validateReferralCode]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password validation matching Zod schema
    const password = formData.password;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      role: selectedRole
    });

    if (signUpError) {
      setError(getFriendlyErrorMessage(signUpError));
      setLoading(false);
    } else {
      setLoading(false);
      if (selectedRole === 'vendor') {
        const params = formData.referralCode ? `?ref=${formData.referralCode}` : '';
        navigate(`/vendor/onboarding${params}`);
      } else {
        navigate('/');
      }
    }
  };

  const handleGoogleSignUp = async () => {
    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    setError('');
    setGoogleLoading(true);

    const { error: googleError, isNewUser } = await signInWithGoogle(selectedRole);

    if (googleError) {
      setError(getFriendlyErrorMessage(googleError));
      setGoogleLoading(false);
    } else {
      setGoogleLoading(false);
      if (selectedRole === 'vendor' && isNewUser) {
        const params = formData.referralCode ? `?ref=${formData.referralCode}` : '';
        navigate(`/vendor/onboarding${params}`);
      } else if (selectedRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 md:p-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-md flex items-center justify-center">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-primary-500 text-2xl">NIMEX</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-neutral-900 mb-4">
                Join NIMEX Today
              </h1>
              <p className="font-sans text-lg text-neutral-600">
                Choose how you want to use our platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => handleRoleSelect('buyer')}
                className="group p-8 bg-white rounded-2xl border-2 border-neutral-200 hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-3">
                  I Want to Buy
                </h2>
                <p className="font-sans text-neutral-600 leading-body mb-6">
                  Browse products from verified Nigerian vendors, shop securely with escrow protection, and enjoy hassle-free delivery.
                </p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Access to thousands of products
                  </li>
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Secure escrow protection
                  </li>
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Direct chat with sellers
                  </li>
                </ul>
              </button>

              <button
                onClick={() => handleRoleSelect('vendor')}
                className="group p-8 bg-white rounded-2xl border-2 border-neutral-200 hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-16 h-16 bg-accent-yellow/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-yellow transition-colors">
                  <UserIcon className="w-8 h-8 text-accent-yellow group-hover:text-accent-foreground transition-colors" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-3">
                  I Want to Sell
                </h2>
                <p className="font-sans text-neutral-600 leading-body mb-6">
                  List your products, reach millions of buyers across Nigeria, and grow your business with powerful vendor tools.
                </p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Easy product listing management
                  </li>
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Instant wallet payouts
                  </li>
                  <li className="flex items-start gap-2 font-sans text-sm text-neutral-700">
                    <span className="text-success mt-0.5">✓</span>
                    Analytics and insights
                  </li>
                </ul>
              </button>
            </div>

            <p className="text-center font-sans text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            {selectedRole === 'buyer' ? 'Start Shopping Today' : 'Grow Your Business with NIMEX'}
          </h1>

          <p className="font-sans text-lg opacity-90 leading-body">
            {selectedRole === 'buyer'
              ? 'Join thousands of happy customers shopping from verified Nigerian vendors.'
              : 'Join hundreds of successful vendors reaching customers across Nigeria.'}
          </p>

          <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur">
            <p className="font-sans text-sm">
              <strong>Selected:</strong>{' '}
              {selectedRole === 'buyer' ? 'Buyer Account' : 'Vendor Account'}
            </p>
            <button
              onClick={() => {
                setStep('role');
                setSelectedRole(null);
              }}
              className="font-sans text-sm underline mt-2 hover:text-white/80"
            >
              Change selection
            </button>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-2">
            Create Your Account
          </h2>
          <p className="font-sans text-neutral-600 mb-8">
            Fill in your details to get started
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="font-sans text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block font-sans font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

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
                  minLength={6}
                  className="w-full h-12 px-4 pr-12 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="8+ chars, 1 uppercase, 1 lowercase, 1 number"
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

            <div>
              <label htmlFor="confirmPassword" className="block font-sans font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
            </div>

            {selectedRole === 'vendor' && (
              <div>
                <label htmlFor="referralCode" className="block font-sans font-medium text-neutral-700 mb-2">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <input
                    id="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => {
                      setFormData({ ...formData, referralCode: e.target.value });
                      validateReferralCode(e.target.value);
                    }}
                    className="w-full h-12 px-4 pr-12 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter referral code"
                  />
                  {referralValidation.checking && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!referralValidation.checking && referralValidation.valid && (
                    <CheckCircle className="w-5 h-5 text-green-600 absolute right-4 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {referralValidation.valid && (
                  <p className="font-sans text-sm text-green-600 mt-1">
                    Valid {referralValidation.type === 'vendor' ? 'vendor' : 'marketer'} referral code
                  </p>
                )}
                {formData.referralCode && !referralValidation.checking && !referralValidation.valid && (
                  <p className="font-sans text-sm text-red-600 mt-1">
                    Invalid referral code
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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

          {/* Google Sign-up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
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
            {googleLoading ? 'Creating account...' : 'Sign up with Google'}
          </Button>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <p className="font-sans text-sm text-neutral-500 text-center">
              By signing up, you agree to our{' '}
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
