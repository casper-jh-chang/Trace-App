
import React from 'react';

interface NavigationProps {
  activeTab: 'storage' | 'chat' | 'gallery';
  setActiveTab: (tab: any) => void;
  onCameraClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onCameraClick }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full glass-nav z-50 h-20 px-6">
      <nav className="flex justify-around items-center h-full max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'chat' ? 'text-black' : 'text-gray-300'}`}
        >
          <i className="fa-solid fa-brain text-[22px]"></i>
          <span className="text-[10px] font-bold mt-1">检索记忆</span>
        </button>
        
        <div className="relative -top-6">
          <button 
            onClick={() => onCameraClick ? onCameraClick() : setActiveTab('storage')}
            className="w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-[6px] border-[#F2F2F7]"
          >
            <i className="fa-solid fa-camera text-2xl"></i>
          </button>
        </div>
        
        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'gallery' ? 'text-black' : 'text-gray-300'}`}
        >
          <i className="fa-solid fa-images text-[22px]"></i>
          <span className="text-[10px] font-bold mt-1">相册</span>
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
