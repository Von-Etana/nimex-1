import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send } from 'lucide-react';

const contactMethods = [
  {
    icon: Phone,
    title: 'Phone Support',
    detail: '+234 800 NIMEX (64639)',
    description: 'Mon-Sat: 8 AM - 8 PM WAT',
  },
  {
    icon: Mail,
    title: 'Email Support',
    detail: 'support@nimex.ng',
    description: 'We respond within 24 hours',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    detail: 'Available on the platform',
    description: 'Mon-Sat: 8 AM - 8 PM WAT',
  },
  {
    icon: MapPin,
    title: 'Head Office',
    detail: '123 Commerce Plaza',
    description: 'Victoria Island, Lagos, Nigeria',
  },
];

export const ContactScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            Contact Us
          </h1>
          <p className="font-sans text-white text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Have questions? We're here to help. Reach out to our support team.
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card key={index} className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-heading font-bold text-neutral-900 text-lg mb-2">
                    {method.title}
                  </h3>
                  <p className="font-sans text-primary-600 text-sm font-semibold mb-1">
                    {method.detail}
                  </p>
                  <p className="font-sans text-neutral-600 text-xs">
                    {method.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-6">
                Send Us a Message
              </h2>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-heading font-bold text-green-900 text-xl mb-2">
                    Message Sent!
                  </h3>
                  <p className="font-sans text-green-700 text-sm">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="vendor">Vendor Support</option>
                      <option value="order">Order Issue</option>
                      <option value="payment">Payment Issue</option>
                      <option value="partnership">Partnership Opportunity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      placeholder="Brief subject of your message"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-sans font-semibold py-3 rounded-lg"
                  >
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-6">
                  Business Hours
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-neutral-900 font-semibold mb-1">
                        Customer Support
                      </p>
                      <p className="font-sans text-neutral-600 text-sm">
                        Monday - Saturday: 8:00 AM - 8:00 PM WAT
                      </p>
                      <p className="font-sans text-neutral-600 text-sm">
                        Sunday: Closed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-4 border-t border-neutral-200">
                    <MessageCircle className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-neutral-900 font-semibold mb-1">
                        Live Chat
                      </p>
                      <p className="font-sans text-neutral-600 text-sm">
                        Available during business hours for instant support
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-2xl mb-6">
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <a
                    href="/faq"
                    className="block font-sans text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    → Frequently Asked Questions
                  </a>
                  <a
                    href="/terms"
                    className="block font-sans text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    → Terms & Conditions
                  </a>
                  <a
                    href="/privacy"
                    className="block font-sans text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    → Privacy Policy
                  </a>
                  <a
                    href="/about"
                    className="block font-sans text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    → About NIMEX
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary-200 bg-primary-50 shadow-sm">
              <CardContent className="p-6 text-center">
                <h3 className="font-heading font-bold text-neutral-900 text-lg mb-2">
                  Need Immediate Help?
                </h3>
                <p className="font-sans text-neutral-700 text-sm mb-4">
                  Check our FAQ section for instant answers to common questions.
                </p>
                <a
                  href="/faq"
                  className="inline-block px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-sans font-semibold rounded-lg transition-colors text-sm"
                >
                  Visit FAQ
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};