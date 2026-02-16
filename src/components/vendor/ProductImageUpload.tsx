import React, { useState, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { FirebaseStorageService } from '../../services/firebaseStorage.service';

interface ProductImageUploadProps {
    vendorId: string;
    productId: string;
    existingImages: string[];
    maxImages?: number;
    onImagesChange: (images: string[]) => void;
}

interface ImageUploadState {
    file: File;
    preview: string;
    uploading: boolean;
    progress: number;
    error?: string;
    url?: string;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
    vendorId,
    productId,
    existingImages,
    maxImages = 5,
    onImagesChange,
}) => {
    const [images, setImages] = useState<string[]>(existingImages);
    const [uploadingImages, setUploadingImages] = useState<ImageUploadState[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file: File): string | null => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return 'Only image files are allowed';
        }
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return 'Image size must be less than 5MB';
        }
        return null;
    };

    const uploadFile = async (file: File, index: number): Promise<string | null> => {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `image_${Date.now()}_${index}.${fileExt}`;
        const path = `products/${vendorId}/${productId}`;

        const { promise } = FirebaseStorageService.uploadFileWithProgress(
            file,
            path,
            fileName,
            (progress) => {
                setUploadingImages((prev) =>
                    prev.map((img, i) =>
                        i === index ? { ...img, progress: progress.progress } : img
                    )
                );
            }
        );

        const result = await promise;
        return result.url;
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;

        const remainingSlots = maxImages - images.length - uploadingImages.length;
        if (remainingSlots <= 0) {
            alert(`Maximum ${maxImages} images allowed`);
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        // Validate files
        for (const file of filesToUpload) {
            const error = validateFile(file);
            if (error) {
                alert(error);
                return;
            }
        }

        // Create preview states
        const newUploadingImages: ImageUploadState[] = filesToUpload.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
            progress: 0,
        }));

        setUploadingImages((prev) => [...prev, ...newUploadingImages]);

        // Upload files
        const uploadedUrls: string[] = [];
        for (let i = 0; i < filesToUpload.length; i++) {
            const baseIndex = uploadingImages.length + i;
            try {
                const url = await uploadFile(filesToUpload[i], baseIndex);
                if (url) {
                    uploadedUrls.push(url);
                    setUploadingImages((prev) =>
                        prev.map((img, idx) =>
                            idx === baseIndex ? { ...img, uploading: false, url } : img
                        )
                    );
                }
            } catch (error) {
                setUploadingImages((prev) =>
                    prev.map((img, idx) =>
                        idx === baseIndex ? { ...img, uploading: false, error: 'Upload failed' } : img
                    )
                );
            }
        }

        // Update final images list
        const newImages = [...images, ...uploadedUrls];
        setImages(newImages);
        onImagesChange(newImages);

        // Clean up uploading states after a short delay
        setTimeout(() => {
            setUploadingImages([]);
        }, 500);
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
        },
        [images, uploadingImages]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        e.target.value = ''; // Reset input
    };

    const removeImage = async (index: number) => {
        const imageToRemove = images[index];
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);

        // Optionally delete from storage
        try {
            await FirebaseStorageService.deleteFile(imageToRemove);
        } catch (error) {
            console.error('Failed to delete image from storage:', error);
        }
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= images.length) return;
        const newImages = [...images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);
        setImages(newImages);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block font-sans font-medium text-xs md:text-sm text-neutral-700">
                    Product Images ({images.length}/{maxImages})
                </label>
                <p className="text-xs text-neutral-500">First image is the main image</p>
            </div>

            {/* Existing Images */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {images.map((imageUrl, index) => (
                        <div
                            key={imageUrl}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${index === 0 ? 'border-green-500' : 'border-neutral-200'
                                } group`}
                        >
                            <img
                                src={imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded">
                                    Main
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => moveImage(index, 0)}
                                        className="p-1.5 bg-white rounded-full text-neutral-700 hover:bg-neutral-100"
                                        title="Set as main"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Uploading Images */}
            {uploadingImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {uploadingImages.map((img, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-neutral-200"
                        >
                            <img
                                src={img.preview}
                                alt={`Uploading ${index + 1}`}
                                className="w-full h-full object-cover opacity-50"
                            />
                            {img.uploading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                                    <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
                                    <span className="text-white text-xs font-medium">
                                        {Math.round(img.progress)}%
                                    </span>
                                </div>
                            )}
                            {img.error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                                    <span className="text-white text-xs font-medium text-center px-2">
                                        {img.error}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {images.length + uploadingImages.length < maxImages && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative ${dragActive
                            ? 'border-green-500 bg-green-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5" />
                    </div>
                    <p className="font-sans font-medium text-sm text-neutral-900">
                        {dragActive ? 'Drop images here' : 'Click or drag images here'}
                    </p>
                    <p className="font-sans text-xs text-neutral-500 mt-1">
                        PNG, JPG, WEBP up to 5MB each (max {maxImages} images)
                    </p>
                </div>
            )}
        </div>
    );
};
