
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import StorageView from './components/StorageView';
import MenuView from './components/MenuView';
import ChatSearch from './components/ChatSearch';
import Sidebar from './components/Sidebar';
import { StorageItem, SceneType } from './types';

const STORAGE_KEY = 'smart_organize_items_v2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'storage' | 'menu' | 'chat'>('home');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [initialChatQuery, setInitialChatQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preselectedScene, setPreselectedScene] = useState<SceneType | null>(null);
  
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load items", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const itemsCountByScene = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.scene] = (acc[item.scene] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const handleAddItems = (newItems: StorageItem[]) => {
    setItems(prev => [...newItems, ...prev]);
    const uniqueScenes = Array.from(new Set(newItems.map(item => item.scene)));
    if (uniqueScenes.length === 1) {
      setPreselectedScene(uniqueScenes[0]);
    } else {
      setPreselectedScene(null);
    }
    setPendingImage(null);
    setActiveTab('menu'); 
  };

  const handleRemoveItem = (id: string) => {
    if (window.confirm("确定要删除这条收纳记录吗？")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const startChat = (query: string) => {
    setInitialChatQuery(query);
    setActiveTab('chat');
  };

  const handleSelectSceneFromSidebar = (scene: SceneType) => {
    setPreselectedScene(scene);
    setIsSidebarOpen(false);
    setActiveTab('menu');
  };

  const openMediaSource = (useCamera: boolean) => {
    if (fileInputRef.current) {
      if (useCamera) fileInputRef.current.setAttribute('capture', 'environment');
      else fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
    setIsMediaModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPendingImage(base64String);
        setActiveTab('storage');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col relative overflow-hidden text-black">
      {/* Top Menu Icon */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-12 left-6 z-50 text-black hover:opacity-70 transition-opacity"
      >
        <i className="fa-solid fa-list-ul text-2xl"></i>
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectScene={handleSelectSceneFromSidebar}
        itemsCountByScene={itemsCountByScene}
      />

      {/* iOS Action Sheet Style Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMediaModalOpen(false)}></div>
          <div className="relative w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-2xl overflow-hidden mb-2 divide-y divide-gray-100">
              <button onClick={() => openMediaSource(true)} className="w-full py-4 text-[20px] text-black font-medium active:bg-gray-100 transition-colors">拍照</button>
              <button onClick={() => openMediaSource(false)} className="w-full py-4 text-[20px] text-black font-medium active:bg-gray-100 transition-colors">从相册选取</button>
            </div>
            <button 
              onClick={() => setIsMediaModalOpen(false)}
              className="w-full py-4 bg-white rounded-2xl text-[20px] text-black font-bold active:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <main className="flex-1 overflow-hidden h-full">
        {activeTab === 'home' && (
          <HomeView 
            onStartChat={startChat} 
            onStartCamera={() => setIsMediaModalOpen(true)} 
            onOpenMenu={() => {
              setPreselectedScene(null);
              setActiveTab('menu');
            }}
          />
        )}
        {activeTab === 'storage' && (
          <div className="h-full overflow-y-auto pt-12">
            <button 
              onClick={() => { setActiveTab('home'); setPendingImage(null); }}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <StorageView onAddItems={handleAddItems} initialImage={pendingImage} />
          </div>
        )}
        {activeTab === 'menu' && (
          <div className="h-full overflow-y-auto">
             <button 
              onClick={() => setActiveTab('home')}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <MenuView items={items} onRemoveItem={handleRemoveItem} initialScene={preselectedScene} />
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="h-full">
             <button 
              onClick={() => setActiveTab('home')}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <ChatSearch inventory={items} initialQuery={initialChatQuery} />
          </div>
        )}
      </main>

      {activeTab !== 'home' && !isMediaModalOpen && (
        <Navigation activeTab={activeTab as any} setActiveTab={setActiveTab} onCameraClick={() => setIsMediaModalOpen(true)} />
      )}
    </div>
  );
};

export default App;
