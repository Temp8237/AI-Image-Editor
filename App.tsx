import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import ImageUploader from './components/ImageUploader';
import PaywallModal from './components/PaywallModal';
import { MagicWandIcon, ResetIcon, LoadingSpinnerIcon, ErrorIcon, CreditIcon, CheckCircleIcon, InfoIcon } from './components/icons';

const CREDITS_STORAGE_KEY = 'gemini-image-editor-credits';
const FREE_CREDITS = 3;

type Notification = {
  type: 'success' | 'info' | 'error';
  message: string;
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Check for initial credits
  useEffect(() => {
    const storedCredits = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (storedCredits === null) {
      // First time user gets free credits
      setCredits(FREE_CREDITS);
      localStorage.setItem(CREDITS_STORAGE_KEY, String(FREE_CREDITS));
    } else {
      setCredits(parseInt(storedCredits, 10) || 0);
    }
  }, []);

  // Check for payment status from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success')) {
      const purchasedCredits = parseInt(urlParams.get('credits_purchased') || '0', 10);
      if (purchasedCredits > 0) {
        const newTotalCredits = credits + purchasedCredits;
        setCredits(newTotalCredits);
        localStorage.setItem(CREDITS_STORAGE_KEY, String(newTotalCredits));
        setNotification({
            type: 'success',
            message: `Successfully purchased ${purchasedCredits} credits!`,
        });
        setError(null); // Clear previous "out of credits" error
      }
    }

    if (urlParams.get('payment_cancelled')) {
      setNotification({
        type: 'info',
        message: 'Your purchase was cancelled. You can try again anytime.',
      });
    }

    // Clean up URL parameters
    if (urlParams.has('payment_success') || urlParams.has('payment_cancelled')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Note: `credits` is not in the dependency array to prevent re-triggering

  useEffect(() => {
    if(notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setOriginalImagePreview(URL.createObjectURL(file));
    setEditedImage(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (credits <= 0) {
      setError('You are out of credits. Please purchase more to continue generating images.');
      setIsPaywallVisible(true);
      return;
    }
    
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and provide an editing instruction.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const { base64Data, mimeType } = await fileToBase64(originalImage);
      const resultBase64 = await editImageWithPrompt(base64Data, mimeType, prompt);
      setEditedImage(`data:${mimeType};base64,${resultBase64}`);
      
      const newCredits = credits - 1;
      setCredits(newCredits);
      localStorage.setItem(CREDITS_STORAGE_KEY, String(newCredits));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, credits]);
  
  const handleReset = () => {
    setOriginalImage(null);
    setOriginalImagePreview(null);
    setEditedImage(null);
    setPrompt('');
    setIsLoading(false);
    setError(null);
  };
  
  const NotificationBanner = () => {
      if (!notification) return null;

      const icons = {
          success: <CheckCircleIcon />,
          info: <InfoIcon />,
          error: <ErrorIcon />
      }
      
      const colors = {
          success: 'bg-green-500/20 border-green-500 text-green-300',
          info: 'bg-blue-500/20 border-blue-500 text-blue-300',
          error: 'bg-red-500/20 border-red-500 text-red-300'
      }

      return (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 p-4 rounded-lg border flex items-center gap-4 shadow-lg z-50 ${colors[notification.type]}`}>
              {icons[notification.type]}
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)} className="ml-4">&times;</button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Gemini Image Editor
          </h1>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-full text-sm">
                  <CreditIcon />
                  <span className="font-semibold">{credits} Credits Left</span>
              </div>
              <button 
                onClick={() => setIsPaywallVisible(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm hidden sm:block"
              >
                Get More Credits
              </button>
          </div>
        </div>
      </header>
      
      <NotificationBanner />

      <main className="container mx-auto p-4 md:p-8 flex-grow">
        {!originalImagePreview ? (
           <div className="flex justify-center items-center h-full max-w-2xl mx-auto">
             <ImageUploader onImageUpload={handleImageUpload} />
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Original Image & Controls */}
            <div className="flex flex-col space-y-4">
              <h2 className="text-xl font-semibold text-gray-300">Original Image</h2>
              <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
                <img src={originalImagePreview} alt="Original" className="w-full h-full object-contain" />
              </div>
               <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 w-full bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <ResetIcon />
                  Start Over
                </button>
            </div>

            {/* Right Column: Prompt & Edited Image */}
            <div className="flex flex-col space-y-4">
               <h2 className="text-xl font-semibold text-gray-300">Edit Instructions</h2>
               <div className="relative">
                 <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="e.g., Remove the background, make it a white studio background..."
                   rows={3}
                   className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                   disabled={isLoading}
                 />
               </div>
               <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim() || credits <= 0}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? <LoadingSpinnerIcon /> : <MagicWandIcon />}
                  {isLoading ? 'Generating...' : (credits > 0 ? 'Generate (1 Credit)' : 'Out of Credits')}
                </button>

                <div className="relative aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-700 shadow-lg mt-4">
                  {isLoading && (
                    <div className="flex flex-col items-center text-gray-400">
                       <LoadingSpinnerIcon />
                       <span className="mt-2">Editing your image...</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex flex-col items-center text-red-400 p-4 text-center">
                       <ErrorIcon />
                       <span className="mt-2 font-semibold">Error</span>
                       <p className="text-sm">{error}</p>
                    </div>
                  )}
                  {editedImage && !isLoading && (
                    <img src={editedImage} alt="Edited" className="w-full h-full object-contain" />
                  )}
                   {!editedImage && !isLoading && !error && (
                     <div className="text-center text-gray-500">
                        <p>Your edited image will appear here.</p>
                     </div>
                   )}
                </div>
            </div>
          </div>
        )}
      </main>
      {isPaywallVisible && (
        <PaywallModal 
            onClose={() => setIsPaywallVisible(false)}
        />
      )}
    </div>
  );
};

export default App;