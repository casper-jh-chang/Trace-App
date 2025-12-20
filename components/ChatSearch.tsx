
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
  modelName?: string;
}

const CroppedImage = ({ src, box2d, alt }: { src: string, box2d: number[], alt: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    
    img.onload = () => {
        const [xmin, ymin, xmax, ymax] = box2d;
        // box2d is 0-1000 normalized
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        
        const x = (xmin / 1000) * w;
        const y = (ymin / 1000) * h;
        const width = ((xmax - xmin) / 1000) * w;
        const height = ((ymax - ymin) / 1000) * h;
        
        // Add some padding (optional, e.g. 10%)
        const padX = width * 0.1;
        const padY = height * 0.1;
        
        // Clamp to image boundaries
        const sx = Math.max(0, x - padX);
        const sy = Math.max(0, y - padY);
        const sWidth = Math.min(w - sx, width + 2 * padX);
        const sHeight = Math.min(h - sy, height + 2 * padY);

        canvas.width = sWidth;
        canvas.height = sHeight;
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    };
  }, [src, box2d]);

  return <canvas ref={canvasRef} className="w-24 h-24 object-contain bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0" />;
};

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
            // Use the fresh box_2d if available, otherwise fallback to existing
            const itemToUse = detail.box_2d ? { ...item, box_2d: detail.box_2d } : item;
            matchMap.get(scene.id)!.items.push(itemToUse);
          }
        }
      });
        
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: aiResponse.answer, 
        matches: Array.from(matchMap.values()),
        modelName: aiResponse.modelName
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
              {msg.modelName && (
                <div className="mt-2 text-[10px] opacity-50 font-medium text-right border-t border-gray-200/20 pt-1">
                  Generated by {msg.modelName}
                </div>
              )}
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
                
                <div className="relative w-full bg-gray-100 overflow-hidden">
                  <img src={match.scene.fullImageUrl} className="w-full h-auto block" alt="Search result" />
                </div>

                <div className="p-4 bg-gray-50 space-y-3">
                  {match.items.map((item, iIdx) => (
                    <div key={iIdx} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-3">
                      <CroppedImage src={match.scene.fullImageUrl} box2d={item.box_2d} alt={item.itemName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px] font-bold text-black truncate">{item.itemName}</span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0">{item.category}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 flex items-start leading-snug">
                          <i className="fa-solid fa-map-pin mr-1.5 mt-0.5 text-gray-400 text-[10px]"></i>
                          <span className="truncate"><strong className="text-black font-medium">{item.preciseLocation}</strong></span>
                        </p>
                        {item.remarks && (
                           <p className="text-[11px] text-gray-400 mt-1 italic truncate">"{item.remarks}"</p>
                        )}
                      </div>
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
