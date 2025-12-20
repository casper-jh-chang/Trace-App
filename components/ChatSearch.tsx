
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { queryInventory, ChatAIResponse } from '../services/geminiService';
import { StorageItem, ChatMessage } from '../types';

interface ChatSearchProps {
  inventory: StorageItem[];
  initialQuery?: string;
  onSelectItem?: (item: StorageItem) => void;
}

interface ExtendedChatMessage extends ChatMessage {
  matchedItems?: StorageItem[];
}

const ChatSearch: React.FC<ChatSearchProps> = ({ inventory, initialQuery, onSelectItem }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialProcessed = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = useCallback(async (text?: string) => {
    const query = text || inputValue;
    if (!query.trim() || loading) return;

    setInputValue('');
    const userMsg: ExtendedChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const aiResponse: ChatAIResponse = await queryInventory(query, inventory, messages);
      
      // 根据 ID 找到对应的物品对象
      const matchedItems = (aiResponse.matchedItemIds || [])
        .map(id => inventory.find(item => item.id === id))
        .filter((item): item is StorageItem => !!item);

      const modelMsg: ExtendedChatMessage = { 
        role: 'model', 
        content: aiResponse.answer,
        matchedItems: matchedItems.length > 0 ? matchedItems : undefined
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat failed", error);
      setMessages(prev => [...prev, { role: 'model', content: "抱歉，我现在无法访问您的抽屉，请稍后再试。" }]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, messages, inventory]);

  useEffect(() => {
    if (initialQuery && !initialProcessed.current) {
      initialProcessed.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery, handleSend]);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="glass-header px-4 py-3 sticky top-0 z-10 text-center font-bold text-[17px]">
        智能寻找
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar pb-40"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl text-black"></i>
            </div>
            <p className="text-[17px] font-bold text-black">想找什么？尽管开口</p>
            <p className="text-sm text-gray-400 mt-2 px-10 leading-relaxed">
              您可以直接问“我的运动鞋在哪”，或者描述特征：“那个蓝色的、圆滑的瓶子在哪？”
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
              ? 'bg-black text-white rounded-br-sm' 
              : 'bg-white text-black rounded-bl-sm border border-gray-100'
            }`}>
              {msg.content}
            </div>

            {/* 如果有匹配的物品，显示物品图片卡片 */}
            {msg.matchedItems && msg.matchedItems.length > 0 && (
              <div className="w-full mt-3 flex overflow-x-auto space-x-3 pb-2 no-scrollbar">
                {msg.matchedItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => onSelectItem?.(item)}
                    className="flex-shrink-0 w-40 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden active:scale-95 transition-transform"
                  >
                    <div className="h-28 bg-gray-50 overflow-hidden">
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div className="p-2">
                      <p className="text-[13px] font-bold text-black truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 truncate flex items-center">
                        <i className="fa-solid fa-location-dot mr-1"></i>
                        {item.locationDetail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex space-x-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-4">
        <div className="max-w-md mx-auto flex items-center bg-white rounded-full border border-gray-200 shadow-lg px-1 py-1 focus-within:ring-2 focus-within:ring-black transition-all">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="描述物品特征或询问位置..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-[15px] text-black"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loading}
            className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
          >
            <i className="fa-solid fa-arrow-up text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
