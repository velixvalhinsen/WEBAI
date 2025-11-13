import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Detect in-app browser
  const detectInAppBrowser = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (standalone) {
      return false;
    }

    const inAppIndicators = [
      'instagram',
      'fban',
      'fbav',
      'line',
      'whatsapp',
      'twitter',
      'linkedinapp',
      'snapchat',
      'messenger',
    ];

    for (const indicator of inAppIndicators) {
      if (ua.includes(indicator)) {
        return true;
      }
    }

    // Check for Android WebView that's not Chrome
    if (ua.includes('android') && ua.includes('version') && !ua.includes('chrome')) {
      const hasServiceWorker = 'serviceWorker' in navigator;
      if (!hasServiceWorker) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect in-app browser
    const inApp = detectInAppBrowser();
    setIsInAppBrowser(inApp);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      deferredPromptRef.current = promptEvent;
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if redirected from in-app browser (check URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const fromInApp = urlParams.get('fromInApp') === 'true';
    
    // If redirected from in-app browser, wait for beforeinstallprompt and auto-trigger
    if (fromInApp) {
      const checkPrompt = setInterval(() => {
        if (deferredPromptRef.current) {
          clearInterval(checkPrompt);
          // Auto-trigger install prompt after redirect
          setTimeout(async () => {
            try {
              if (deferredPromptRef.current) {
                await deferredPromptRef.current.prompt();
                const { outcome } = await deferredPromptRef.current.userChoice;
                if (outcome === 'accepted') {
                  setShowPrompt(false);
                }
                setDeferredPrompt(null);
                deferredPromptRef.current = null;
              }
            } catch (error) {
              console.error('Auto-install prompt error:', error);
            }
          }, 500);
        }
      }, 100);

      // Stop checking after 5 seconds
      setTimeout(() => {
        clearInterval(checkPrompt);
      }, 5000);
    }

    // Show prompt immediately if in-app browser, otherwise wait 2 seconds
    const delay = inApp ? 500 : 2000;
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      } else {
        const dismissedTime = parseInt(dismissed, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime >= sevenDays) {
          setShowPrompt(true);
        }
      }
    }, delay);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const redirectToChrome = () => {
    const currentUrl = window.location.href.split('?')[0]; // Remove existing query params
    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(ua);
    const targetUrl = currentUrl + '?fromInApp=true';

    if (isAndroid) {
      // Android Intent URL to open in Chrome
      const urlWithoutProtocol = targetUrl.replace(/https?:\/\//, '');
      const chromeIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
      window.location.href = chromeIntent;
    } else {
      // For iOS or other, just redirect to same URL
      window.location.href = targetUrl;
    }
  };

  const handleInstallClick = async () => {
    // If in-app browser and no deferredPrompt, redirect to Chrome
    if (isInAppBrowser && !deferredPrompt && !deferredPromptRef.current) {
      redirectToChrome();
      return;
    }

    // Check deferredPromptRef first (most up-to-date)
    const prompt = deferredPromptRef.current || deferredPrompt;
    
    if (prompt) {
      // Use native install prompt if available
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
        deferredPromptRef.current = null;
      } catch (error) {
        console.error('Install prompt error:', error);
        // Fallback to manual instructions
        setShowManualInstructions(true);
      }
    } else {
      // Check if Chrome/Edge - wait a bit more for beforeinstallprompt
      const isChrome = /chrome|chromium|edg/i.test(navigator.userAgent);
      if (isChrome) {
        // Wait 1 second for beforeinstallprompt event
        setTimeout(() => {
          const updatedPrompt = deferredPromptRef.current || deferredPrompt;
          if (updatedPrompt) {
            // Retry with updated prompt
            updatedPrompt.prompt().then(() => {
              return updatedPrompt.userChoice;
            }).then(({ outcome }) => {
              if (outcome === 'accepted') {
                setShowPrompt(false);
              }
              setDeferredPrompt(null);
              deferredPromptRef.current = null;
            }).catch((error) => {
              console.error('Install prompt error:', error);
              setShowManualInstructions(true);
            });
          } else {
            setShowManualInstructions(true);
          }
        }, 1000);
      } else {
        setShowManualInstructions(true);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowManualInstructions(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const getManualInstructions = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    if (isIOS) {
      return {
        title: 'Cara Install di iPhone/iPad',
        steps: [
          '1. Tap tombol Share (kotak dengan panah) di bagian bawah',
          '2. Scroll ke bawah dan pilih "Add to Home Screen"',
          '3. Tap "Add" di pojok kanan atas',
          '4. Aplikasi akan muncul di home screen Anda'
        ]
      };
    } else if (isAndroid) {
      return {
        title: 'Cara Install di Android',
        steps: [
          '1. Tap menu (⋮) di pojok kanan atas browser',
          '2. Pilih "Install PWA" atau "Add to Home screen"',
          '3. Tap "Install" pada popup yang muncul',
          '4. Aplikasi akan terinstall dan muncul di home screen'
        ]
      };
    } else {
      return {
        title: 'Cara Install PWA',
        steps: [
          '1. Lihat address bar browser Anda',
          '2. Klik ikon install (+) atau "Add to Home screen"',
          '3. Konfirmasi instalasi',
          '4. Aplikasi akan terinstall'
        ]
      };
    }
  };

  if (isInstalled) {
    return null;
  }

  if (!showPrompt && !showManualInstructions) {
    return null;
  }

  const instructions = getManualInstructions();
  
  // Determine button text based on current state
  const getButtonText = () => {
    const prompt = deferredPromptRef.current || deferredPrompt;
    if (isInAppBrowser && !prompt) {
      return 'Buka di Chrome untuk Install';
    } else if (prompt) {
      return 'Install Sekarang';
    } else {
      return 'Lihat Cara Install';
    }
  };
  
  const buttonText = getButtonText();

  return (
    <>
      {showManualInstructions ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-chat-dark border border-chat-border rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 0 002-2V5a2 0 00-2-2H8a2 0 00-2 2v14a2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">{instructions.title}</h3>
            </div>
            <div className="space-y-2 mb-6">
              {instructions.steps.map((step, index) => (
                <p key={index} className="text-sm text-gray-300">{step}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => setShowManualInstructions(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-chat-darker border border-chat-border rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 0 002-2V5a2 0 00-2-2H8a2 0 00-2 2v14a2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Install G Chat</p>
                <p className="text-xs text-gray-400">
                  {(() => {
                    const prompt = deferredPromptRef.current || deferredPrompt;
                    return isInAppBrowser && !prompt 
                      ? 'Buka di Chrome untuk install aplikasi' 
                      : 'Install untuk akses lebih cepat dan pengalaman yang lebih baik';
                  })()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Nanti
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
