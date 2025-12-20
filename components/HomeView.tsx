
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
    <div className="flex flex-col h-screen w-full bg-[#F2F2F7] overflow-hidden">
      <div className="pt-16 pb-8 px-8 flex flex-col items-center animate-in slide-in-from-top duration-500">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-2">抽屉</h1>
        <p className="text-gray-500 text-sm font-medium bg-white px-4 py-1 rounded-full shadow-sm">你的收纳小帮手</p>
      </div>

      <div className="flex-1 px-6 pb-24 max-w-lg mx-auto w-full flex flex-col gap-6 overflow-y-auto">
        
        {/* Big Search Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 animate-in zoom-in-95 duration-500 delay-100">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
               <i className="fa-solid fa-magnifying-glass text-lg"></i>
             </div>
             <h2 className="text-xl font-bold text-black">找东西</h2>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={startListening}
               className={`h-32 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white active:scale-95'}`}
             >
               <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-3xl`}></i>
               <span className="font-bold text-lg">{isListening ? '正在听...' : '按住说话'}</span>
             </button>

             <button 
               onClick={() => onStartChat('')}
               className="h-32 bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-100 text-black border border-gray-200"
             >
               <i className="fa-regular fa-keyboard text-3xl text-gray-400"></i>
               <span className="font-bold text-lg text-gray-600">打字问</span>
             </button>
           </div>
        </div>

        {/* Big Record Card */}
        <button 
          onClick={onStartCamera}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all animate-in zoom-in-95 duration-500 delay-200"
        >
           <div className="flex flex-col items-start gap-1">
             <h2 className="text-xl font-bold text-black group-hover:text-blue-500 transition-colors">记东西</h2>
             <p className="text-sm text-gray-400 font-medium">拍张照，我帮你记</p>
           </div>
           <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
             <i className="fa-solid fa-camera text-2xl"></i>
           </div>
        </button>

        {/* Gallery Card */}
        <button 
          onClick={onOpenMenu}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all animate-in zoom-in-95 duration-500 delay-300"
        >
           <div className="flex flex-col items-start gap-1">
             <h2 className="text-xl font-bold text-black group-hover:text-purple-500 transition-colors">百宝箱</h2>
             <p className="text-sm text-gray-400 font-medium">看看我都存了啥</p>
           </div>
           <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 group-active:scale-90 transition-transform">
             <i className="fa-solid fa-box-open text-2xl"></i>
           </div>
        </button>

      </div>
    </div>
  );
};

export default HomeView;
