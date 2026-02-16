import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Package } from 'lucide-react';
import { Button } from '../components/ui/button';

export const NotFoundScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-9xl text-primary-500 mb-4">404</h1>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-neutral-900 mb-4">
            Page Not Found
          </h2>
          <p className="font-sans text-lg text-neutral-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={() => navigate('/')}
            className="bg-primary-500 hover:bg-primary-600 text-white h-12 px-8 flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Button>
          <Button
            onClick={() => navigate('/products')}
            variant="outline"
            className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 h-12 px-8 flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Browse Products
          </Button>
          <Button
            onClick={() => navigate('/search')}
            variant="outline"
            className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 h-12 px-8 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <h3 className="font-heading font-semibold text-xl text-neutral-900 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/categories')}
              className="p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left"
            >
              <p className="font-sans font-semibold text-neutral-900 mb-1">Categories</p>
              <p className="font-sans text-xs text-neutral-600">Browse by category</p>
            </button>
            <button
              onClick={() => navigate('/vendors')}
              className="p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left"
            >
              <p className="font-sans font-semibold text-neutral-900 mb-1">Vendors</p>
              <p className="font-sans text-xs text-neutral-600">Explore sellers</p>
            </button>
            <button
              onClick={() => navigate('/about')}
              className="p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left"
            >
              <p className="font-sans font-semibold text-neutral-900 mb-1">About Us</p>
              <p className="font-sans text-xs text-neutral-600">Learn more</p>
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="p-4 rounded-lg hover:bg-neutral-50 transition-colors text-left"
            >
              <p className="font-sans font-semibold text-neutral-900 mb-1">Contact</p>
              <p className="font-sans text-xs text-neutral-600">Get in touch</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
