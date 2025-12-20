
import React, { useState, useEffect } from 'react';

interface HomeViewProps {
  onStartChat: (initialQuery: string, autoLive?: boolean) => void;
  onStartCamera: () => void;
  onOpenMenu: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStartChat, onStartCamera, onOpenMenu }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default behavior to avoid text selection or other issues
    if (e && e.cancelable) {
        e.preventDefault();
    }
    
    // If already listening, do nothing
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别功能。请尝试使用Chrome或Safari浏览器。");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      // Continuous is important for long press logic
      recognition.continuous = true;

      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };
      
      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Voice recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
            alert('无法访问麦克风。请检查权限设置，或确保您正在使用 HTTPS / Localhost 访问。');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            alert('语音识别出错: ' + event.error);
        }
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Transcript:', transcript);
        if (transcript.trim()) {
           setQuery(transcript);
           setTimeout(() => onStartChat(transcript), 600);
        }
      };

      recognition.start();
      (window as any).currentRecognition = recognition;
    } catch (err) {
      console.error('Failed to start recognition', err);
      setIsListening(false);
    }
  };

  const stopListening = (e?: React.MouseEvent | React.TouchEvent) => {
      if (e && e.cancelable) {
          e.preventDefault();
      }
      console.log('Stopping voice recognition...');
      const recognition = (window as any).currentRecognition;
      if (recognition) {
          recognition.stop();
          // Don't set isListening to false here immediately, wait for onend
      }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onStartChat(query);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-light overflow-hidden">
      <div className="pt-16 pb-8 px-8 flex flex-col items-center animate-in slide-in-from-top duration-500">
        <h1 className="text-4xl font-bold text-black tracking-tight mb-2">抽屉</h1>
        <p className="text-gray-500 text-sm font-medium bg-white px-4 py-1 rounded-full shadow-sm">你的收纳小帮手</p>
      </div>

      <div className="flex-1 px-6 pb-24 max-w-lg mx-auto w-full flex flex-col gap-6 overflow-y-auto">
        
        {/* Big Search Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 animate-in zoom-in-95 duration-500 delay-100">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <i className="fa-solid fa-magnifying-glass text-lg"></i>
             </div>
             <h2 className="text-xl font-bold text-black">找东西</h2>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <button 
               onMouseDown={(e) => startListening(e)}
               onMouseUp={(e) => stopListening(e)}
               onMouseLeave={(e) => isListening && stopListening(e)}
               onTouchStart={(e) => startListening(e)}
               onTouchEnd={(e) => stopListening(e)}
               onTouchCancel={(e) => stopListening(e)}
               onContextMenu={(e) => e.preventDefault()}
               style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
               className={`h-32 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all touch-none ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white active:scale-95'}`}
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
             <h2 className="text-xl font-bold text-black group-hover:text-primary transition-colors">记东西</h2>
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
             <h2 className="text-xl font-bold text-black group-hover:text-primary transition-colors">百宝箱</h2>
             <p className="text-sm text-gray-400 font-medium">看看我都存了啥</p>
           </div>
           <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-active:scale-90 transition-transform">
             <i className="fa-solid fa-box-open text-2xl"></i>
           </div>
        </button>

      </div>
    </div>
  );
};

export default HomeView;
