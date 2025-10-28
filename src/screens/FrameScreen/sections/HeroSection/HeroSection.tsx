import {
  BabyIcon,
  BookOpenIcon,
  CarIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  Flower2Icon,
  HouseIcon,
  PackageIcon,
  SearchIcon,
  ShirtIcon,
  TvIcon,
  UserIcon,
  UtensilsIcon,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { ProductGrid } from "./ProductGrid";

const navigationItems = [
  { label: "Home", active: true },
  { label: "Categories", active: false },
  { label: "Become a Vendor", active: false },
  { label: "About Us", active: false },
];

const categories = [
  { icon: TvIcon, title: "Electronics", subtitle: "Gadgets and devices" },
  { icon: ShirtIcon, title: "Fashion", subtitle: "Trendy apparel" },
  { icon: HouseIcon, title: "Home & Office", subtitle: "" },
  {
    icon: UtensilsIcon,
    title: "Groceries",
    subtitle: "Fresh food and essentials",
  },
  { icon: BookOpenIcon, title: "Books", subtitle: "Literary delights" },
  { icon: Flower2Icon, title: "Health & Beauty", subtitle: "" },
  { icon: CarIcon, title: "Automotive", subtitle: "Vehicles and accessories" },
  { icon: DumbbellIcon, title: "Sports", subtitle: "Gear and equipment" },
  { icon: BabyIcon, title: "BabyIcon & Kids", subtitle: "" },
  {
    icon: FlaskConicalIcon,
    title: "Chemicals",
    subtitle: "Industrial and household",
  },
];

const sampleProducts = [
  {
    image: "/image-1.png",
    title: "Latest Gen Smartphone X200",
    price: "₦ 120,000",
    oldPrice: "₦ 150,000",
    vendor: "Tech Hub",
    vendorImage: "/image-1.png",
    location: "Lagos",
    views: "1.2k",
    rating: 5,
    verified: true,
    badge: { text: "Verified Seller", variant: "yellow" as const },
  },
  {
    image: "/image-2.png",
    title: "Elegant Ankara Print Dress",
    price: "₦ 15,500",
    vendor: "AfroChic Styles",
    vendorImage: "/image-2.png",
    location: "Abuja",
    views: "850",
    rating: 4,
    verified: false,
    badge: { text: "New Seller", variant: "green" as const },
  },
  {
    image: "/image-3.png",
    title: "Premium Leather Handbag",
    price: "₦ 35,000",
    vendor: "Luxury Goods Co.",
    vendorImage: "/image-3.png",
    location: "Lagos",
    views: "2.1k",
    rating: 5,
    verified: true,
    badge: { text: "Trending", variant: "green" as const },
  },
  {
    image: "/image-4.png",
    title: "Fresh Nigerian Yam (5kg)",
    price: "₦ 4,800",
    vendor: "Farm Fresh Produce",
    vendorImage: "/image-4.png",
    location: "Ibadan",
    views: "456",
    rating: 4,
    verified: true,
    badge: { text: "Urgent", variant: "red" as const },
  },
  {
    image: "/image-5.png",
    title: "Ergonomic Office Chair",
    price: "₦ 65,000",
    vendor: "WorkSpace Solutions",
    vendorImage: "/image-5.png",
    location: "Lagos",
    views: "980",
    rating: 5,
    verified: true,
    badge: { text: "Verified Seller", variant: "yellow" as const },
  },
  {
    image: "/image-6.png",
    title: "Professional DSLR Camera",
    price: "₦ 250,000",
    vendor: "PhotoGear",
    vendorImage: "/image-6.png",
    location: "Abuja",
    views: "3.5k",
    rating: 5,
    verified: true,
    badge: { text: "New Arrival", variant: "green" as const },
  },
  {
    image: "/image-7.png",
    title: "Handmade Woven Basket Set",
    price: "₦ 8,900",
    vendor: "Artisanal Crafts",
    vendorImage: "/image-7.png",
    location: "Kano",
    views: "234",
    rating: 4,
    verified: false,
    badge: { text: "Limited Stock", variant: "red" as const },
  },
  {
    image: "/image-8.png",
    title: "SportX Running Shoes",
    price: "₦ 28,000",
    vendor: "Active Gear",
    vendorImage: "/image-8.png",
    location: "Lagos",
    views: "1.8k",
    rating: 5,
    verified: true,
    badge: { text: "Hot Deal", variant: "green" as const },
  },
];

const topVendors = [
  {
    image: "/image-1.png",
    title: "Tech Hub Store",
    price: "1,234 Products",
    vendor: "Tech Hub",
    vendorImage: "/image-1.png",
    location: "Lagos, Nigeria",
    views: "12.5k",
    rating: 5,
    verified: true,
    badge: { text: "Top Rated", variant: "yellow" as const },
  },
  {
    image: "/image-2.png",
    title: "Fashion Boutique Pro",
    price: "856 Products",
    vendor: "AfroChic Styles",
    vendorImage: "/image-2.png",
    location: "Abuja, Nigeria",
    views: "8.3k",
    rating: 5,
    verified: true,
    badge: { text: "Featured", variant: "green" as const },
  },
  {
    image: "/image-3.png",
    title: "Luxury Leather Co.",
    price: "432 Products",
    vendor: "Luxury Goods Co.",
    vendorImage: "/image-3.png",
    location: "Lagos, Nigeria",
    views: "15.2k",
    rating: 5,
    verified: true,
    badge: { text: "Premium", variant: "yellow" as const },
  },
  {
    image: "/image-4.png",
    title: "Farm Fresh Market",
    price: "2,145 Products",
    vendor: "Farm Fresh Produce",
    vendorImage: "/image-4.png",
    location: "Ibadan, Nigeria",
    views: "6.7k",
    rating: 4,
    verified: true,
    badge: { text: "Verified", variant: "green" as const },
  },
  {
    image: "/image-5.png",
    title: "Office Furniture Hub",
    price: "678 Products",
    vendor: "WorkSpace Solutions",
    vendorImage: "/image-5.png",
    location: "Lagos, Nigeria",
    views: "9.1k",
    rating: 5,
    verified: true,
    badge: { text: "Trusted", variant: "yellow" as const },
  },
  {
    image: "/image-6.png",
    title: "PhotoGear Professional",
    price: "523 Products",
    vendor: "PhotoGear",
    vendorImage: "/image-6.png",
    location: "Abuja, Nigeria",
    views: "18.4k",
    rating: 5,
    verified: true,
    badge: { text: "Expert", variant: "green" as const },
  },
];

export const HeroSection = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-8 md:gap-14 w-full">
      <div className="flex flex-col w-full max-w-7xl mx-auto items-start gap-8 md:gap-16 px-4 md:px-6 py-6 md:py-8">
        <div className="w-full min-h-[500px] md:h-[600px] bg-gradient-to-br from-neutral-50 via-neutral-100 to-primary-50 rounded-3xl overflow-hidden relative flex items-center">
          <div className="absolute top-8 right-12 md:top-12 md:right-20 w-16 h-16 border-4 border-pink-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-16 right-32 md:top-20 md:right-40 w-12 h-12 border-4 border-red-400 rotate-45 opacity-50"></div>
          <div className="absolute bottom-24 left-8 md:bottom-32 md:left-16 w-20 h-20 bg-yellow-400 rounded-full opacity-40 blur-2xl"></div>

          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 flex flex-col items-center justify-center">
            <div className="w-full z-10 text-center">
              <h1 className="font-heading font-bold text-neutral-900 text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-4 md:mb-6">
                Find Nearby Vendors
              </h1>
              <p className="font-sans text-neutral-600 text-base md:text-lg lg:text-xl leading-relaxed mb-8 md:mb-10 max-w-2xl mx-auto">
                Explore top-rated products, trusted vendors and authentic Nigerian items
              </p>

              <div className="bg-white rounded-3xl md:rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full max-w-5xl mx-auto mb-6 md:mb-8">
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-200">
                  <SearchIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="AI Search"
                    className="w-full font-sans text-sm md:text-base text-neutral-900 placeholder-neutral-400 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-neutral-200">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full font-sans text-sm md:text-base text-neutral-900 placeholder-neutral-400 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-3 flex-1 px-4 py-3 border-b md:border-b-0 border-neutral-200">
                  <PackageIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <select className="w-full font-sans text-sm md:text-base text-neutral-900 outline-none bg-transparent cursor-pointer">
                    <option>All Categories</option>
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Food</option>
                    <option>Books</option>
                  </select>
                </div>
                <Button
                  onClick={() => navigate('/search')}
                  className="h-12 md:h-14 px-6 md:px-8 bg-red-500 hover:bg-red-600 text-white font-sans font-bold rounded-full text-base md:text-lg shadow-lg hover:shadow-xl transition-all flex-shrink-0 w-full md:w-auto"
                >
                  Search
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <p className="font-sans text-sm text-neutral-600">Or browse featured categories:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => navigate('/vendors')}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-sans text-sm font-medium flex items-center gap-2 transition-all"
                  >
                    <HouseIcon className="w-4 h-4" />
                    Vendors
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-sans text-sm font-medium flex items-center gap-2 transition-all"
                  >
                    <DumbbellIcon className="w-4 h-4" />
                    Products
                  </button>
                  <button
                    onClick={() => navigate('/categories')}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-sans text-sm font-medium flex items-center gap-2 transition-all"
                  >
                    <ShirtIcon className="w-4 h-4" />
                    Categories
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-5 md:gap-7 w-full">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-heading font-bold text-neutral-900 text-xl md:text-2xl">
              Shop by Category
            </h2>
            <a
              href="/categories"
              className="font-sans text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All →
            </a>
          </div>

          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {categories.map((category, index) => (
                <Card
                  key={index}
                  onClick={() => navigate(`/products?category=${encodeURIComponent(category.title)}`)}
                  className="h-24 md:h-28 shadow-sm border border-neutral-100 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-2 gap-1">
                    <category.icon className="w-5 h-5 md:w-6 md:h-6 text-primary-500 flex-shrink-0" />
                    <h3 className="font-heading font-semibold text-neutral-900 text-[10px] leading-tight text-center line-clamp-2">
                      {category.title}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <ProductGrid title="Fresh Recommendations" products={sampleProducts} />

        <ProductGrid title="Top Vendors" products={topVendors} />

        <ProductGrid title="Trending in Electronics" products={sampleProducts} />

        <ProductGrid title="Trending in Fashion" products={sampleProducts} />

        <ProductGrid title="Trending in Home & Office" products={sampleProducts} />

        <ProductGrid title="Trending in Groceries" products={sampleProducts} />
      </div>
    </section>
  );
};
