// Search History Service
// Manages search history stored in localStorage

const STORAGE_KEY = 'nimex_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
    query: string;
    category?: string;
    location?: string;
    timestamp: number;
}

class SearchHistoryService {
    /**
     * Get all search history items
     */
    getHistory(): SearchHistoryItem[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    /**
     * Add a search to history
     */
    addSearch(query: string, category?: string, location?: string): void {
        if (!query.trim()) return;

        const history = this.getHistory();

        // Remove duplicate if exists
        const filtered = history.filter(
            item => item.query.toLowerCase() !== query.toLowerCase()
        );

        // Add new search at the beginning
        const newItem: SearchHistoryItem = {
            query: query.trim(),
            category,
            location,
            timestamp: Date.now()
        };

        filtered.unshift(newItem);

        // Keep only last N items
        const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Remove a specific search from history
     */
    removeSearch(query: string): void {
        const history = this.getHistory();
        const filtered = history.filter(
            item => item.query.toLowerCase() !== query.toLowerCase()
        );

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error removing search:', error);
        }
    }

    /**
     * Clear all search history
     */
    clearHistory(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }

    /**
     * Get suggestions based on partial query
     */
    getSuggestions(query: string): SearchHistoryItem[] {
        if (!query.trim()) return this.getHistory().slice(0, 5);

        const history = this.getHistory();
        const queryLower = query.toLowerCase();

        return history
            .filter(item => item.query.toLowerCase().includes(queryLower))
            .slice(0, 5);
    }
}

export const searchHistoryService = new SearchHistoryService();
