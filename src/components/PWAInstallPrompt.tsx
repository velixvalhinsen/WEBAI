import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
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
    // Check if app is already installed (multiple checks)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isInstalledCheck = isIOSStandalone || isStandalone;
    
    if (isInstalledCheck) {
      console.log('✅ PWA already installed, hiding prompt');
      setIsInstalled(true);
      setShowPrompt(false);
      return;
    }

    // Detect in-app browser
    const inApp = detectInAppBrowser();
    setIsInAppBrowser(inApp);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      console.log('✅ beforeinstallprompt event triggered');
      setDeferredPrompt(promptEvent);
      deferredPromptRef.current = promptEvent;
      
      // If redirected from in-app browser, ensure we're not in in-app browser mode anymore
      const urlParamsCheck = new URLSearchParams(window.location.search);
      if (urlParamsCheck.get('fromInApp') === 'true') {
        console.log('🔄 beforeinstallprompt triggered after redirect - button will show "Install Sekarang"');
        setIsInAppBrowser(false);
      }
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
    
    // If redirected from in-app browser, we're now in Chrome (not in-app browser anymore)
    if (fromInApp) {
      setIsInAppBrowser(false);
    }
    
    // Detect Chrome browser (not Edge, not Opera)
    const ua = navigator.userAgent.toLowerCase();
    const isChrome = ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr') && !ua.includes('opera');
    
    // Show prompt UI - ALWAYS show in Chrome (manual access or after redirect)
    // Delay: 1500ms if redirected from in-app (wait for beforeinstallprompt), 500ms if in-app browser, 1000ms for Chrome, 2000ms for other browsers
    let delay = 2000;
    if (fromInApp) {
      delay = 1500; // After redirect from in-app browser - wait longer for beforeinstallprompt
    } else if (inApp) {
      delay = 500; // In in-app browser
    } else if (isChrome) {
      delay = 1000; // Chrome browser - show faster (1 second)
    }
    
    console.log(`🔍 Browser detection: fromInApp=${fromInApp}, inApp=${inApp}, isChrome=${isChrome}, delay=${delay}ms`);
    
    // If redirected from in-app browser, wait for beforeinstallprompt before showing prompt UI
    let checkPromptInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (fromInApp) {
      checkPromptInterval = setInterval(() => {
        if (deferredPromptRef.current) {
          if (checkPromptInterval) clearInterval(checkPromptInterval);
          // beforeinstallprompt has fired, now show prompt UI
          setTimeout(() => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (window.navigator as any).standalone === true;
            const isInstalledCheck = isIOSStandalone || isStandalone;
            
            if (!isInstalledCheck) {
              console.log('✅ Showing PWA install prompt after redirect (beforeinstallprompt ready)');
              setShowPrompt(true);
            }
          }, 200);
        }
      }, 100);
      
      // Stop checking after 3 seconds
      timeoutId = setTimeout(() => {
        if (checkPromptInterval) clearInterval(checkPromptInterval);
        // Show prompt anyway even if beforeinstallprompt hasn't fired yet
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;
        const isInstalledCheck = isIOSStandalone || isStandalone;
        
        if (!isInstalledCheck) {
          console.log('✅ Showing PWA install prompt after redirect (timeout)');
          setShowPrompt(true);
        }
      }, 3000);
    } else {
      // Normal flow for non-redirect cases
      let timer: NodeJS.Timeout | null = null;
      
      // In Chrome, wait for beforeinstallprompt before showing prompt UI
      let chromeCheckInterval: NodeJS.Timeout | null = null;
      if (isChrome) {
        chromeCheckInterval = setInterval(() => {
          if (deferredPromptRef.current) {
            if (chromeCheckInterval) clearInterval(chromeCheckInterval);
            // beforeinstallprompt has fired, now show prompt UI
            setTimeout(() => {
              const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
              const isIOSStandalone = (window.navigator as any).standalone === true;
              const isInstalledCheck = isIOSStandalone || isStandalone;
              
              if (!isInstalledCheck) {
                console.log('✅ Showing PWA install prompt in Chrome (beforeinstallprompt ready)');
                setShowPrompt(true);
              }
            }, 200);
          }
        }, 100);
        
        // Stop checking after 2 seconds, show prompt anyway
        timer = setTimeout(() => {
          if (chromeCheckInterval) clearInterval(chromeCheckInterval);
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          const isIOSStandalone = (window.navigator as any).standalone === true;
          const isInstalledCheck = isIOSStandalone || isStandalone;
          
          if (!isInstalledCheck) {
            console.log('✅ Showing PWA install prompt in Chrome (timeout)');
            setShowPrompt(true);
          }
        }, 2000);
      } else {
        // For other browsers, use normal delay
        timer = setTimeout(() => {
          // Double check if app is installed before showing prompt
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          const isIOSStandalone = (window.navigator as any).standalone === true;
          const isInstalledCheck = isIOSStandalone || isStandalone;
          
          if (isInstalledCheck) {
            console.log('✅ PWA already installed, not showing prompt');
            setIsInstalled(true);
            setShowPrompt(false);
            return;
          }
          
          // For other browsers, check dismissed status
          const dismissed = localStorage.getItem('pwa-install-dismissed');
          if (!dismissed) {
            console.log('✅ Showing PWA install prompt (not dismissed)');
            setShowPrompt(true);
          } else {
            const dismissedTime = parseInt(dismissed, 10);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime >= sevenDays) {
              console.log('✅ Showing PWA install prompt (7 days passed)');
              setShowPrompt(true);
            } else {
              console.log('⏸️ PWA install prompt dismissed, waiting for 7 days');
            }
          }
        }, delay);
      }
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        if (timer) clearTimeout(timer);
        if (chromeCheckInterval) clearInterval(chromeCheckInterval);
      };
    }

    // Cleanup for fromInApp case
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (checkPromptInterval) clearInterval(checkPromptInterval);
      if (timeoutId) clearTimeout(timeoutId);
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
    let prompt = deferredPromptRef.current || deferredPrompt;
    
    // If no prompt, wait a bit and check again (for Chrome/Edge)
    if (!prompt) {
      const isChrome = /chrome|chromium|edg/i.test(navigator.userAgent);
      if (isChrome) {
        // Wait for beforeinstallprompt event (check multiple times)
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(() => {
          attempts++;
          const foundPrompt = deferredPromptRef.current || deferredPrompt;
          if (foundPrompt || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (foundPrompt) {
              // Found prompt, trigger install
              foundPrompt.prompt().then(() => {
                return foundPrompt.userChoice;
              }).then(({ outcome }) => {
                if (outcome === 'accepted') {
                  setShowPrompt(false);
                }
                setDeferredPrompt(null);
                deferredPromptRef.current = null;
              }).catch((error) => {
                console.error('Install prompt error:', error);
                // Just close the prompt if error
                setShowPrompt(false);
              });
            } else {
              // No prompt found, just close
              setShowPrompt(false);
            }
          }
        }, 100);
        return;
      } else {
        // For non-Chrome browsers, just close
        setShowPrompt(false);
        return;
      }
    }
    
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
      // Just close the prompt if error
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }
  
  // Determine button text based on current state
  const getButtonText = () => {
    const prompt = deferredPromptRef.current || deferredPrompt;
    if (isInAppBrowser && !prompt) {
      return 'Buka di Chrome untuk Install';
    } else if (prompt) {
      return 'Install Sekarang';
    } else {
      return 'Install';
    }
  };
  
  const buttonText = getButtonText();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 md:bottom-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md md:w-full md:mx-4 animate-slide-up">
      <div className="bg-gradient-to-br from-chat-darker via-chat-darker to-gray-800 border border-chat-border/50 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden relative">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4 mb-4">
            {/* Icon with gradient background */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 0 002-2V5a2 0 00-2-2H8a2 0 00-2 2v14a2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 leading-tight">
                Install G Chat
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {(() => {
                  const prompt = deferredPromptRef.current || deferredPrompt;
                  return isInAppBrowser && !prompt 
                    ? 'Buka di Chrome untuk install aplikasi' 
                    : 'Install untuk akses lebih cepat dan pengalaman yang lebih baik';
                })()}
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Tutup"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Benefits list */}
          <div className="mb-4 space-y-2 hidden sm:block">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Akses lebih cepat tanpa browser</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Bekerja offline</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 sm:px-5 sm:py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 border border-transparent hover:border-white/10"
            >
              Nanti
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 px-5 py-2.5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (min-width: 768px) {
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translate(-50%, 100%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
