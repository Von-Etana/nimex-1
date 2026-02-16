import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  HouseIcon,
  CarIcon,
  TvIcon,
  ShirtIcon,
  UtensilsIcon,
  HammerIcon,
  BookOpenIcon,
  HeartPulseIcon,
  MapPinIcon,
  Sparkles,
  TrendingUpIcon,
  ArrowRight,
  SearchIcon,
} from 'lucide-react';

const categoryGroups = [
  {
    title: 'Popular Categories',
    categories: [
      {
        icon: HouseIcon,
        title: 'Real Estate',
        subtitle: 'Homes, apartments, lands for sale or rent.',
      },
      {
        icon: CarIcon,
        title: 'Vehicles',
        subtitle: 'Cars, motorcycles, trucks, and spare parts.',
      },
      {
        icon: TvIcon,
        title: 'Electronics',
        subtitle: 'Phones, laptops, gadgets, and accessories.',
      },
      {
        icon: ShirtIcon,
        title: 'Fashion & Beauty',
        subtitle: 'Clothing, jewelry, cosmetics, and skincare.',
      },
    ],
  },
  {
    title: 'Everyday Essentials',
    categories: [
      {
        icon: UtensilsIcon,
        title: 'Food & Agriculture',
        subtitle: 'Fresh produce, farm equipment, processed foods.',
      },
      {
        icon: HammerIcon,
        title: 'Building Materials',
        subtitle: 'Cement, roofing, plumbing, and electrical supplies.',
      },
      {
        icon: BookOpenIcon,
        title: 'Books & Education',
        subtitle: 'Textbooks, novels, e-learning materials, tutorials.',
      },
      {
        icon: HeartPulseIcon,
        title: 'Health & Wellness',
        subtitle: 'Medical supplies, fitness gear, supplements.',
      },
    ],
  },
  {
    title: 'Electronics & Gadgets',
    categories: [
      {
        icon: TvIcon,
        title: 'Electronics',
        subtitle: 'Phones, laptops, gadgets, and accessories.',
      },
      {
        icon: ShirtIcon,
        title: 'Fashion & Beauty',
        subtitle: 'Clothing, jewelry, cosmetics, and skincare.',
      },
    ],
  },
];

export const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'nearest' | 'popular'>('nearest');
  const [location, setLocation] = useState('Lagos, Nigeria');

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="w-full bg-gradient-to-r from-[#e8f5e9] to-[#e0e0e0] rounded-2xl overflow-hidden mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
            <div className="flex-1 max-w-xl mb-6 md:mb-0">
              <h1 className="font-heading font-bold text-neutral-900 text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
                Discover Your Next Treasure on NIMEX
              </h1>
              <p className="font-sans text-neutral-700 text-base md:text-lg leading-relaxed mb-6">
                Explore a vast marketplace of products and services, tailored to your location in Nigeria.
              </p>

              <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm max-w-md">
                <SearchIcon className="w-5 h-5 text-neutral-400" />
                <div className="flex items-center gap-2 flex-1">
                  <MapPinIcon className="w-4 h-4 text-primary-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 font-sans text-sm text-neutral-700 outline-none"
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <img
                src="/image.png"
                alt="Shopping illustration"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="font-heading font-bold text-neutral-900 text-xl md:text-2xl">
            Categories near {location}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('nearest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-sm transition-colors ${
                activeFilter === 'nearest'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <MapPinIcon className="w-4 h-4" />
              Nearest
            </button>
            <button
              onClick={() => setActiveFilter('popular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-sm transition-colors ${
                activeFilter === 'popular'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <TrendingUpIcon className="w-4 h-4" />
              Popular
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-12 md:gap-16">
          {categoryGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-col gap-6">
              <h3 className="font-heading font-bold text-neutral-900 text-lg md:text-xl text-center">
                {group.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {group.categories.map((category, index) => (
                  <Card
                    key={index}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(category.title)}`)}
                    className="border border-neutral-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                  >
                    <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                        <category.icon className="w-8 h-8 text-primary-500" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-heading font-semibold text-neutral-900 text-base">
                          {category.title}
                        </h4>
                        <p className="font-sans text-neutral-600 text-xs leading-relaxed">
                          {category.subtitle}
                        </p>
                      </div>
                      <button className="flex items-center gap-1 font-sans font-medium text-primary-500 text-sm hover:text-primary-600 transition-colors group">
                        View Category
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] rounded-2xl p-8 md:p-12 mt-12 md:mt-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-heading font-bold text-neutral-900 text-xl md:text-2xl mb-3">
              Ready to Sell Your Items?
            </h3>
            <p className="font-sans text-neutral-700 text-sm md:text-base">
              List your products and connect with thousands of buyers across Nigeria.
            </p>
          </div>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-sans font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            Start Selling Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
