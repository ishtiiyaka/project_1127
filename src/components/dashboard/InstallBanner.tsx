import { useState, useEffect } from 'react';
import { hasInstallPrompt, triggerInstallPrompt } from '../../lib/installPrompt';
import { useAppStore } from '../../store/useAppStore';

export default function InstallBanner() {
  const { settings, saveSettings } = useAppStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (settings?.installBannerDismissed) return;
    // Small delay so the banner appears after page load
    const t = setTimeout(() => setVisible(hasInstallPrompt()), 1500);
    return () => clearTimeout(t);
  }, [settings]);

  if (!visible || settings?.installBannerDismissed) return null;

  async function handleInstall() {
    const result = await triggerInstallPrompt();
    if (result === 'accepted' || result === 'unavailable') dismiss();
  }

  async function dismiss() {
    setVisible(false);
    if (settings) await saveSettings({ ...settings, installBannerDismissed: true });
  }

  return (
    <div className="fixed bottom-12 left-0 right-0 z-40 px-4 py-2">
      <div className="max-w-2xl mx-auto card border-accent/40 p-3 flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-text">
          Install <span className="text-accent">Project 1127</span> as an app
        </span>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost text-xs py-1 px-3" onClick={dismiss}>DISMISS</button>
          <button className="btn-primary text-xs py-1 px-3" onClick={handleInstall}>INSTALL</button>
        </div>
      </div>
    </div>
  );
}
