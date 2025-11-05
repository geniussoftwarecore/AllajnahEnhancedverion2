import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

function QuickReplySelector({ isOpen, onClose, onSelect }) {
  const [quickReplies, setQuickReplies] = useState([]);
  const [filteredReplies, setFilteredReplies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewReply, setPreviewReply] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadQuickReplies();
    }
  }, [isOpen]);

  useEffect(() => {
    filterReplies();
  }, [searchTerm, selectedCategory, quickReplies]);

  const loadQuickReplies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quick-replies');
      setQuickReplies(response.data);
      
      const uniqueCategories = [...new Set(response.data.map(r => r.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading quick replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReplies = () => {
    let filtered = quickReplies;

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(term) || 
        r.content.toLowerCase().includes(term)
      );
    }

    setFilteredReplies(filtered);
  };

  const handleSelect = (reply) => {
    onSelect(reply.content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">اختر رداً سريعاً</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الردود السريعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-sm ${
                  !selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                الكل
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : filteredReplies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد ردود سريعة</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {filteredReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      previewReply?.id === reply.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setPreviewReply(reply)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reply.title}</h3>
                        {reply.category && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {reply.category}
                          </span>
                        )}
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {reply.content}
                        </p>
                      </div>
                      {previewReply?.id === reply.id && (
                        <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mr-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 sticky top-0">
                {previewReply ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">معاينة الرد</h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">{previewReply.title}</h4>
                      {previewReply.category && (
                        <span className="inline-block mb-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {previewReply.category}
                        </span>
                      )}
                      <p className="text-gray-700 whitespace-pre-wrap">{previewReply.content}</p>
                    </div>
                    <button
                      onClick={() => handleSelect(previewReply)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      استخدام هذا الرد
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    اختر رداً لمعاينته
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickReplySelector;
