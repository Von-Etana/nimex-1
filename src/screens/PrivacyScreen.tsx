import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Shield, Lock, Eye, UserCheck, Database, AlertCircle } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: [
      'Personal information (name, email, phone number, address)',
      'Payment information (processed securely through our payment partners)',
      'Transaction history and purchase records',
      'Device and browser information',
      'Location data (with your permission)',
      'Communications with vendors and support team',
    ],
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    content: [
      'Process and fulfill your orders',
      'Communicate with you about your account and transactions',
      'Improve our platform and services',
      'Personalize your shopping experience',
      'Send promotional offers (with your consent)',
      'Detect and prevent fraud',
      'Comply with legal obligations',
    ],
  },
  {
    icon: UserCheck,
    title: 'Information Sharing',
    content: [
      'With vendors to fulfill your orders',
      'With payment processors to complete transactions',
      'With delivery partners to ship your products',
      'With law enforcement when legally required',
      'We NEVER sell your personal information to third parties',
    ],
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: [
      'Industry-standard encryption for data transmission',
      'Secure servers protected by firewalls',
      'Regular security audits and updates',
      'Access controls limiting who can view your data',
      'PCI-DSS compliant payment processing',
    ],
  },
  {
    icon: Shield,
    title: 'Your Rights',
    content: [
      'Access your personal data at any time',
      'Request corrections to inaccurate information',
      'Delete your account and associated data',
      'Opt-out of marketing communications',
      'Export your data in a portable format',
      'Withdraw consent for data processing',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Cookies and Tracking',
    content: [
      'We use cookies to enhance your experience',
      'Analytics cookies help us understand usage patterns',
      'Preference cookies remember your settings',
      'You can control cookie settings in your browser',
      'Some features may not work without cookies',
    ],
  },
];

export const PrivacyScreen: React.FC = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            Privacy Policy
          </h1>
          <p className="font-sans text-white text-lg opacity-90">
            Last updated: October 23, 2024
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12">
        <Card className="border border-neutral-200 shadow-sm mb-8">
          <CardContent className="p-8 md:p-12">
            <div className="font-sans text-neutral-700 text-base leading-relaxed space-y-4">
              <p>
                At NIMEX, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect,
                and share your personal information when you use our marketplace platform.
              </p>
              <p>
                By using NIMEX, you consent to the data practices described in this policy. We are committed to
                transparency and giving you control over your personal information.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h2 className="font-heading font-bold text-neutral-900 text-xl">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-2 font-sans text-neutral-700 text-sm leading-relaxed">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border border-neutral-200 shadow-sm mt-8">
          <CardContent className="p-8 md:p-12">
            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
              Data Retention
            </h2>
            <p className="font-sans text-neutral-700 text-base leading-relaxed mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with
              legal obligations. When you delete your account, we will delete or anonymize your personal data within
              30 days, except where we are required to retain it for legal or regulatory purposes.
            </p>

            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4 mt-8">
              Children's Privacy
            </h2>
            <p className="font-sans text-neutral-700 text-base leading-relaxed mb-4">
              NIMEX is not intended for users under the age of 18. We do not knowingly collect personal information
              from children. If you believe we have inadvertently collected information from a child, please contact
              us immediately.
            </p>

            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4 mt-8">
              Changes to This Policy
            </h2>
            <p className="font-sans text-neutral-700 text-base leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal
              and regulatory reasons. We will notify you of any material changes via email or through a prominent
              notice on our platform.
            </p>

            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4 mt-8">
              Contact Us
            </h2>
            <p className="font-sans text-neutral-700 text-base leading-relaxed mb-4">
              If you have questions or concerns about our privacy practices, please contact our Data Protection Officer:
            </p>
            <ul className="list-none font-sans text-neutral-700 text-base space-y-2">
              <li>Email: privacy@nimex.ng</li>
              <li>Phone: +234 800 NIMEX (64639)</li>
              <li>Address: 123 Commerce Plaza, Victoria Island, Lagos, Nigeria</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-primary-200 bg-primary-50 shadow-sm mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="font-heading font-bold text-neutral-900 text-2xl mb-3">
              Questions About Your Privacy?
            </h3>
            <p className="font-sans text-neutral-700 text-base mb-6">
              We're here to help. Contact our support team if you have any concerns about your data.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-sans font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};