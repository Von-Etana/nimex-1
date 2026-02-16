import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Target, Users, Award, TrendingUp, Shield, Heart } from 'lucide-react';

const stats = [
  { label: 'Active Vendors', value: '50,000+' },
  { label: 'Products Listed', value: '2M+' },
  { label: 'Monthly Orders', value: '500K+' },
  { label: 'Cities Served', value: '100+' },
];

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To empower local vendors and connect buyers with authentic Nigerian products through a seamless, trustworthy marketplace.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We prioritize building strong relationships between buyers and sellers, fostering a vibrant community of Nigerian entrepreneurs.',
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'We implement rigorous verification processes and buyer protection policies to ensure every transaction is secure and reliable.',
  },
  {
    icon: TrendingUp,
    title: 'Growth & Innovation',
    description: 'We continuously invest in technology and features that help vendors scale their businesses and improve customer experience.',
  },
  {
    icon: Award,
    title: 'Quality Standards',
    description: 'We maintain high standards for product listings and encourage authentic reviews to help customers make informed decisions.',
  },
  {
    icon: Heart,
    title: 'Customer Satisfaction',
    description: 'We are committed to providing exceptional support and creating delightful shopping experiences for every user.',
  },
];

const team = [
  {
    name: 'Adebayo Ogunlesi',
    role: 'Founder & CEO',
    image: '/image-1.png',
    bio: 'Visionary entrepreneur with 15+ years in e-commerce and fintech.',
  },
  {
    name: 'Chioma Eze',
    role: 'Chief Technology Officer',
    image: '/image-2.png',
    bio: 'Tech innovator passionate about building scalable platforms.',
  },
  {
    name: 'Ibrahim Mohammed',
    role: 'Head of Vendor Relations',
    image: '/image-3.png',
    bio: 'Dedicated to empowering vendors and fostering business growth.',
  },
  {
    name: 'Grace Nwosu',
    role: 'Head of Customer Experience',
    image: '/image-4.png',
    bio: 'Committed to delivering world-class customer service.',
  },
];

export const AboutScreen: React.FC = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            About NIMEX
          </h1>
          <p className="font-sans text-white text-lg md:text-xl max-w-3xl mx-auto opacity-90">
            Nigeria's premier marketplace connecting local vendors with millions of customers nationwide
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="font-heading font-bold text-primary-600 text-3xl md:text-4xl mb-2">
                  {stat.value}
                </div>
                <div className="font-sans text-neutral-600 text-sm">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mb-16">
          <h2 className="font-heading font-bold text-neutral-900 text-3xl mb-6 text-center">
            Our Story
          </h2>
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-4xl mx-auto space-y-6 font-sans text-neutral-700 text-base leading-relaxed">
                <p>
                  NIMEX was founded in 2020 with a simple yet powerful vision: to create a digital marketplace
                  that empowers Nigerian entrepreneurs and makes it easier for customers to discover and purchase
                  authentic local products.
                </p>
                <p>
                  What started as a small platform connecting vendors in Lagos has grown into Nigeria's
                  fastest-growing e-commerce marketplace, serving over 100 cities and facilitating millions
                  of transactions every month.
                </p>
                <p>
                  We recognized that many talented vendors struggled to reach customers beyond their immediate
                  location, while buyers found it challenging to discover quality products and trustworthy sellers.
                  NIMEX bridges this gap by providing the technology, logistics support, and trust infrastructure
                  needed for thriving online commerce.
                </p>
                <p>
                  Today, NIMEX hosts over 50,000 active vendors selling everything from electronics and fashion
                  to groceries and handmade crafts. Our platform processes hundreds of thousands of orders monthly,
                  creating economic opportunities and delivering convenience to customers across Nigeria.
                </p>
                <p>
                  As we continue to grow, our commitment remains unchanged: to build a marketplace that serves
                  the Nigerian community with integrity, innovation, and unwavering dedication to customer satisfaction.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="font-heading font-bold text-neutral-900 text-3xl mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="font-heading font-bold text-neutral-900 text-lg mb-3">
                      {value.title}
                    </h3>
                    <p className="font-sans text-neutral-700 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-heading font-bold text-neutral-900 text-3xl mb-8 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-heading font-bold text-neutral-900 text-lg mb-1">
                    {member.name}
                  </h3>
                  <p className="font-sans text-primary-600 text-sm mb-3 font-medium">
                    {member.role}
                  </p>
                  <p className="font-sans text-neutral-600 text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <Card className="border border-primary-200 bg-primary-50 shadow-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="font-heading font-bold text-neutral-900 text-3xl mb-4">
                Join the NIMEX Community
              </h3>
              <p className="font-sans text-neutral-700 text-lg mb-8 max-w-2xl mx-auto">
                Whether you're a vendor looking to grow your business or a customer seeking quality products,
                NIMEX is here to serve you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-sans font-semibold rounded-lg transition-colors"
                >
                  Start Selling
                </a>
                <a
                  href="/products"
                  className="inline-block px-8 py-4 bg-white hover:bg-neutral-50 text-primary-600 border-2 border-primary-600 font-sans font-semibold rounded-lg transition-colors"
                >
                  Start Shopping
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};
