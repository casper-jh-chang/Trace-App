
import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import StorageView from './components/StorageView';
import ChatSearch from './components/ChatSearch';
import GalleryView from './components/GalleryView';
import Sidebar from './components/Sidebar';
import PosterView from './components/PosterView';
import { SceneRecord } from './types';
import { getAllScenes, addScene, deleteScene } from './services/dbService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'storage' | 'chat' | 'gallery' | 'poster'>('home');
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [initialChatQuery, setInitialChatQuery] = useState('');
  const [liveAutoStart, setLiveAutoStart] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedScenes = await getAllScenes();
        setScenes(storedScenes.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to load visual memory from IndexedDB", e);
      }
    };
    loadData();
  }, []);

  const handleAddScene = async (newScene: SceneRecord) => {
    try {
      await addScene(newScene);
      setScenes(prev => [newScene, ...prev]);
      setActiveTab('gallery'); // 存完去相册看看
      setPendingImage(null);
    } catch (e) {
      alert("视觉记忆存储失败，请检查浏览器配额。");
    }
  };

  const handleDeleteScene = async (id: string) => {
    if (!window.confirm('确定要删除这段记忆吗？相关识别记录也将消失。')) return;
    try {
      await deleteScene(id);
      setScenes(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const startChat = (query: string, autoLive = false) => {
    setInitialChatQuery(query);
    setLiveAutoStart(autoLive);
    setActiveTab('chat');
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
        setPendingImage(reader.result as string);
        setActiveTab('storage');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col relative overflow-hidden text-black">
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-12 left-6 z-50 text-black hover:opacity-70 transition-opacity"
      >
        <i className="fa-solid fa-bars-staggered text-2xl"></i>
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectScene={(scene) => {}} 
        itemsCountByScene={{}} 
        onOpenPoster={() => { setActiveTab('poster'); setIsSidebarOpen(false); }}
      />

      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMediaModalOpen(false)}></div>
          <div className="relative w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-2xl overflow-hidden mb-2 divide-y divide-gray-100 shadow-2xl">
              <button onClick={() => openMediaSource(true)} className="w-full py-4 text-[20px] text-black font-medium active:bg-gray-100 transition-colors">拍照记一下</button>
              <button onClick={() => openMediaSource(false)} className="w-full py-4 text-[20px] text-black font-medium active:bg-gray-100 transition-colors">从相册添加记忆</button>
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
            onOpenMenu={() => setActiveTab('gallery')} 
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
            <StorageView onAddScene={handleAddScene} initialImage={pendingImage} />
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="h-full">
             <button 
              onClick={() => { setActiveTab('home'); setLiveAutoStart(false); }}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <ChatSearch 
              scenes={scenes} 
              initialQuery={initialChatQuery} 
              autoStartLive={liveAutoStart}
              onLiveEnd={() => setLiveAutoStart(false)}
            />
          </div>
        )}
        {activeTab === 'gallery' && (
          <div className="h-full">
            <button 
              onClick={() => setActiveTab('home')}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <GalleryView scenes={scenes} onDelete={handleDeleteScene} />
          </div>
        )}
        {activeTab === 'poster' && (
          <div className="h-full overflow-y-auto pt-12">
            <button 
              onClick={() => setActiveTab('home')}
              className="absolute top-12 right-6 z-50 text-black"
            >
              <i className="fa-solid fa-house text-xl"></i>
            </button>
            <PosterView />
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
