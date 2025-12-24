
import React, { useState, useCallback, useEffect } from 'react';
import { 
  AppState, 
  GeminiModel, 
  ImageAspectRatio, 
  ImageStyle, 
  ImageResolution,
  GeneratedImage,
  User
} from './types';
import ImageUploader from './components/ImageUploader';
import ZoomModal from './components/ZoomModal';
import { generateBannerImages } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthMode, setIsAuthMode] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [state, setState] = useState<AppState>({
    currentUser: null,
    inspirationImages: [],
    productImages: [],
    prompt: '',
    selectedModel: GeminiModel.FLASH,
    aspectRatio: ImageAspectRatio.SQUARE,
    selectedResolution: ImageResolution.R1K,
    style: ImageStyle.PROFESSIONAL,
    isGenerating: false,
    generatedImages: [],
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
  });

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('gemini_architect_session');
    if (savedSession) {
      const user = JSON.parse(localStorage.getItem(`user_${savedSession}`) || 'null');
      if (user) {
        setState(prev => ({ 
          ...prev, 
          currentUser: user,
          generatedImages: user.history || []
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (isAuthMode) {
      const savedUser = localStorage.getItem(`user_${authUsername}`);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        localStorage.setItem('gemini_architect_session', authUsername);
        setState(prev => ({ 
          ...prev, 
          currentUser: user, 
          generatedImages: user.history || [] 
        }));
        setError(null);
      } else {
        setError("Tài khoản không tồn tại.");
      }
    } else {
      if (localStorage.getItem(`user_${authUsername}`)) {
        setError("Tài khoản đã tồn tại.");
        return;
      }
      const newUser: User = { username: authUsername, history: [] };
      localStorage.setItem(`user_${authUsername}`, JSON.stringify(newUser));
      localStorage.setItem('gemini_architect_session', authUsername);
      setState(prev => ({ ...prev, currentUser: newUser, generatedImages: [] }));
      setError(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gemini_architect_session');
    setState(prev => ({ ...prev, currentUser: null, generatedImages: [] }));
  };

  const handleGenerate = async () => {
    if (state.inspirationImages.length === 0 || state.productImages.length === 0) {
      setError("Vui lòng upload ít nhất 1 ảnh mẫu và 1 ảnh sản phẩm.");
      return;
    }

    setError(null);
    
    if (state.selectedModel === GeminiModel.PRO) {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio?.openSelectKey();
      }
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const imageUrls = await generateBannerImages(
        state.inspirationImages,
        state.productImages,
        state.prompt,
        state.selectedModel,
        state.aspectRatio,
        state.selectedResolution,
        state.style
      );

      const newImages: GeneratedImage[] = imageUrls.map(url => ({
        id: Math.random().toString(36).substr(2, 9),
        url,
        timestamp: Date.now(),
        style: state.style,
        resolution: state.selectedResolution
      }));

      const updatedHistory = [...newImages, ...state.generatedImages].slice(0, 50);
      
      if (state.currentUser) {
        const updatedUser = { ...state.currentUser, history: updatedHistory };
        localStorage.setItem(`user_${state.currentUser.username}`, JSON.stringify(updatedUser));
        setState(prev => ({ 
          ...prev, 
          currentUser: updatedUser,
          generatedImages: updatedHistory,
          isGenerating: false
        }));
      }
    } catch (err: any) {
      console.error("Lỗi Generate:", err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("Lỗi: Không tìm thấy Key API hợp lệ cho model Pro. Đang mở lại bảng chọn Key...");
        await (window as any).aistudio?.openSelectKey();
      } else {
        setError(`Không thể tạo ảnh: ${err.message || 'Lỗi không xác định'}`);
      }
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const toggleDarkMode = () => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-6 transform -rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Cẩm Nang Gối Lò</h1>
            <p className="text-gray-500 dark:text-gray-400">AI Architect for your Banners</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <input type="text" placeholder="Tên đăng nhập" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" />
            </div>
            <div>
              <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" />
            </div>
            {error && <p className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/10 py-2 rounded-lg px-2">{error}</p>}
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98]">
              {isAuthMode ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsAuthMode(!isAuthMode); setError(null); }} className="text-sm text-primary-500 font-semibold hover:underline">
              {isAuthMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100 flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-500 hidden sm:block">Cẩm Nang Gối Lò</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">{state.currentUser.username.charAt(0)}</div>
              <span className="text-xs font-semibold mr-2">{state.currentUser.username}</span>
              <button onClick={handleLogout} className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase transition-colors">Thoát</button>
            </div>
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {state.isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
            <ImageUploader label="1. Upload banner mẫu" images={state.inspirationImages} onChange={(imgs) => setState(prev => ({ ...prev, inspirationImages: imgs }))} maxImages={3} description="Mẫu thiết kế bạn muốn AI học theo." />
            <ImageUploader label="2. Upload ảnh sản phẩm" images={state.productImages} onChange={(imgs) => setState(prev => ({ ...prev, productImages: imgs }))} maxImages={5} description="Sản phẩm sẽ xuất hiện trong banner." />

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2 block">3. Cấu hình Model</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(Object.keys(GeminiModel) as Array<keyof typeof GeminiModel>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setState(prev => ({ ...prev, selectedModel: GeminiModel[key] }))}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        state.selectedModel === GeminiModel[key]
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {key} {key === 'PRO' && '✨'}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">TỶ LỆ KHUNG HÌNH</span>
                      <select value={state.aspectRatio} onChange={(e) => setState(prev => ({ ...prev, aspectRatio: e.target.value as ImageAspectRatio }))} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:text-white">
                        {Object.entries(ImageAspectRatio).map(([name, val]) => (<option key={name} value={val}>{name} ({val})</option>))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">ĐỘ PHÂN GIẢI</span>
                      <select 
                        value={state.selectedResolution} 
                        onChange={(e) => setState(prev => ({ ...prev, selectedResolution: e.target.value as ImageResolution }))} 
                        className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:text-white"
                        title={state.selectedModel === GeminiModel.FLASH ? "Tùy chọn độ phân giải chỉ khả dụng cho Model Pro" : ""}
                      >
                        {Object.entries(ImageResolution).map(([name, val]) => (<option key={name} value={val}>{val}</option>))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">PHONG CÁCH</span>
                    <select value={state.style} onChange={(e) => setState(prev => ({ ...prev, style: e.target.value as ImageStyle }))} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:text-white">
                      {Object.entries(ImageStyle).map(([name, val]) => (<option key={name} value={val}>{val}</option>))}
                    </select>
                  </div>
                </div>
                
                {state.selectedModel === GeminiModel.FLASH && state.selectedResolution !== ImageResolution.R1K && (
                  <p className="mt-2 text-[10px] text-amber-500 font-medium italic">
                    * Lưu ý: Model Flash sẽ tự động tối ưu độ phân giải. Tùy chọn 2K/4K chỉ hiệu quả tối đa với Model Pro.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2 block">4. Mô tả thêm</label>
                <textarea value={state.prompt} onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))} placeholder="Thêm các chi tiết như: 'Nền màu xanh pastel', 'Thêm hoa hồng',..." className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[100px] transition-shadow dark:text-white" />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">{error}</p>}

            <button onClick={handleGenerate} disabled={state.isGenerating} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${state.isGenerating ? 'bg-gray-400 cursor-not-allowed animate-pulse' : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700'}`}>
              {state.isGenerating ? 'ĐANG KHỞI TẠO...' : 'BẮT ĐẦU TẠO ẢNH'}
            </button>
          </section>
        </aside>

        <div className="lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">Lịch sử thiết kế</h2>
          </div>

          {state.isGenerating && (
             <div className="mb-8 p-8 bg-primary-50 dark:bg-primary-900/10 rounded-3xl border border-primary-100 dark:border-primary-900/30 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-4">
                  <svg className="animate-spin text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-primary-700 dark:text-primary-300">Đang kiến trúc banner...</h3>
                <p className="text-sm text-primary-500 max-w-xs mt-2">Gemini {state.selectedModel === GeminiModel.PRO ? '3 Pro' : 'Flash'} đang xử lý độ phân giải {state.selectedResolution}...</p>
             </div>
          )}

          {state.generatedImages.length === 0 && !state.isGenerating ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm border-dashed">
              <div className="w-24 h-24 mb-6 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Chưa có bản thiết kế nào</h3>
              <p className="text-gray-500 max-w-sm text-sm">Hãy tải ảnh lên và nhấn nút "Bắt đầu tạo ảnh" ở bên trái.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {state.generatedImages.map((image) => (
                <div key={image.id} className="group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl hover:scale-[1.01]">
                  <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={image.url} alt="Generated design" className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105" onClick={() => setZoomImage(image.url)} />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { const link = document.createElement('a'); link.href = image.url; link.download = `banner-${image.id}.png`; link.click(); }} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow-lg hover:text-primary-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{image.style}</span>
                        {image.resolution && <span className="text-[9px] text-primary-500 font-bold uppercase">{image.resolution} Quality</span>}
                     </div>
                     <span className="text-[10px] text-gray-400">{new Date(image.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <ZoomModal imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};

export default App;
