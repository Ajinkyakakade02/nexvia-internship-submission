import React, { useState, useEffect } from 'react';
import { Review } from '@/types';
import { reviewService } from '@/services/reviewService';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getProductReviews(productId);
      setReviews(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.createReview(productId, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Write review form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h4 className="text-base font-semibold text-slate-900">Write a Customer Review</h4>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Your Rating
            </label>
            <StarRating rating={rating} interactive size="lg" onChange={setRating} />
          </div>
          <Textarea
            label="Your Review"
            rows={3}
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
          <Button type="submit" isLoading={submitting} size="sm">
            Submit Review
          </Button>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 text-center text-sm text-slate-600">
          Please <a href="/login" className="text-primary-600 underline font-semibold">sign in</a> to leave a review.
        </div>
      )}

      {/* Review list */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-slate-900">
          Customer Reviews ({reviews.length})
        </h4>

        {loading ? (
          <p className="text-sm text-slate-400">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4 divide-y divide-slate-100">
            {reviews.map((rev) => {
              const reviewerName =
                typeof rev.customer === 'object' && rev.customer !== null
                  ? rev.customer.name
                  : 'Verified Buyer';

              return (
                <div key={rev._id} className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={reviewerName} size="sm" />
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800">{reviewerName}</h5>
                        <p className="text-[11px] text-slate-400">{formatDate(rev.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={rev.rating} size="sm" />
                  </div>
                  <p className="text-sm text-slate-600 pl-10">{rev.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
