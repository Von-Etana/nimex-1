import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'How do I create an account on NIMEX?',
        answer: 'Creating an account is simple! Click the "Sign Up" button in the top right corner, enter your email address, create a password, and verify your email. You can then choose to register as a buyer or vendor.',
      },
      {
        question: 'Is NIMEX free to use?',
        answer: 'Yes, NIMEX is free for buyers to browse and purchase products. Vendors can list products for free, with a small commission fee applied only when a sale is made. Premium features and advertising options are available for vendors who want additional visibility.',
      },
      {
        question: 'What areas does NIMEX serve?',
        answer: 'NIMEX currently serves all major cities across Nigeria, including Lagos, Abuja, Port Harcourt, Kano, Ibadan, and many more. We are continuously expanding our delivery network to reach more locations.',
      },
    ],
  },
  {
    category: 'For Buyers',
    questions: [
      {
        question: 'How do I search for products?',
        answer: 'You can search for products using our AI-powered search bar at the top of the page. Enter keywords, product names, or categories. You can also filter by location, price range, and vendor ratings to find exactly what you need.',
      },
      {
        question: 'Are the products authentic?',
        answer: 'We verify all vendors and encourage honest product descriptions. Look for the "Verified Seller" badge on vendor profiles. We also have a buyer protection policy and encourage customers to leave reviews to help maintain quality standards.',
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'NIMEX accepts multiple payment methods including bank transfers, debit cards, credit cards, and mobile money (M-Pesa, etc.). All transactions are processed securely through our encrypted payment gateway.',
      },
      {
        question: 'Can I return or exchange items?',
        answer: 'Return and exchange policies vary by vendor. Check the specific vendor\'s return policy on their profile page before making a purchase. Most vendors accept returns within 7-14 days for unused items in original packaging.',
      },
    ],
  },
  {
    category: 'For Vendors',
    questions: [
      {
        question: 'How do I start selling on NIMEX?',
        answer: 'Sign up for a vendor account, complete your business profile, add your products with clear photos and descriptions, set your prices, and start receiving orders. Our vendor dashboard makes it easy to manage your inventory and track sales.',
      },
      {
        question: 'What are the selling fees?',
        answer: 'NIMEX charges a small commission on each completed sale, typically ranging from 5-10% depending on the product category. There are no upfront listing fees or monthly charges. You only pay when you make a sale.',
      },
      {
        question: 'How do I receive payments?',
        answer: 'Payments are processed and held securely by NIMEX. Once an order is confirmed delivered, funds are released to your vendor wallet. You can request a payout to your registered bank account or mobile money account at any time.',
      },
      {
        question: 'How long does it take to receive payouts?',
        answer: 'Payouts are typically processed within 2-3 business days after you initiate a withdrawal request. Bank transfers may take an additional 1-2 business days to reflect in your account depending on your bank.',
      },
      {
        question: 'Can I promote my products?',
        answer: 'Yes! NIMEX offers several promotional tools including featured listings, sponsored ads, and category promotions. These can significantly increase your product visibility and sales. Check the Ads Management section in your vendor dashboard.',
      },
    ],
  },
  {
    category: 'Orders & Delivery',
    questions: [
      {
        question: 'How do I track my order?',
        answer: 'After placing an order, you will receive a tracking number via email and SMS. You can also track your order status in real-time through your NIMEX account dashboard under "My Orders".',
      },
      {
        question: 'What are the delivery times?',
        answer: 'Delivery times vary by location and vendor. Typically, deliveries within the same city take 1-3 business days, while inter-state deliveries may take 3-7 business days. Exact delivery estimates are shown during checkout.',
      },
      {
        question: 'Do you offer same-day delivery?',
        answer: 'Same-day delivery is available for select products and locations. Look for the "Same-Day Delivery" badge on product listings. This service is currently available in Lagos, Abuja, and Port Harcourt for orders placed before 2 PM.',
      },
    ],
  },
  {
    category: 'Account & Security',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page, enter your registered email address, and follow the instructions sent to your email to create a new password.',
      },
      {
        question: 'Is my personal information secure?',
        answer: 'Absolutely. NIMEX uses industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent. Read our Privacy Policy for more details.',
      },
      {
        question: 'Can I have multiple accounts?',
        answer: 'Each user is allowed one buyer account. However, if you are a vendor, you can have both a buyer account and a vendor account using the same email address.',
      },
    ],
  },
  {
    category: 'Customer Support',
    questions: [
      {
        question: 'How can I contact customer support?',
        answer: 'You can reach our customer support team via the in-app chat feature, email us at support@nimex.ng, or call our hotline at +234 800 NIMEX (64639). Our support team is available Monday-Saturday, 8 AM - 8 PM WAT.',
      },
      {
        question: 'What should I do if I have an issue with a vendor?',
        answer: 'First, try to resolve the issue directly with the vendor through our messaging system. If unresolved, contact our customer support team with your order details, and we will mediate to find a fair solution.',
      },
      {
        question: 'How do I report a fraudulent listing?',
        answer: 'Click the "Report" button on the product listing page and provide details about why you believe the listing is fraudulent. Our team will investigate and take appropriate action within 24-48 hours.',
      },
    ],
  },
];

export const FAQScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            Frequently Asked Questions
          </h1>
          <p className="font-sans text-white text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
            Find answers to common questions about using NIMEX
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full font-sans text-base border-none outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12">
        {filteredFAQ.length === 0 && searchQuery && (
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="font-sans text-neutral-600 text-lg">
                No questions found matching "{searchQuery}". Try different keywords or{' '}
                <a href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
                  contact support
                </a>
                .
              </p>
            </CardContent>
          </Card>
        )}

        {filteredFAQ.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-10">
            <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-6">
              {category.category}
            </h2>

            <div className="flex flex-col gap-3">
              {category.questions.map((item, questionIndex) => {
                const key = `${categoryIndex}-${questionIndex}`;
                const isOpen = openItems[key];

                return (
                  <Card
                    key={questionIndex}
                    className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <h3 className="font-heading font-semibold text-neutral-900 text-lg pr-4">
                          {item.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6">
                          <p className="font-sans text-neutral-700 text-base leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        <Card className="border border-primary-200 bg-primary-50 shadow-sm mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="font-heading font-bold text-neutral-900 text-2xl mb-3">
              Still have questions?
            </h3>
            <p className="font-sans text-neutral-700 text-base mb-6">
              Can't find what you're looking for? Our support team is here to help.
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
