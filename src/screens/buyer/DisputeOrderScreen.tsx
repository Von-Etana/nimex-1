import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  Upload,
  X,
  Shield,
  Loader2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseStorageService } from '../../services/firebaseStorage.service';
import { orderService } from '../../services/orderService';
import { COLLECTIONS } from '../../lib/collections';

const DISPUTE_TYPES = [
  { id: 'non_delivery', label: 'Item Never Delivered', desc: 'The estimated delivery date has passed and package was not received.' },
  { id: 'damaged_item', label: 'Item Arrived Damaged / Broken', desc: 'The product arrived broken, torn, or severely impacted.' },
  { id: 'wrong_item', label: 'Wrong Item Received', desc: 'The delivered product is different from what was ordered.' },
  { id: 'quality_issue', label: 'Quality Not as Described', desc: 'Significant defect or difference from the vendor listing description.' },
  { id: 'other', label: 'Other Issue', desc: 'Any other issue requiring escrow arbitration.' }
];

export const DisputeOrderScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [disputeType, setDisputeType] = useState('damaged_item');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (orderId) {
      loadOrderData();
    }
  }, [orderId, user]);

  const loadOrderData = async () => {
    if (!orderId || !user) return;
    try {
      setLoading(true);
      const orderDoc = await FirestoreService.getDocument<any>(COLLECTIONS.ORDERS, orderId);
      if (!orderDoc) {
        setErrorMsg('Order not found');
        return;
      }
      if (orderDoc.buyer_id !== user.uid) {
        setErrorMsg('You are not authorized to file a dispute for this order.');
        return;
      }
      if (orderDoc.status === 'disputed') {
        setErrorMsg('A dispute has already been filed for this order and is currently under review.');
        return;
      }
      setOrder(orderDoc);
    } catch (err: any) {
      console.error('Error fetching order for dispute:', err);
      setErrorMsg('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const validFiles = selected.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name} exceeds the 5MB limit.`);
          return false;
        }
        return true;
      });
      setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // max 5 files
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !user) return;

    if (!description.trim() || description.trim().length < 15) {
      toast.error('Please provide at least 15 characters describing the issue.');
      return;
    }

    try {
      setSubmitting(true);
      const evidenceUrls: string[] = [];

      // Upload evidence files to Firebase Storage
      if (files.length > 0) {
        setUploadProgress('Uploading evidence photos...');
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const path = `disputes/${orderId}`;
          const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const res = await FirebaseStorageService.uploadFile(file, path, cleanName);
          if (res.url) {
            evidenceUrls.push(res.url);
          }
        }
      }

      setUploadProgress('Filing dispute and locking escrow...');
      const result = await orderService.createDispute(
        orderId,
        user.uid,
        'buyer',
        disputeType,
        description.trim(),
        evidenceUrls
      );

      if (result.success) {
        toast.success('Dispute filed successfully! Escrow disbursement has been locked.');
        navigate(`/orders/${orderId}`);
      } else {
        throw new Error(result.error || 'Failed to file dispute');
      }
    } catch (err: any) {
      console.error('Dispute submission error:', err);
      toast.error(err.message || 'Could not submit dispute. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
          <p className="text-neutral-600 text-sm">Loading order information...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl text-neutral-900 mb-2">Notice</h2>
            <p className="font-sans text-sm text-neutral-600 mb-6">{errorMsg || 'Order not found'}</p>
            <Button onClick={() => navigate(orderId ? `/orders/${orderId}` : '/orders')} className="w-full">
              Back to Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/orders/${orderId}`)}
          className="mb-6 pl-0 text-neutral-600 hover:text-neutral-900 hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Order #{order.order_number}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-neutral-900">
              Report an Issue / Dispute Order
            </h1>
            <p className="font-sans text-sm text-neutral-600">
              Order #{order.order_number} &bull; Total: ₦{(order.total_amount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Escrow Banner */}
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-sm font-semibold text-primary-900">
              Protected by NIMEX Escrow
            </p>
            <p className="font-sans text-xs text-primary-700 mt-0.5">
              Filing this dispute immediately freezes fund disbursement to the vendor. Our team will review your evidence, inspect vendor dispatch logs, and mediate an impartial resolution (replacement, full refund, or partial settlement).
            </p>
          </div>
        </div>

        <Card className="border border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Dispute Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dispute Reason */}
              <div>
                <label className="block font-sans text-sm font-medium text-neutral-800 mb-2">
                  What is the primary issue?
                </label>
                <div className="space-y-2">
                  {DISPUTE_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-colors ${
                        disputeType === type.id
                          ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disputeType"
                        value={type.id}
                        checked={disputeType === type.id}
                        onChange={(e) => setDisputeType(e.target.value)}
                        className="mt-1 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="font-sans text-sm font-semibold text-neutral-900">
                          {type.label}
                        </p>
                        <p className="font-sans text-xs text-neutral-500 mt-0.5">
                          {type.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-sans text-sm font-medium text-neutral-800 mb-1">
                  Describe what happened
                </label>
                <p className="font-sans text-xs text-neutral-500 mb-2">
                  Provide specific details (package condition, what was received, dates, etc.).
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="e.g., The parcel arrived on Wednesday, but the screen was cracked inside the package..."
                  className="w-full p-3 border border-neutral-200 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block font-sans text-sm font-medium text-neutral-800 mb-1">
                  Upload Evidence (Photos / Receipts)
                </label>
                <p className="font-sans text-xs text-neutral-500 mb-3">
                  Upload up to 5 images (JPEG, PNG, max 5MB each) clearly showing damage, shipping label, or incorrect item.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative p-2 border border-neutral-200 rounded-lg bg-white flex flex-col items-center text-center">
                      <FileCheck className="w-8 h-8 text-primary-600 mb-1" />
                      <p className="font-sans text-xs text-neutral-700 truncate w-full" title={file.name}>
                        {file.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-neutral-800 text-white rounded-full p-0.5 hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {files.length < 5 && (
                    <label className="border-2 border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                      <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                      <span className="font-sans text-xs font-medium text-primary-600">Add Photo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadProgress || 'Submitting...'}
                    </>
                  ) : (
                    'Submit Dispute & Freeze Escrow'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisputeOrderScreen;
