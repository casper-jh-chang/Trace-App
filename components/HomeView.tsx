
import React, { useState, useEffect } from 'react';

interface HomeViewProps {
  onStartChat: (initialQuery: string, autoLive?: boolean) => void;
  onStartCamera: () => void;
  onOpenMenu: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStartChat, onStartCamera, onOpenMenu }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别功能。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setTimeout(() => onStartChat(transcript), 600);
    };

    recognition.start();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onStartChat(query);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F2F2F7]">
      <div className="pt-24 px-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-black tracking-tight">抽屉</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">智能收纳助理</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full">
        {/* 语音助手入口 */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in zoom-in duration-700">
           <button 
            onClick={() => onStartChat('', true)}
            className="group relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100 active:scale-90 transition-all"
           >
              <div className="absolute inset-0 bg-black/5 rounded-full animate-ping [animation-duration:3s]"></div>
              <div className="absolute inset-2 bg-black/5 rounded-full animate-pulse"></div>
              <i className="fa-solid fa-headset text-3xl text-black"></i>
           </button>
           <p className="mt-4 text-[13px] font-bold text-black/60 tracking-widest uppercase">语音交互模式</p>
        </div>

        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden focus-within:border-black transition-colors">
              <i className="fa-solid fa-magnifying-glass ml-4 text-gray-400 text-sm"></i>
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="我的耳机在哪里？"
                className="flex-1 px-3 py-4 bg-transparent border-none focus:ring-0 text-[17px] text-black placeholder:text-gray-400"
              />
              <div className="flex items-center mr-2">
                <button 
                  type="button"
                  onClick={startListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-black'}`}
                >
                  <i className="fa-solid fa-microphone text-sm"></i>
                </button>
                {query && (
                  <button 
                    type="submit"
                    className="ml-1 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center transition-transform active:scale-95"
                  >
                    <i className="fa-solid fa-arrow-up text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <button 
            onClick={onStartCamera}
            className="w-full py-4 bg-black text-white rounded-xl font-semibold text-[17px] shadow-sm active:bg-gray-800 active:scale-[0.99] transition-all"
          >
            <i className="fa-solid fa-camera mr-2"></i>
            开始收纳
          </button>
          
          <button 
            onClick={onOpenMenu}
            className="text-[15px] text-black font-bold hover:underline"
          >
            查看物品清单
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
