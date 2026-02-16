import React from 'react';
import { Card, CardContent } from '../components/ui/card';

export const TermsScreen: React.FC = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            Terms & Conditions
          </h1>
          <p className="font-sans text-white text-lg opacity-90">
            Last updated: October 23, 2024
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12">
        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-8 font-sans text-neutral-700 text-base leading-relaxed">
              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using NIMEX ("the Platform"), you accept and agree to be bound by the terms and
                  provision of this agreement. If you do not agree to abide by the above, please do not use this
                  service.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  2. Use of the Platform
                </h2>
                <p className="mb-3">
                  NIMEX provides an online marketplace platform that connects buyers with vendors across Nigeria.
                  By using our platform, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Be responsible for all activities that occur under your account</li>
                  <li>Not use the platform for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  3. Vendor Obligations
                </h2>
                <p className="mb-3">If you register as a vendor, you additionally agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and truthful product descriptions</li>
                  <li>Honor all confirmed orders and deliver products as described</li>
                  <li>Maintain appropriate inventory levels</li>
                  <li>Respond to customer inquiries in a timely manner</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Pay applicable commission fees on completed transactions</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  4. Buyer Obligations
                </h2>
                <p className="mb-3">As a buyer, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate delivery and payment information</li>
                  <li>Pay for all orders placed through your account</li>
                  <li>Communicate respectfully with vendors</li>
                  <li>Inspect products upon delivery and report issues promptly</li>
                  <li>Not abuse the return/refund system</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  5. Fees and Payments
                </h2>
                <p className="mb-3">
                  NIMEX charges vendors a commission fee on each completed sale. The commission percentage varies
                  by product category and is clearly disclosed in the vendor dashboard. Payment processing fees may
                  also apply.
                </p>
                <p>
                  All prices are listed in Nigerian Naira (₦). Buyers are responsible for paying the full amount
                  including any applicable taxes and delivery fees.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  6. Product Listings
                </h2>
                <p>
                  Vendors are solely responsible for the content of their product listings. NIMEX reserves the right
                  to remove any listings that violate our policies, contain prohibited items, or are deemed
                  inappropriate. Prohibited items include but are not limited to: illegal substances, weapons,
                  counterfeit goods, and adult content.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  7. Returns and Refunds
                </h2>
                <p>
                  Return and refund policies are set by individual vendors and must be clearly stated on their
                  product listings. NIMEX facilitates dispute resolution but is not directly responsible for refunds.
                  In cases of fraud or significant vendor non-compliance, NIMEX may intervene and process refunds
                  from withheld vendor payments.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  8. Intellectual Property
                </h2>
                <p>
                  All content on the NIMEX platform, including but not limited to text, graphics, logos, and software,
                  is the property of NIMEX or its content suppliers and is protected by copyright laws. Vendors retain
                  ownership of their product images and descriptions but grant NIMEX a license to display and promote
                  them on the platform.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  9. Limitation of Liability
                </h2>
                <p>
                  NIMEX acts as a marketplace platform connecting buyers and vendors. We are not responsible for the
                  quality, safety, or legality of products listed, the truth or accuracy of listings, or the ability
                  of vendors to complete transactions. NIMEX is not liable for any direct, indirect, incidental,
                  special, or consequential damages arising from your use of the platform.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  10. Account Termination
                </h2>
                <p>
                  NIMEX reserves the right to suspend or terminate any account that violates these terms, engages in
                  fraudulent activity, or disrupts the platform's operation. Users may also close their accounts at
                  any time by contacting customer support.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  11. Modifications to Terms
                </h2>
                <p>
                  NIMEX reserves the right to modify these terms at any time. Users will be notified of significant
                  changes via email or platform notification. Continued use of the platform after changes constitutes
                  acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  12. Governing Law
                </h2>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of the Federal Republic
                  of Nigeria. Any disputes arising from these terms or use of the platform shall be subject to the
                  exclusive jurisdiction of Nigerian courts.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-4">
                  13. Contact Information
                </h2>
                <p>
                  For questions about these Terms & Conditions, please contact us at:
                </p>
                <ul className="list-none pl-0 mt-3 space-y-1">
                  <li>Email: legal@nimex.ng</li>
                  <li>Phone: +234 800 NIMEX (64639)</li>
                  <li>Address: 123 Commerce Plaza, Victoria Island, Lagos, Nigeria</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};