
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/aiService';
import { getCategories } from '../services/dbService';
import { SceneRecord, AIItem, SceneType } from '../types';

interface StorageViewProps {
  onAddScene: (scene: SceneRecord) => void;
  initialImage?: string | null;
  existingScenes: SceneRecord[];
  onDeleteScene: (id: string) => Promise<void>;
}

const StorageView: React.FC<StorageViewProps> = ({ onAddScene, initialImage, existingScenes, onDeleteScene }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [batchLocation, setBatchLocation] = useState(''); 
  const [detectedItems, setDetectedItems] = useState<AIItem[]>([]);
  const isMounted = useRef(true);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [needFocusLocation, setNeedFocusLocation] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictId, setConflictId] = useState<string | null>(null);

  // Space Management
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');

  // Item Edit Management
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    isMounted.current = true;
    getCategories().then(setExistingCategories).catch(console.error);
    const lastSpace = localStorage.getItem('last_selected_space');
    if (lastSpace) setSelectedSpace(lastSpace);
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (selectedSpace) {
      localStorage.setItem('last_selected_space', selectedSpace);
    }
  }, [selectedSpace]);

  useEffect(() => {
    if (!needFocusLocation) return;
    const start = Date.now();
    const tryFocus = () => {
      const el = locationInputRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        el.select();
        setNeedFocusLocation(false);
        return;
      }
      if (Date.now() - start < 1000) {
        requestAnimationFrame(tryFocus);
      } else {
        setNeedFocusLocation(false);
      }
    };
    tryFocus();
  }, [needFocusLocation]);

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
      
      if (data.suggestedLocation && !batchLocation) {
        setBatchLocation(data.suggestedLocation);
      }
    } catch (e) {
      alert("AI 扫描遇到一点问题");
    } finally {
      if (isMounted.current) setAnalyzing(false);
    }
  };

  const handleSaveScene = async () => {
    if (!image || syncing) return;
    
    const locationName = batchLocation.trim() || '未命名位置';
    const existing = existingScenes.find(s => s.locationCategory === locationName);
    
    if (existing) {
      setConflictId(existing.id);
      setShowConflictModal(true);
      return;
    }

    await performSave(locationName);
  };

  const performSave = async (locationName: string) => {
    setSyncing(true);
    try {
      const compressedImage = await resizeImage(image!); // image checked before
      const newScene: SceneRecord = {
        id: generateId(),
        fullImageUrl: compressedImage,
        timestamp: Date.now(),
        locationCategory: locationName,
        superCategory: selectedSpace || undefined,
        items: detectedItems
      };
      onAddScene(newScene);
    } catch (e) {
      alert("保存失败");
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    if (conflictId) {
      await onDeleteScene(conflictId);
    }
    setShowConflictModal(false);
    setConflictId(null);
    const locationName = batchLocation.trim() || '未命名位置';
    await performSave(locationName);
  };

  const handleCancelOverwrite = () => {
    setShowConflictModal(false);
    setConflictId(null);
    setNeedFocusLocation(true);
  };

  const handleItemClick = (index: number) => {
    setEditingIndex(index);
    setEditingName(detectedItems[index].itemName);
    setItemModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingIndex(null);
    setEditingName('');
    setItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingName.trim()) return;
    
    if (editingIndex !== null) {
      // Edit
      const newItems = [...detectedItems];
      newItems[editingIndex] = { ...newItems[editingIndex], itemName: editingName.trim() };
      setDetectedItems(newItems);
    } else {
      // Add
      const newItem: AIItem = {
        itemName: editingName.trim(),
        category: '手动添加',
        scene: SceneType.OTHER,
        preciseLocation: batchLocation || '未命名位置',
        remarks: '',
        box_2d: [0, 0, 0, 0]
      };
      setDetectedItems([...detectedItems, newItem]);
    }
    setItemModalOpen(false);
  };

  const handleDeleteItem = () => {
    if (editingIndex !== null) {
      const newItems = [...detectedItems];
      newItems.splice(editingIndex, 1);
      setDetectedItems(newItems);
    }
    setItemModalOpen(false);
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
          <div className="flex gap-3">
            <div className="relative w-1/3 min-w-[120px]">
              <select
                value={selectedSpace}
                onChange={e => setSelectedSpace(e.target.value)}
                className="w-full h-full appearance-none bg-gray-50 border-none rounded-2xl pl-4 pr-8 py-4 text-lg font-bold focus:outline-none focus:ring-0 transition-all text-black"
              >
                <option value="" className="text-gray-400">空间...</option>
                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>
            <input 
              ref={locationInputRef}
              type="text" 
              value={batchLocation}
              onChange={e => setBatchLocation(e.target.value)}
              placeholder="比如：书桌..."
              className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-bold placeholder-gray-300 focus:outline-none focus:ring-0 transition-all min-w-0"
            />
          </div>
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
                <button 
                  key={idx} 
                  onClick={() => handleItemClick(idx)}
                  className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform hover:bg-purple-100"
                >
                  {it.itemName}
                </button>
              ))}
              <button 
                  onClick={handleAddClick}
                  className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform hover:bg-gray-200 border border-dashed border-gray-300"
              >
                  <i className="fa-solid fa-plus mr-1"></i>
                  添加
              </button>
              {detectedItems.length === 0 && <p className="text-gray-400 font-medium">没发现特别的东西，手动加一个？</p>}
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

      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">位置重复啦</h3>
            <p className="text-gray-500 mb-6 text-base font-medium">
              “<span className="text-black font-bold">{batchLocation}</span>”已经存在了，要覆盖旧的照片吗？
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleCancelOverwrite}
                className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-95 transition-all text-lg"
              >
                我去改名
              </button>
              <button 
                onClick={handleConfirmOverwrite}
                className="flex-1 py-4 bg-black text-white font-bold rounded-2xl active:scale-95 transition-all text-lg shadow-lg"
              >
                覆盖它
              </button>
            </div>
          </div>
        </div>
      )}

      {itemModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingIndex !== null ? '编辑物品' : '添加物品'}
            </h3>
            
            <input 
              type="text" 
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              placeholder="物品名称"
              autoFocus
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-lg font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            />
            
            <div className="flex gap-3">
              {editingIndex !== null && (
                <button 
                    onClick={handleDeleteItem}
                    className="w-12 flex items-center justify-center bg-red-50 text-red-500 font-bold rounded-2xl active:scale-95 transition-all"
                >
                    <i className="fa-solid fa-trash"></i>
                </button>
              )}
              <button 
                onClick={() => setItemModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-95 transition-all"
              >
                取消
              </button>
              <button 
                onClick={handleSaveItem}
                disabled={!editingName.trim()}
                className="flex-1 py-3 bg-black text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageView;
