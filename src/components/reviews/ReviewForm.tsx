import React, { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseStorageService } from '../../services/firebaseStorage.service';
import { COLLECTIONS } from '../../lib/collections';
import { logger } from '../../lib/logger';
import { Timestamp } from 'firebase/firestore';

interface ReviewFormProps {
  orderId: string;
  productId: string;
  vendorId: string;
  buyerId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  productId,
  vendorId,
  buyerId,
  onReviewSubmitted,
  onCancel
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (files: FileList) => {
    const newImages = Array.from(files);
    if (images.length + newImages.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of newImages) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${buyerId}_${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `review-images/${fileName}`;

        try {
          const downloadUrl = await FirebaseStorageService.uploadFile(file, filePath);
          uploadedUrls.push(downloadUrl);
        } catch (uploadError) {
          logger.error('Error uploading image', uploadError);
          continue;
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      logger.error('Error uploading images', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await FirestoreService.setDocument(COLLECTIONS.REVIEWS, reviewId, {
        product_id: productId,
        order_id: orderId,
        buyer_id: buyerId,
        vendor_id: vendorId,
        rating,
        review_text: reviewText.trim(),
        images: images,
        is_verified_purchase: true,
        created_at: Timestamp.now()
      });

      logger.info('Review submitted successfully');
      onReviewSubmitted();
    } catch (error) {
      logger.error('Error submitting review', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h3 className="font-heading font-bold text-lg text-neutral-900 mb-4">
        Write a Review
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
          Rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={`w-6 h-6 ${star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-neutral-300'
                  }`}
              />
            </button>
          ))}
          <span className="ml-2 font-sans text-sm text-neutral-600">
            {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
          Your Review *
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product and vendor..."
          className="w-full p-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
          rows={4}
          maxLength={1000}
        />
        <div className="text-xs text-neutral-500 mt-1">
          {reviewText.length}/1000 characters
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block font-sans text-sm font-semibold text-neutral-700 mb-2">
          Photos (Optional)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image}
                alt={`Review ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-neutral-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="w-16 h-16 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-neutral-400">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-600"></div>
              ) : (
                <Upload className="w-6 h-6 text-neutral-400" />
              )}
            </label>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          Upload up to 5 images (max 5MB each)
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || !reviewText.trim() || submitting}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};