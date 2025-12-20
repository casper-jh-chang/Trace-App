
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { queryInventory } from '../services/geminiService';
import { StorageItem, ChatMessage } from '../types';

interface ChatSearchProps {
  inventory: StorageItem[];
  initialQuery?: string;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ inventory, initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const aiResponse = await queryInventory(query, inventory, messages);
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "网络连接似乎有问题，请重试。" }]);
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
    <div className="flex flex-col h-full bg-white">
      <div className="glass-header px-4 py-3 sticky top-0 z-10 text-center font-bold text-[17px]">
        智能寻找
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar pb-40"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
            <i className="fa-solid fa-robot text-4xl mb-4 text-black"></i>
            <p className="text-[17px] font-bold text-black">问问我在哪？</p>
            <p className="text-sm text-gray-500 mt-1">例如：“我的车钥匙在哪？”</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug shadow-sm ${
              msg.role === 'user' 
              ? 'bg-black text-white rounded-br-sm' 
              : 'bg-gray-100 text-black rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex space-x-1.5">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-4">
        <div className="max-w-md mx-auto flex items-center bg-gray-100 rounded-full border border-gray-200 px-1 py-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-black transition-all">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="询问物品位置..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-[15px]"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loading}
            className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          >
            <i className="fa-solid fa-arrow-up text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
