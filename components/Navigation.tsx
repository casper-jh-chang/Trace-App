
import React from 'react';

interface NavigationProps {
  activeTab: 'storage' | 'chat' | 'gallery';
  setActiveTab: (tab: any) => void;
  onCameraClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onCameraClick }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 h-20 pb-1 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <nav className="flex justify-around items-start pt-3 h-full max-w-lg mx-auto">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-start w-20 h-full transition-all active:scale-95 ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-300'}`}
        >
          <i className={`fa-solid fa-magnifying-glass text-2xl mb-1 ${activeTab === 'chat' ? 'scale-110' : ''}`}></i>
          <span className="text-[10px] font-bold">找东西</span>
        </button>
        
        <div className="relative -top-8">
          <button 
            onClick={() => onCameraClick ? onCameraClick() : setActiveTab('storage')}
            className="w-20 h-20 bg-black text-white rounded-2xl shadow-xl flex flex-col items-center justify-center active:scale-90 transition-all border-[4px] border-[#F2F2F7]"
          >
            <i className="fa-solid fa-camera text-3xl mb-0.5"></i>
            <span className="text-[10px] font-bold">记东西</span>
          </button>
        </div>
        
        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center justify-start w-20 h-full transition-all active:scale-95 ${activeTab === 'gallery' ? 'text-purple-500' : 'text-gray-300'}`}
        >
          <i className={`fa-solid fa-box-open text-2xl mb-1 ${activeTab === 'gallery' ? 'scale-110' : ''}`}></i>
          <span className="text-[10px] font-bold">百宝箱</span>
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
