import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Mail,
  Phone,
  Star,
  ShoppingBag,
  Clock,
  Package,
  TrendingUp,
  Users,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface VendorProfile {
  id: string;
  name: string;
  image: string;
  coverImage: string;
  description: string;
  email: string;
  phone: string;
  rating: number;
  totalReviews: number;
  verified: boolean;
  location: string;
  fullAddress: string;
  locationImage: string;
  metrics: {
    totalSales: string;
    productsListed: string;
    responseTime: string;
    customerSatisfaction: string;
    repeatCustomers: string;
  };
  reviews: Review[];
}

const mockVendorData: VendorProfile = {
  id: '1',
  name: 'NaijaCrafts Emporium',
  image: '/image-1.png',
  coverImage: '/image-1.png',
  description:
    'NaijaCrafts Emporium is a leading online store dedicated to showcasing the rich cultural heritage of Nigeria through authentic handmade crafts. We connect talented local artisans with customers globally, ensuring fair trade practices and sustainable livelihoods. Our collection includes intricately designed jewelry, vibrant textiles, unique pottery, and traditional art pieces, all crafted with passion and precision. We are committed to quality, customer satisfaction, and promoting Nigerian artistry.',
  email: 'contact@naijacraftsemporium.com',
  phone: '+234 801 234 5678',
  rating: 5,
  totalReviews: 285,
  verified: true,
  location: 'Lagos, Nigeria',
  fullAddress: '123 Craftsman Avenue, Lekki, Lagos, Nigeria',
  locationImage: '/image.png',
  metrics: {
    totalSales: '₦5.2M+',
    productsListed: '150+',
    responseTime: '2 hours',
    customerSatisfaction: '98%',
    repeatCustomers: '75%',
  },
  reviews: [
    {
      id: '1',
      customerName: 'Aisha Lawal',
      rating: 5,
      comment:
        'Absolutely stunning craftsmanship! The textile I ordered was even more beautiful in person. Fast shipping and excellent customer service. Highly recommend!',
      date: '2024-03-10',
    },
    {
      id: '2',
      customerName: 'Chidi Okoro',
      rating: 4,
      comment:
        'Great selection of unique products. The pottery piece arrived well-packaged and is now a centerpiece in my home. A slight delay in delivery but communicated promptly.',
      date: '2024-02-28',
    },
    {
      id: '3',
      customerName: 'Funmi Adebayo',
      rating: 5,
      comment:
        'Fantastic experience from start to finish. The jewelry is exquisite and truly authentic. It feels good to support local Nigerian artists. Will definitely be a returning customer.',
      date: '2024-03-15',
    },
    {
      id: '4',
      customerName: 'Kunle Hassan',
      rating: 4,
      comment:
        'The artwork exceeded my expectations. Vibrant colors and high quality. The description on the website was accurate. A solid 4-star experience.',
      date: '2024-01-30',
    },
    {
      id: '5',
      customerName: 'Grace Oladapo',
      rating: 5,
      comment:
        'My go-to place for authentic Nigerian gifts. Every purchase has been perfect. The packaging is always thoughtful, and items arrive in perfect condition. Love NaijaCrafts Emporium!',
      date: '2024-01-20',
    },
  ],
};

export const VendorProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor] = useState<VendorProfile>(mockVendorData);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'text-accent-yellow fill-accent-yellow'
                : 'text-neutral-300 fill-neutral-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-heading font-bold text-neutral-900 text-2xl md:text-3xl">
                          {vendor.name}
                        </h1>
                        {vendor.verified && (
                          <CheckCircle className="w-6 h-6 text-primary-500" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(vendor.rating)}
                        <span className="font-sans text-sm text-neutral-600">
                          ({vendor.totalReviews} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="font-sans text-neutral-700 text-sm leading-relaxed">
                      {vendor.description}
                    </p>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Mail className="w-4 h-4 text-primary-500" />
                        <span>{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Phone className="w-4 h-4 text-primary-500" />
                        <span>{vendor.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-sans font-semibold">
                        Contact Vendor
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Performance Metrics
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Total Sales
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.metrics.totalSales}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-accent-yellow/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent-yellow" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Customer Rating
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.rating}.0/5
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Avg. Response Time
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.metrics.responseTime}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Products Listed
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.metrics.productsListed}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Customer Satisfaction
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.metrics.customerSatisfaction}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="font-sans text-xs text-neutral-600">
                      Repeat Customers
                    </span>
                    <span className="font-heading font-bold text-neutral-900 text-2xl">
                      {vendor.metrics.repeatCustomers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Business Location
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="w-full h-64 rounded-lg overflow-hidden">
                    <img
                      src={vendor.locationImage}
                      alt="Business location"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-sm text-neutral-700">
                      {vendor.fullAddress}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-neutral-200 shadow-sm sticky top-20">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading font-bold text-neutral-900 text-xl mb-6">
                  Customer Reviews
                </h2>

                <div className="flex flex-col gap-4">
                  {vendor.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col gap-2 pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-sans font-semibold text-neutral-900 text-sm">
                          {review.customerName}
                        </span>
                        {renderStars(review.rating)}
                      </div>

                      <p className="font-sans text-neutral-700 text-xs leading-relaxed">
                        {review.comment}
                      </p>

                      <span className="font-sans text-neutral-500 text-xs">
                        {review.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
