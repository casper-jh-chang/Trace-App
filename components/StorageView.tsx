
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
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
      <div className="px-4 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-black mb-6">视觉记忆存入</h1>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-6 shadow-sm">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">这张照片拍的是哪里？</label>
          <input 
            type="text" 
            value={batchLocation}
            onChange={e => setBatchLocation(e.target.value)}
            placeholder="如：卧室书桌、厨房冰箱..."
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[15px] focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative mb-6">
          <img src={image || ''} className="w-full h-auto object-cover max-h-[60vh]" />
          {analyzing && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold">AI 正在建立视觉索引...</p>
            </div>
          )}
          {!analyzing && detectedItems.length > 0 && (
             <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-[11px] font-bold">
               识别到 {detectedItems.length} 个物品
             </div>
          )}
        </div>

        {!analyzing && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">自动标记结果</h3>
            <div className="flex flex-wrap gap-2">
              {detectedItems.map((it, idx) => (
                <span key={idx} className="bg-gray-100 text-black px-3 py-1.5 rounded-lg text-[13px] font-medium">
                  {it.itemName}
                </span>
              ))}
              {detectedItems.length === 0 && <p className="text-gray-400 text-xs">未识别到具体物品</p>}
            </div>
          </div>
        )}
      </div>

      {!analyzing && (
        <div className="fixed bottom-24 left-0 w-full px-4">
          <button 
            onClick={handleSaveScene} 
            disabled={syncing}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-[17px] shadow-xl disabled:opacity-50"
          >
            {syncing ? '存入中...' : '确认存入记忆'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageView;
