/**
 * Firebase Firestore Service
 * Generic CRUD operations and query builders for Firestore
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    WhereFilterOp,
    OrderByDirection,
    DocumentData,
    QueryConstraint,
    Timestamp,
    writeBatch,
    runTransaction,
    onSnapshot,
    Unsubscribe,
    DocumentSnapshot,
    QuerySnapshot,
    addDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase.config';
import { logger } from '../lib/logger';

/**
 * Query filter interface
 */
export interface QueryFilter {
    field: string;
    operator: WhereFilterOp;
    value: any;
}

/**
 * Query options interface
 */
export interface QueryOptions {
    filters?: QueryFilter[];
    orderBy?: {
        field: string;
        direction?: OrderByDirection;
    };
    orderByField?: string;
    orderByDirection?: OrderByDirection;
    limitCount?: number;
    startAfterDoc?: DocumentSnapshot;
}

/**
 * Firestore Service Class
 */
export class FirestoreService {
    /**
     * Get a single document by ID
     */
    static async getDocument<T = DocumentData>(
        collectionName: string,
        documentId: string
    ): Promise<T | null> {
        try {
            const docRef = doc(db, collectionName, documentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as T;
            }
            return null;
        } catch (error) {
            logger.error(`Error getting document from ${collectionName}/${documentId}`, error);
            throw error;
        }
    }

    /**
     * Get multiple documents with optional filtering and pagination
     */
    /**
     * Get multiple documents with optional filtering and pagination
     */
    static async getDocuments<T = DocumentData>(
        collectionName: string,
        optionsOrConstraints?: QueryOptions | QueryConstraint[]
    ): Promise<T[]> {
        try {
            const constraints: QueryConstraint[] = [];

            if (Array.isArray(optionsOrConstraints)) {
                // It's an array of QueryConstraints
                constraints.push(...optionsOrConstraints);
            } else if (optionsOrConstraints) {
                // It's QueryOptions
                const options = optionsOrConstraints;

                // Add filters
                if (options.filters) {
                    options.filters.forEach((filter) => {
                        constraints.push(where(filter.field, filter.operator, filter.value));
                    });
                }

                // Add ordering (legacy)
                if (options.orderByField) {
                    constraints.push(
                        orderBy(options.orderByField, options.orderByDirection || 'asc')
                    );
                }

                // Add ordering (new object style)
                if (options.orderBy) {
                    constraints.push(
                        orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
                    );
                }

                // Add limit
                if (options.limitCount) {
                    constraints.push(limit(options.limitCount));
                }

                // Add pagination
                if (options.startAfterDoc) {
                    constraints.push(startAfter(options.startAfterDoc));
                }
            }

            const q = query(collection(db, collectionName), ...constraints);
            const querySnapshot = await getDocs(q);

            const documents: T[] = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() } as T);
            });

            return documents;
        } catch (error) {
            logger.error(`Error getting documents from ${collectionName}`, error);
            throw error;
        }
    }

    /**
     * Add a document with auto-generated ID
     */
    static async addDocument<T = DocumentData>(
        collectionName: string,
        data: T
    ): Promise<string> {
        try {
            const colRef = collection(db, collectionName);
            const dataWithTimestamp = {
                ...data,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now(),
            };
            const docRef = await addDoc(colRef, dataWithTimestamp);
            logger.info(`Document added to ${collectionName}/${docRef.id}`);
            return docRef.id;
        } catch (error) {
            logger.error(`Error adding document to ${collectionName}`, error);
            throw error;
        }
    }

    /**
     * Create or set a document
     */
    static async setDocument<T = DocumentData>(
        collectionName: string,
        documentId: string,
        data: Partial<T>,
        merge: boolean = false
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, documentId);
            const dataWithTimestamp = {
                ...data,
                updated_at: Timestamp.now(),
            };

            if (!merge) {
                (dataWithTimestamp as any).created_at = Timestamp.now();
            }

            await setDoc(docRef, dataWithTimestamp, { merge });
            logger.info(`Document set in ${collectionName}/${documentId}`);
        } catch (error) {
            logger.error(`Error setting document in ${collectionName}/${documentId}`, error);
            throw error;
        }
    }

    /**
     * Update a document
     */
    static async updateDocument<T = DocumentData>(
        collectionName: string,
        documentId: string,
        data: Partial<T>
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, documentId);
            const dataWithTimestamp = {
                ...data,
                updated_at: Timestamp.now(),
            };

            await updateDoc(docRef, dataWithTimestamp);
            logger.info(`Document updated in ${collectionName}/${documentId}`);
        } catch (error) {
            logger.error(`Error updating document in ${collectionName}/${documentId}`, error);
            throw error;
        }
    }

    /**
     * Delete a document
     */
    static async deleteDocument(
        collectionName: string,
        documentId: string
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, documentId);
            await deleteDoc(docRef);
            logger.info(`Document deleted from ${collectionName}/${documentId}`);
        } catch (error) {
            logger.error(`Error deleting document from ${collectionName}/${documentId}`, error);
            throw error;
        }
    }

    /**
     * Batch write operations
     */
    static async batchWrite(
        operations: Array<{
            type: 'set' | 'update' | 'delete';
            collectionName: string;
            documentId: string;
            data?: any;
        }>
    ): Promise<void> {
        try {
            const batch = writeBatch(db);

            operations.forEach((op) => {
                const docRef = doc(db, op.collectionName, op.documentId);

                switch (op.type) {
                    case 'set':
                        batch.set(docRef, {
                            ...op.data,
                            created_at: Timestamp.now(),
                            updated_at: Timestamp.now(),
                        });
                        break;
                    case 'update':
                        batch.update(docRef, {
                            ...op.data,
                            updated_at: Timestamp.now(),
                        });
                        break;
                    case 'delete':
                        batch.delete(docRef);
                        break;
                }
            });

            await batch.commit();
            logger.info(`Batch write completed with ${operations.length} operations`);
        } catch (error) {
            logger.error('Error in batch write', error);
            throw error;
        }
    }

    /**
     * Run a transaction
     */
    static async runTransaction<T>(
        transactionFn: (transaction: any) => Promise<T>
    ): Promise<T> {
        try {
            const result = await runTransaction(db, transactionFn);
            logger.info('Transaction completed successfully');
            return result;
        } catch (error) {
            logger.error('Error in transaction', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time updates for a single document
     */
    static subscribeToDocument<T = DocumentData>(
        collectionName: string,
        documentId: string,
        callback: (data: T | null) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe {
        const docRef = doc(db, collectionName, documentId);

        return onSnapshot(
            docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    callback({ id: docSnap.id, ...docSnap.data() } as T);
                } else {
                    callback(null);
                }
            },
            (error) => {
                logger.error(`Error in document subscription ${collectionName}/${documentId}`, error);
                if (errorCallback) {
                    errorCallback(error as Error);
                }
            }
        );
    }

    /**
     * Subscribe to real-time updates for a collection query
     */
    static subscribeToQuery<T = DocumentData>(
        collectionName: string,
        options: QueryOptions,
        callback: (data: T[]) => void,
        errorCallback?: (error: Error) => void
    ): Unsubscribe {
        const constraints: QueryConstraint[] = [];

        // Add filters
        if (options.filters) {
            options.filters.forEach((filter) => {
                constraints.push(where(filter.field, filter.operator, filter.value));
            });
        }

        // Add ordering
        if (options.orderByField) {
            constraints.push(
                orderBy(options.orderByField, options.orderByDirection || 'asc')
            );
        }

        // Add limit
        if (options.limitCount) {
            constraints.push(limit(options.limitCount));
        }

        const q = query(collection(db, collectionName), ...constraints);

        return onSnapshot(
            q,
            (querySnapshot) => {
                const documents: T[] = [];
                querySnapshot.forEach((doc) => {
                    documents.push({ id: doc.id, ...doc.data() } as T);
                });
                callback(documents);
            },
            (error) => {
                logger.error(`Error in query subscription for ${collectionName}`, error);
                if (errorCallback) {
                    errorCallback(error as Error);
                }
            }
        );
    }

    /**
     * Get document count for a query
     */
    static async getCount(
        collectionName: string,
        options?: QueryOptions
    ): Promise<number> {
        try {
            const documents = await this.getDocuments(collectionName, options);
            return documents.length;
        } catch (error) {
            logger.error(`Error getting count for ${collectionName}`, error);
            throw error;
        }
    }

    /**
     * Check if a document exists
     */
    static async documentExists(
        collectionName: string,
        documentId: string
    ): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, documentId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists();
        } catch (error) {
            logger.error(`Error checking document existence ${collectionName}/${documentId}`, error);
            throw error;
        }
    }
}

export default FirestoreService;
