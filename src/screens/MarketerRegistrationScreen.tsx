import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageIcon, TrendingUp, DollarSign, Users, Megaphone, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { referralService } from '../services/referralService';
import { useAuth } from '../contexts/AuthContext';
import { getFriendlyErrorMessage } from '../utils/errorHandling';

export const MarketerRegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Auth Account
      const { error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'marketer'
      });

      if (authError) {
        throw authError;
      }

      // Get the user ID from the Firebase auth instance
      // Import auth directly to get the current user
      const { auth } = await import('../lib/firebase.config');

      // Wait a moment for auth state to update if needed
      let userId = auth.currentUser?.uid;

      // If userId is not immediately available, wait briefly and retry
      if (!userId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        userId = auth.currentUser?.uid;
      }

      if (!userId) {
        throw new Error('Authentication completed but user session not established. Please try logging in.');
      }

      // 2. Create Marketer Profile
      const result = await referralService.registerMarketer({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        userId: userId,
      });

      if (result.success) {
        // Redirect to dashboard immediately
        navigate('/marketer/dashboard');
      } else {
        // If marketer profile creation failed, we still have an auth account
        // The user can try logging in and completing profile later
        setError(result.error || 'Profile creation failed. Please try logging in to complete setup.');
      }
    } catch (err: any) {
      console.error('Error during marketer registration:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-6 md:p-8 bg-white border-b border-neutral-200">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-500 rounded-md flex items-center justify-center">
            <PackageIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-primary-500 text-2xl">NIMEX</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-8">
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-neutral-900 mb-4">
                Become a NIMEX Marketer
              </h1>
              <p className="font-sans text-lg text-neutral-600 leading-relaxed">
                Join our marketing partner program and earn commissions by referring vendors to NIMEX.
                Grow your income while helping businesses succeed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-neutral-900 mb-1">
                      Earn Fixed Commissions
                    </h3>
                    <p className="font-sans text-sm text-neutral-600">
                      Get a fixed commission for every vendor you successfully refer to NIMEX
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-neutral-900 mb-1">
                      Track Your Performance
                    </h3>
                    <p className="font-sans text-sm text-neutral-600">
                      Access real-time dashboard to monitor referrals and earnings
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-neutral-900 mb-1">
                      Unlimited Referrals
                    </h3>
                    <p className="font-sans text-sm text-neutral-600">
                      No limit on how many vendors you can refer and earn from
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-neutral-900 mb-1">
                      Marketing Support
                    </h3>
                    <p className="font-sans text-sm text-neutral-600">
                      Get access to promotional materials and marketing resources
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <Card className="border border-neutral-200 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-2xl text-neutral-900 mb-2">
                  Register as a Marketer
                </h2>
                <p className="font-sans text-neutral-600 mb-6">
                  Create your account to get started
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-sans text-sm text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="fullName" className="block font-sans font-medium text-neutral-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
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
                      Email Address <span className="text-red-500">*</span>
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
                    <label htmlFor="phone" className="block font-sans font-medium text-neutral-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessName" className="block font-sans font-medium text-neutral-700 mb-2">
                      Business Name (Optional)
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg border border-neutral-200 font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block font-sans font-medium text-neutral-700 mb-2">
                      Password <span className="text-red-500">*</span>
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
                        placeholder="At least 6 characters"
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
                      Confirm Password <span className="text-red-500">*</span>
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

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
                  >
                    {loading ? 'Creating Account...' : 'Register as Marketer'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <p className="font-sans text-sm text-neutral-500 text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-500 hover:underline font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
