import React, { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { FirestoreService } from '../../services/firestore.service';
import { COLLECTIONS } from '../../lib/collections';
import { useAuth } from '../../contexts/AuthContext';

interface ProductTag {
  id: string;
  tag_name: string;
  display_name: string;
  usage_count: number;
}

interface ProductTagsInputProps {
  categoryId: string;
  selectedTags: ProductTag[];
  onTagsChange: (tags: ProductTag[]) => void;
  maxTags?: number;
}

export const ProductTagsInput: React.FC<ProductTagsInputProps> = ({
  categoryId,
  selectedTags,
  onTagsChange,
  maxTags = 10,
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ProductTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inputValue.trim().length > 1) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, categoryId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const normalizedInput = inputValue.toLowerCase().trim();

      // Firestore doesn't support ILIKE, so we'll fetch tags and filter client-side
      // For better performance with large datasets, we'd use Algolia or Typesense
      let tags: ProductTag[] = [];

      try {
        // If categoryId is provided, filter by category; otherwise fetch general suggestions
        const filters = categoryId
          ? [
            { field: 'category_id', operator: '==', value: categoryId },
            { field: 'is_approved', operator: '==', value: true }
          ]
          : [
            { field: 'is_approved', operator: '==', value: true }
          ];

        tags = await FirestoreService.getDocuments<ProductTag>(COLLECTIONS.PRODUCT_TAGS, {
          filters: filters as any,
          limitCount: 50 // Fetch more to filter client-side
        });
      } catch (err) {
        // If query fails (e.g., permission denied), continue with empty suggestions
        console.warn('Could not load tag suggestions:', err);
      }

      const filteredSuggestions = (tags || [])
        .filter(tag => tag.tag_name.includes(normalizedInput))
        .filter(tag => !selectedTags.some(selected => selected.id === tag.id))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error loading tag suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (tag?: ProductTag) => {
    if (selectedTags.length >= maxTags) {
      return;
    }

    let tagToAdd: ProductTag;

    if (tag) {
      tagToAdd = tag;
    } else {
      const trimmedValue = inputValue.trim();
      if (!trimmedValue) return;

      const normalizedName = trimmedValue.toLowerCase();
      const existingTag = suggestions.find((s) => s.tag_name === normalizedName);

      if (existingTag) {
        tagToAdd = existingTag;
      } else {
        // Create a new custom tag - works even without category
        try {
          const newTagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newTagData = {
            id: newTagId,
            tag_name: normalizedName,
            display_name: trimmedValue,
            category_id: categoryId || null, // Allow null category
            usage_count: 0,
            created_by: user?.uid,
            is_approved: true,
            created_at: new Date().toISOString()
          };

          // Try to save to Firestore, but don't block if it fails
          try {
            await FirestoreService.setDocument(COLLECTIONS.PRODUCT_TAGS, newTagId, newTagData);
          } catch (saveError) {
            console.warn('Could not save tag to database (will still add locally):', saveError);
          }

          // We need to cast to ProductTag because FirestoreService doesn't return the object on setDocument
          tagToAdd = newTagData as unknown as ProductTag;
        } catch (error) {
          console.error('Error creating new tag:', error);
          return;
        }
      }
    }

    if (!selectedTags.some((selected) => selected.id === tagToAdd.id)) {
      onTagsChange([...selectedTags, tagToAdd]);
    }

    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAddTag(suggestions[0]);
      } else {
        handleAddTag();
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-neutral-600" />
        <label className="font-sans font-medium text-neutral-700">
          Product Tags (Sub-categories)
        </label>
        <span className="font-sans text-sm text-neutral-500">
          {selectedTags.length}/{maxTags}
        </span>
      </div>

      <p className="font-sans text-sm text-neutral-600">
        Add tags to help customers find your product. Start typing to see suggestions from other
        vendors in this category.
      </p>

      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim().length > 1 && setShowSuggestions(true)}
            disabled={selectedTags.length >= maxTags}
            className="flex-1 h-10 px-4 rounded-lg border border-neutral-200 font-sans text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:cursor-not-allowed"
            placeholder={
              selectedTags.length >= maxTags
                ? `Maximum ${maxTags} tags reached`
                : 'Type a tag and press Enter...'
            }
          />
          <button
            type="button"
            onClick={() => handleAddTag()}
            disabled={!inputValue.trim() || selectedTags.length >= maxTags}
            className="h-10 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-sans text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 border-b border-neutral-100 bg-neutral-50">
              <p className="font-sans text-xs text-neutral-600 font-medium">
                Suggested tags from other vendors
              </p>
            </div>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between group"
              >
                <span className="font-sans text-sm text-neutral-900">
                  {suggestion.display_name}
                </span>
                <span className="font-sans text-xs text-neutral-500">
                  {suggestion.usage_count} {suggestion.usage_count === 1 ? 'product' : 'products'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-lg">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-full font-sans text-sm text-neutral-700 shadow-sm"
            >
              <Tag className="w-3 h-3" />
              {tag.display_name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="font-sans text-xs text-blue-700">
          <strong>Tip:</strong> Use specific tags that describe your product. For example, instead
          of just "shoes", use "women's sneakers", "leather boots", or "running shoes". Popular
          tags used by other vendors will appear as suggestions.
        </p>
      </div>
    </div>
  );
};
