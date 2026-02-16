/**
 * Firebase Storage Service
 * Handles file uploads, downloads, and deletions in Firebase Storage
 */

import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    UploadResult,
    UploadTask,
    StorageReference,
} from 'firebase/storage';
import { storage } from '../lib/firebase.config';
import { STORAGE_PATHS } from '../lib/collections';
import { logger } from '../lib/logger';

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    progress: number;
}

/**
 * Firebase Storage Service Class
 */
export class FirebaseStorageService {
    /**
     * Upload a file to Firebase Storage
     */
    static async uploadFile(
        file: File,
        path: string,
        fileName?: string
    ): Promise<{ url: string | null; error: Error | null }> {
        try {
            const finalFileName = fileName || `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `${path}/${finalFileName}`);

            logger.info(`Uploading file to ${path}/${finalFileName}`);

            const uploadResult: UploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            logger.info(`File uploaded successfully: ${downloadURL}`);
            return { url: downloadURL, error: null };
        } catch (error) {
            logger.error('Error uploading file', error);
            return { url: null, error: error as Error };
        }
    }

    /**
     * Upload a file with progress tracking
     */
    static uploadFileWithProgress(
        file: File,
        path: string,
        fileName?: string,
        onProgress?: (progress: UploadProgress) => void
    ): {
        uploadTask: UploadTask;
        promise: Promise<{ url: string | null; error: Error | null }>;
    } {
        const finalFileName = fileName || `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `${path}/${finalFileName}`);

        const uploadTask = uploadBytesResumable(storageRef, file);

        const promise = new Promise<{ url: string | null; error: Error | null }>((resolve) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = {
                        bytesTransferred: snapshot.bytesTransferred,
                        totalBytes: snapshot.totalBytes,
                        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                    };

                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    logger.error('Error during file upload', error);
                    resolve({ url: null, error: error as Error });
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        logger.info(`File uploaded successfully: ${downloadURL}`);
                        resolve({ url: downloadURL, error: null });
                    } catch (error) {
                        logger.error('Error getting download URL', error);
                        resolve({ url: null, error: error as Error });
                    }
                }
            );
        });

        return { uploadTask, promise };
    }

    /**
     * Upload multiple files
     */
    static async uploadMultipleFiles(
        files: File[],
        path: string
    ): Promise<{ urls: string[]; errors: Error[] }> {
        const uploadPromises = files.map((file) => this.uploadFile(file, path));
        const results = await Promise.all(uploadPromises);

        const urls: string[] = [];
        const errors: Error[] = [];

        results.forEach((result) => {
            if (result.url) {
                urls.push(result.url);
            }
            if (result.error) {
                errors.push(result.error);
            }
        });

        return { urls, errors };
    }

    /**
     * Delete a file from Firebase Storage
     */
    static async deleteFile(fileUrl: string): Promise<{ error: Error | null }> {
        try {
            // Extract the path from the URL
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);

            logger.info(`File deleted successfully: ${fileUrl}`);
            return { error: null };
        } catch (error) {
            logger.error('Error deleting file', error);
            return { error: error as Error };
        }
    }

    /**
     * Delete a file by path
     */
    static async deleteFileByPath(filePath: string): Promise<{ error: Error | null }> {
        try {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);

            logger.info(`File deleted successfully: ${filePath}`);
            return { error: null };
        } catch (error) {
            logger.error('Error deleting file by path', error);
            return { error: error as Error };
        }
    }

    /**
     * Delete multiple files
     */
    static async deleteMultipleFiles(fileUrls: string[]): Promise<{ errors: Error[] }> {
        const deletePromises = fileUrls.map((url) => this.deleteFile(url));
        const results = await Promise.all(deletePromises);

        const errors: Error[] = [];
        results.forEach((result) => {
            if (result.error) {
                errors.push(result.error);
            }
        });

        return { errors };
    }

    /**
     * Get download URL for a file
     */
    static async getFileUrl(filePath: string): Promise<{ url: string | null; error: Error | null }> {
        try {
            const fileRef = ref(storage, filePath);
            const url = await getDownloadURL(fileRef);
            return { url, error: null };
        } catch (error) {
            logger.error('Error getting file URL', error);
            return { url: null, error: error as Error };
        }
    }

    /**
     * List all files in a directory
     */
    static async listFiles(path: string): Promise<{ files: StorageReference[]; error: Error | null }> {
        try {
            const listRef = ref(storage, path);
            const result = await listAll(listRef);
            return { files: result.items, error: null };
        } catch (error) {
            logger.error('Error listing files', error);
            return { files: [], error: error as Error };
        }
    }

    /**
     * Upload avatar image
     */
    static async uploadAvatar(
        userId: string,
        file: File
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.AVATARS}/${userId}`;
        return this.uploadFile(file, path, 'avatar.jpg');
    }

    /**
     * Upload product image
     */
    static async uploadProductImage(
        vendorId: string,
        productId: string,
        file: File,
        index: number
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.PRODUCT_IMAGES}/${vendorId}/${productId}`;
        return this.uploadFile(file, path, `image_${index}.jpg`);
    }

    /**
     * Upload product images with progress
     */
    static uploadProductImagesWithProgress(
        vendorId: string,
        productId: string,
        files: File[],
        onProgress?: (fileIndex: number, progress: UploadProgress) => void
    ): Array<{
        uploadTask: UploadTask;
        promise: Promise<{ url: string | null; error: Error | null }>;
    }> {
        return files.map((file, index) => {
            const path = `${STORAGE_PATHS.PRODUCT_IMAGES}/${vendorId}/${productId}`;
            return this.uploadFileWithProgress(file, path, `image_${index}.jpg`, (progress) => {
                if (onProgress) {
                    onProgress(index, progress);
                }
            });
        });
    }

    /**
     * Upload KYC document
     */
    static async uploadKYCDocument(
        userId: string,
        file: File,
        documentType: 'id' | 'selfie' | 'cac'
    ): Promise<{ url: string | null; error: Error | null }> {
        let path: string;
        switch (documentType) {
            case 'id':
                path = `${STORAGE_PATHS.KYC_DOCUMENTS}/${userId}`;
                break;
            case 'selfie':
                path = `${STORAGE_PATHS.KYC_SELFIES}/${userId}`;
                break;
            case 'cac':
                path = `${STORAGE_PATHS.KYC_CAC}/${userId}`;
                break;
        }

        return this.uploadFile(file, path, `${documentType}.jpg`);
    }

    /**
     * Upload delivery proof image
     */
    static async uploadDeliveryProof(
        orderId: string,
        file: File
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.DELIVERY_PROOFS}/${orderId}`;
        return this.uploadFile(file, path, `proof_${Date.now()}.jpg`);
    }

    /**
     * Upload chat image
     */
    static async uploadChatImage(
        conversationId: string,
        file: File
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.CHAT_IMAGES}/${conversationId}`;
        return this.uploadFile(file, path);
    }

    /**
     * Upload support attachment
     */
    static async uploadSupportAttachment(
        ticketId: string,
        file: File
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.SUPPORT_ATTACHMENTS}/${ticketId}`;
        return this.uploadFile(file, path);
    }

    /**
     * Upload ad image
     */
    static async uploadAdImage(
        vendorId: string,
        adId: string,
        file: File
    ): Promise<{ url: string | null; error: Error | null }> {
        const path = `${STORAGE_PATHS.AD_IMAGES}/${vendorId}/${adId}`;
        return this.uploadFile(file, path, 'ad_image.jpg');
    }
}

export default FirebaseStorageService;
