
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const PosterView: React.FC = () => {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePoster = async () => {
    setLoading(true);
    // Fix: Create instance right before call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: "A professional high-resolution minimalist poster for a mobile app named 'Drawer' (抽屉). The style is Apple-native minimalist, entirely black and white. Concept: 'Invisible organization'. The image features a clean, organized wooden shelf with a single smartphone leaning against a wall. The smartphone screen shows a UI with thin white bounding boxes identifying a set of keys and a watch. At the top of the poster, elegant bold typography in black reads '抽屉' and '不再遗忘' in a smaller font below it. High contrast, sharp focus, cinematic lighting, 8k resolution, architectural photography style, vertical composition.",
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16", // Closest to 800x1200
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setPosterUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Poster generation failed", error);
      alert("海报生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] p-6 pb-32 overflow-y-auto">
      <h1 className="text-2xl font-bold text-black mb-6">应用宣传海报</h1>
      
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col items-center">
        {posterUrl ? (
          <div className="w-full animate-in fade-in duration-700">
            <img 
              src={posterUrl} 
              alt="App Poster" 
              className="w-full rounded-xl shadow-2xl border border-gray-100"
              style={{ aspectRatio: '800/1200' }}
            />
            <p className="text-gray-400 text-[11px] mt-4 text-center font-bold uppercase tracking-widest">长按保存海报 (800 x 1200, 150+ DPI 风格)</p>
          </div>
        ) : (
          <div className="w-full aspect-[8/12] bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-black">AI 正在构思极简海报...</p>
              </div>
            ) : (
              <div className="text-center px-10">
                <i className="fa-solid fa-wand-magic-sparkles text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 font-bold mb-6">生成一张黑白风格的视觉海报</p>
                <button 
                  onClick={generatePoster}
                  className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm active:scale-95 transition-transform"
                >
                  立即生成
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="font-bold text-black">设计规格</h3>
        <ul className="text-sm text-gray-500 space-y-2 font-medium">
          <li>• 风格：Apple 原生极简主义 (Native Minimalist)</li>
          <li>• 色调：纯黑白 (Monochrome)</li>
          <li>• 比例：800 x 1200 (基于 9:16 生成)</li>
          <li>• 主题：视觉智能与收纳美学</li>
        </ul>
      </div>
    </div>
  );
};

export default PosterView;
