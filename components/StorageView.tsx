
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/aiService';
import { SceneRecord, AIItem } from '../types';

interface StorageViewProps {
  onAddScene: (scene: SceneRecord) => void;
  initialImage?: string | null;
}

const StorageView: React.FC<StorageViewProps> = ({ onAddScene, initialImage }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [batchLocation, setBatchLocation] = useState(''); 
  const [detectedItems, setDetectedItems] = useState<AIItem[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  // 压缩图片以节省存储空间
  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  useEffect(() => {
    if (initialImage) {
      triggerAnalysis(initialImage);
    }
  }, [initialImage]);

  const triggerAnalysis = async (base64: string) => {
    if (!isMounted.current) return;
    setAnalyzing(true);
    try {
      const data = await analyzeImage(base64);
      if (!isMounted.current) return;
      setDetectedItems(data.items || []);
    } catch (e) {
      alert("AI 扫描遇到一点问题");
    } finally {
      if (isMounted.current) setAnalyzing(false);
    }
  };

  const handleSaveScene = async () => {
    if (!image || syncing) return;
    setSyncing(true);
    
    try {
      const compressedImage = await resizeImage(image);
      const newScene: SceneRecord = {
        id: generateId(),
        fullImageUrl: compressedImage,
        timestamp: Date.now(),
        locationCategory: batchLocation || '未命名位置',
        items: detectedItems
      };
      onAddScene(newScene);
    } catch (e) {
      alert("保存失败");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] relative">
      <div className="px-6 pt-12 pb-32 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-black mb-8">记录一下</h1>

        <div className="w-full bg-white rounded-3xl p-6 border border-gray-100 mb-6 shadow-sm">
          <label className="text-sm font-bold text-blue-500 mb-3 block">
            <i className="fa-solid fa-location-dot mr-2"></i>
            这是哪里？
          </label>
          <input 
            type="text" 
            value={batchLocation}
            onChange={e => setBatchLocation(e.target.value)}
            placeholder="比如：书桌、冰箱、抽屉..."
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-bold placeholder-gray-300 focus:outline-none focus:ring-0 transition-all"
          />
        </div>

        <div className="w-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative mb-6">
          <img src={image || ''} className="w-full h-auto object-cover max-h-[50vh]" />
          {analyzing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-500">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-bold animate-pulse">正在努力看清...</p>
            </div>
          )}
          {!analyzing && detectedItems.length > 0 && (
             <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md">
               看见了 {detectedItems.length} 个东西
             </div>
          )}
        </div>

        {!analyzing && (
          <div className="w-full bg-white rounded-3xl p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-purple-500 mb-4 block">
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
              我发现了这些
            </h3>
            <div className="flex flex-wrap gap-2">
              {detectedItems.map((it, idx) => (
                <span key={idx} className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold">
                  {it.itemName}
                </span>
              ))}
              {detectedItems.length === 0 && <p className="text-gray-400 font-medium">没发现特别的东西</p>}
            </div>
          </div>
        )}
      </div>

      {!analyzing && (
        <div className="fixed bottom-24 left-0 w-full px-6 z-40">
          <button 
            onClick={handleSaveScene} 
            disabled={syncing}
            className="w-full py-5 bg-black text-white rounded-3xl font-bold text-xl shadow-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                <span>正在记...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check-circle"></i>
                <span>记住了！</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageView;
