import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Calendar, User, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: 'How to Start Your Online Selling Journey in Nigeria',
    excerpt: 'Discover the essential steps to launch your e-commerce business on NIMEX and reach millions of potential customers across Nigeria.',
    author: 'Sarah Johnson',
    date: 'October 15, 2024',
    category: 'Selling Tips',
    image: '/image-1.png',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Top 10 Product Categories Trending in 2024',
    excerpt: 'Explore the most popular product categories on NIMEX this year and learn what customers are actively searching for.',
    author: 'Michael Obi',
    date: 'October 12, 2024',
    category: 'Market Trends',
    image: '/image-2.png',
    readTime: '7 min read',
  },
  {
    id: 3,
    title: 'Maximizing Your Vendor Profile for Better Visibility',
    excerpt: 'Learn proven strategies to optimize your vendor profile, attract more customers, and increase your sales on the platform.',
    author: 'Amina Bello',
    date: 'October 8, 2024',
    category: 'Vendor Tips',
    image: '/image-3.png',
    readTime: '6 min read',
  },
  {
    id: 4,
    title: 'Understanding NIMEX Payment & Payout System',
    excerpt: 'A comprehensive guide to how payments work on NIMEX, including transaction fees, payout schedules, and security measures.',
    author: 'David Chen',
    date: 'October 5, 2024',
    category: 'Platform Guide',
    image: '/image-4.png',
    readTime: '8 min read',
  },
  {
    id: 5,
    title: 'Success Story: From Local Vendor to National Brand',
    excerpt: 'Read how Tunde transformed his small craft business into a thriving national brand with over 10,000 orders through NIMEX.',
    author: 'Grace Adeyemi',
    date: 'October 1, 2024',
    category: 'Success Stories',
    image: '/image-5.png',
    readTime: '4 min read',
  },
  {
    id: 6,
    title: 'Best Practices for Product Photography',
    excerpt: 'Professional tips on taking stunning product photos that sell. Learn lighting, angles, and editing techniques to showcase your items.',
    author: 'Emmanuel Okoro',
    date: 'September 28, 2024',
    category: 'Marketing',
    image: '/image-6.png',
    readTime: '10 min read',
  },
  {
    id: 7,
    title: 'How to Handle Customer Inquiries Effectively',
    excerpt: 'Master the art of customer communication with these proven techniques for responding to questions and building trust.',
    author: 'Fatima Ibrahim',
    date: 'September 25, 2024',
    category: 'Customer Service',
    image: '/image-7.png',
    readTime: '5 min read',
  },
  {
    id: 8,
    title: 'Seasonal Selling: Preparing for the Holiday Rush',
    excerpt: 'Get your store ready for the busy holiday season with inventory planning, promotional strategies, and customer management tips.',
    author: 'John Adekunle',
    date: 'September 20, 2024',
    category: 'Seasonal Tips',
    image: '/image-8.png',
    readTime: '9 min read',
  },
];

const categories = [
  'All Posts',
  'Selling Tips',
  'Market Trends',
  'Vendor Tips',
  'Platform Guide',
  'Success Stories',
  'Marketing',
  'Customer Service',
];

export const BlogScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('All Posts');

  const filteredPosts = selectedCategory === 'All Posts'
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-50">
      <div className="w-full bg-gradient-to-r from-primary-600 to-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="font-heading font-bold text-white text-4xl md:text-5xl mb-4">
            NIMEX Blog
          </h1>
          <p className="font-sans text-white text-lg md:text-xl max-w-2xl opacity-90">
            Insights, tips, and stories to help you succeed as a vendor on NIMEX
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-sans text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <CardContent className="p-0">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-sans text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="font-sans text-xs text-neutral-500">
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading font-bold text-neutral-900 text-xl mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="font-sans text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="font-sans text-xs text-neutral-600">
                          {post.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="font-sans text-xs text-neutral-500">
                          {post.date}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="font-sans text-neutral-600 text-lg">
              No blog posts found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
