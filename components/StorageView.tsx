
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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // 兼容性更好的 ID 生成器
  const generateId = () => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (e) {}
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  };

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      triggerAnalysis(initialImage);
    }
  }, [initialImage]);

  const cropItemImage = (img: HTMLImageElement, box: number[]): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return img.src;
      
      const [ymin, xmin, ymax, xmax] = box;
      const nw = img.naturalWidth || img.width || 1;
      const nh = img.naturalHeight || img.height || 1;
      
      const width = Math.max(1, ((xmax - xmin) / 1000) * nw);
      const height = Math.max(1, ((ymax - ymin) / 1000) * nh);
      const x = (xmin / 1000) * nw;
      const y = (ymin / 1000) * nh;
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      // 降低图片质量以节省空间
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (e) {
      console.error("Crop failed", e);
      return img.src;
    }
  };

  const triggerAnalysis = async (base64: string) => {
    if (!isMounted.current) return;
    setAnalyzing(true);
    setDetectedItems([]);
    try {
      const data = await analyzeImage(base64);
      if (!isMounted.current) return;
      
      const img = new Image();
      img.src = base64;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(reject, 15000);
      });
      
      if (!isMounted.current) return;

      const itemsWithCrops = (data.items || []).map(item => ({
        ...item,
        croppedUrl: item.box_2d ? cropItemImage(img, item.box_2d) : base64
      }));
      setDetectedItems(itemsWithCrops);
    } catch (error) {
      console.error("Analysis failed", error);
      if (isMounted.current) {
        alert("识别失败，请尝试重新拍照。");
      }
    } finally {
      if (isMounted.current) {
        setAnalyzing(false);
      }
    }
  };

  const updateItem = (index: number, field: keyof AIItem, value: any) => {
    setDetectedItems(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    if (detectedItems.length === 0 || syncing) return;
    setSyncing(true);
    
    // 微小延迟确保 UI 渲染 Loading
    setTimeout(() => {
      try {
        const newStorageItems: StorageItem[] = detectedItems.map(item => ({
          id: generateId(),
          name: item.itemName || '未命名物品',
          category: item.category || '通用',
          scene: item.scene || SceneType.OTHER,
          locationDetail: item.preciseLocation || '未知位置',
          remarks: item.remarks || '',
          imageUrl: item.croppedUrl || '', 
          fullImageUrl: '', // 关键：不再保存巨大的原始全图，以节省空间
          timestamp: Date.now(),
        }));
        
        onAddItems(newStorageItems);
      } catch (err) {
        console.error("Save failed", err);
        if (isMounted.current) {
          setSyncing(false);
          alert("保存失败，可能是空间已满。");
        }
      }
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] relative">
      {syncing && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-[17px] font-bold text-black">正在存入抽屉...</p>
        </div>
      )}

      <div className="px-4 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-black mb-6">收纳预览</h1>

        {analyzing ? (
          <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center border border-gray-200 shadow-sm">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-[15px] font-bold text-black">AI 正在扫描并分类...</p>
          </div>
        ) : detectedItems.length > 0 ? (
          <div className="space-y-6">
            {detectedItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex p-4 border-b border-gray-50">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <img src={item.croppedUrl} className="w-full h-full object-cover" alt="item" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={item.itemName || ''}
                      onChange={e => updateItem(idx, 'itemName', e.target.value)}
                      className="w-full p-0 border-none font-bold text-[17px] focus:ring-0 text-black mb-1 truncate"
                      placeholder="物品名称"
                    />
                    <div className="flex items-center">
                      <select 
                        value={item.scene}
                        onChange={e => updateItem(idx, 'scene', e.target.value)}
                        className="text-[13px] text-black font-bold bg-transparent border-none p-0 focus:ring-0 appearance-none cursor-pointer"
                      >
                        {Object.values(SceneType).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="ml-2 text-gray-300 hover:text-black transition-colors self-start">
                    <i className="fa-solid fa-circle-xmark text-xl"></i>
                  </button>
                </div>
                <div className="p-4 bg-gray-50/30 grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight block mb-1">具体存放位置</label>
                    <input 
                      type="text" 
                      value={item.preciseLocation || ''}
                      onChange={e => updateItem(idx, 'preciseLocation', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-0 font-medium"
                      placeholder="填写具体柜子或层数"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight block mb-1">备注</label>
                    <textarea 
                      rows={2}
                      value={item.remarks || ''}
                      onChange={e => updateItem(idx, 'remarks', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:ring-0 font-medium"
                      placeholder="额外的信息..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center border border-gray-200 shadow-sm text-center">
             <i className="fa-solid fa-camera text-4xl text-gray-200 mb-4"></i>
             <p className="text-gray-400 font-bold">未检测到物品</p>
          </div>
        )}
      </div>

      {detectedItems.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-4 z-40">
          <button 
            onClick={handleSaveAll}
            disabled={syncing}
            className="max-w-md mx-auto w-full py-4 bg-black text-white rounded-xl font-bold text-[17px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
          >
            确认收纳 ({detectedItems.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default StorageView;
