
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { queryInventory } from '../services/aiService';
import { SceneRecord, ChatMessage, AIItem, ChatAIResponse } from '../types';

interface ChatSearchProps {
  scenes: SceneRecord[];
  initialQuery?: string;
  autoStartLive?: boolean;
  onLiveEnd?: () => void;
}

interface MatchResult {
  scene: SceneRecord;
  items: AIItem[];
}

interface ExtendedChatMessage extends ChatMessage {
  matches?: MatchResult[];
}

const ChatSearch: React.FC<ChatSearchProps> = ({ scenes, initialQuery, autoStartLive, onLiveEnd }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentInitialQuery = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = useCallback(async (text?: string) => {
    const query = text || inputValue;
    if (!query.trim() || loading) return;
    setInputValue('');
    const userMsg: ExtendedChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    try {
      const aiResponse: ChatAIResponse = await queryInventory(query, scenes, messages);
      
      // 聚合匹配结果：一个场景下可能有多个匹配物品
      const matchMap = new Map<string, MatchResult>();
      
      aiResponse.matchedItemDetails?.forEach(detail => {
        const scene = scenes.find(s => s.id === detail.sceneId);
        if (scene) {
          const item = scene.items.find(it => it.itemName === detail.itemName);
          if (item) {
            if (!matchMap.has(scene.id)) {
              matchMap.set(scene.id, { scene, items: [] });
            }
            matchMap.get(scene.id)!.items.push(item);
          }
        }
      });
        
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: aiResponse.answer, 
        matches: Array.from(matchMap.values())
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: "抱歉，我的大脑断网了。" }]);
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, messages, scenes]);

  useEffect(() => {
    if (initialQuery && !hasSentInitialQuery.current) {
      hasSentInitialQuery.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center justify-center">
        <div className="font-bold text-[17px]">视觉检索</div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar pb-40">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-br-sm' : 'bg-white text-black rounded-bl-sm border border-gray-100'}`}>
              {msg.content}
            </div>
            
            {msg.matches?.map((match, mIdx) => (
              <div key={`${idx}-${mIdx}`} className="mt-4 w-full max-w-[95%] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-white">
                  <span className="text-[12px] font-bold text-black flex items-center">
                    <i className="fa-solid fa-location-dot mr-1.5 text-blue-500"></i>
                    {match.scene.locationCategory}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(match.scene.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="relative w-full aspect-video sm:aspect-square bg-gray-100 overflow-hidden">
                  <img src={match.scene.fullImageUrl} className="w-full h-full object-contain" alt="Search result" />
                  
                  {/* Bounding Boxes Overlay */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                    {match.items.map((item, iIdx) => {
                      const [ymin, xmin, ymax, xmax] = item.box_2d;
                      return (
                        <g key={iIdx}>
                          <rect 
                            x={xmin} y={ymin} width={xmax - xmin} height={ymax - ymin}
                            fill="none" stroke="#3B82F6" strokeWidth="8" rx="10"
                            className="animate-pulse shadow-2xl"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}
                          />
                          <circle cx={xmin + (xmax-xmin)/2} cy={ymin + (ymax-ymin)/2} r="15" fill="#3B82F6" className="animate-ping" />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="p-4 bg-gray-50 space-y-3">
                  {match.items.map((item, iIdx) => (
                    <div key={iIdx} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[14px] font-bold text-black">{item.itemName}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{item.category}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 flex items-start">
                        <i className="fa-solid fa-map-pin mr-2 mt-0.5 text-gray-400"></i>
                        <span>精准位置：<strong className="text-black">{item.preciseLocation}</strong></span>
                      </p>
                      {item.remarks && (
                         <p className="text-[11px] text-gray-400 mt-1 italic pl-5">备注: {item.remarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 px-2">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
            <span className="text-gray-400 text-[11px] font-bold tracking-tight">AI 正在扫描视觉记忆...</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-4">
        <div className="max-w-md mx-auto flex items-center bg-white rounded-full border border-gray-200 shadow-2xl px-2 py-1">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="找什么？例如：我的耳机..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-[15px]"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || loading}
            className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg disabled:opacity-30 transition-transform active:scale-90"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
