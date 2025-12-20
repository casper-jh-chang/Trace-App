
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import { StorageItem, SceneType, AIItem } from '../types';

interface StorageViewProps {
  onAddItems: (items: StorageItem[]) => void;
  initialImage?: string | null;
}

const StorageView: React.FC<StorageViewProps> = ({ onAddItems, initialImage }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<(AIItem & { croppedUrl?: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      triggerAnalysis(initialImage);
    }
  }, [initialImage]);

  const cropItemImage = (img: HTMLImageElement, box: number[]): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;
    const [ymin, xmin, ymax, xmax] = box;
    const width = (xmax - xmin) / 1000 * img.naturalWidth;
    const height = (ymax - ymin) / 1000 * img.naturalHeight;
    const x = xmin / 1000 * img.naturalWidth;
    const y = ymin / 1000 * img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const triggerAnalysis = async (base64: string) => {
    setAnalyzing(true);
    setDetectedItems([]);
    try {
      const data = await analyzeImage(base64);
      const img = new Image();
      img.src = base64;
      await new Promise(resolve => img.onload = resolve);
      const itemsWithCrops = data.items.map(item => ({
        ...item,
        croppedUrl: cropItemImage(img, item.box_2d)
      }));
      setDetectedItems(itemsWithCrops);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("AI 识别失败，请确保网络连接正常并重试。");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index: number, field: keyof AIItem, value: any) => {
    const newItems = [...detectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDetectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setDetectedItems(detectedItems.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    if (detectedItems.length === 0) return;
    setSyncing(true);
    setTimeout(() => {
      const newStorageItems: StorageItem[] = detectedItems.map(item => ({
        id: crypto.randomUUID(),
        name: item.itemName,
        category: item.category,
        scene: item.scene,
        locationDetail: item.preciseLocation,
        remarks: item.remarks,
        imageUrl: item.croppedUrl || image || '',
        fullImageUrl: image || '',
        timestamp: Date.now(),
      }));
      onAddItems(newStorageItems);
      setSyncing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="px-4 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-black mb-6">收纳预览</h1>

        {analyzing ? (
          <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center border border-gray-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-[15px] font-bold text-black">正在分析图中物品...</p>
          </div>
        ) : detectedItems.length > 0 ? (
          <div className="space-y-6">
            {detectedItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex p-4 border-b border-gray-50">
                  <img src={item.croppedUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-50 border border-gray-100" />
                  <div className="ml-4 flex-1">
                    <input 
                      type="text" 
                      value={item.itemName}
                      onChange={e => updateItem(idx, 'itemName', e.target.value)}
                      className="w-full p-0 border-none font-bold text-[17px] focus:ring-0 text-black mb-1"
                      placeholder="物品名称"
                    />
                    <div className="flex items-center">
                      <select 
                        value={item.scene}
                        onChange={e => updateItem(idx, 'scene', e.target.value)}
                        className="text-[13px] text-black font-bold bg-transparent border-none p-0 focus:ring-0 appearance-none"
                      >
                        {Object.values(SceneType).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-black transition-colors">
                    <i className="fa-solid fa-circle-xmark text-xl"></i>
                  </button>
                </div>
                <div className="p-4 bg-gray-50/30 grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight block mb-1">具体存放位置</label>
                    <input 
                      type="text" 
                      value={item.preciseLocation}
                      onChange={e => updateItem(idx, 'preciseLocation', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-0 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight block mb-1">特征备注</label>
                    <textarea 
                      rows={2}
                      value={item.remarks}
                      onChange={e => updateItem(idx, 'remarks', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-0 resize-none font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <button 
                onClick={handleSaveAll}
                disabled={syncing}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-[17px] shadow-sm disabled:opacity-50"
              >
                {syncing ? '同步中...' : `保存并同步 ${detectedItems.length} 件物品`}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
            <i className="fa-solid fa-camera text-gray-200 text-4xl mb-4"></i>
            <p className="text-gray-500 font-bold">请点击下方加号拍照或选择图片</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageView;
