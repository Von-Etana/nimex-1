import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageIcon, TrendingUp, DollarSign, Users, CheckCircle, Megaphone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { referralService } from '../services/referralService';

export const MarketerRegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await referralService.registerMarketer(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during marketer registration:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 md:p-8 border-b border-neutral-200">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-md flex items-center justify-center">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-primary-500 text-2xl">NIMEX</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="font-heading font-bold text-3xl text-neutral-900 mb-4">
              Registration Submitted!
            </h1>
            <p className="font-sans text-neutral-600 mb-8 leading-relaxed">
              Thank you for registering as a marketer. Your application has been submitted and is pending
              admin approval. You will receive an email with your unique referral code once approved.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-8"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                  Fill in your details to get started
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

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg"
                  >
                    {loading ? 'Submitting...' : 'Register as Marketer'}
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
