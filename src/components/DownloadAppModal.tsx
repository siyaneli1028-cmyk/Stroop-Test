import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  Terminal,
  Globe,
  Monitor,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { downloadAppZip } from '../utils/zipExporter';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await downloadAppZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const terminalCommands = `unzip stroop-experiment-app.zip\ncd stroop-experiment-app\nnpm install\nnpm run dev`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(terminalCommands);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Download &amp; Export Application</h2>
            <p className="text-xs text-slate-400">
              Run offline in your lab, host on your server, or install to your desktop
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Method 1: Download Complete Source ZIP (Primary) */}
          <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 rounded-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 block mb-1">
                  Option 1: Complete Project Bundle
                </span>
                <h3 className="text-base font-bold text-white">
                  Download Full Source Code (.ZIP)
                </h3>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Downloads a self-contained ZIP file containing all React/TypeScript source files,
                  Tailwind styling, experimental timing engines, CSV export utilities, and <code className="text-indigo-300">package.json</code>.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition text-sm active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging Project ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>ZIP Downloaded Successfully!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Project .ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* Running locally instructions */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                How to run locally after downloading:
              </span>
              <button
                onClick={handleCopyCommands}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy commands'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 font-mono text-[11px] rounded-lg text-slate-300 overflow-x-auto border border-slate-800">
              {terminalCommands}
            </pre>
            <p className="text-[11px] text-slate-400">
              Requires <strong>Node.js 18+</strong>. Once started, runs completely offline on your testing machine.
            </p>
          </div>

          {/* Method 2 & 3: Direct Web / Desktop Install */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Desktop App */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/70 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Option 2: Install as Desktop App</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In Google Chrome, Microsoft Edge, or Safari, click the <strong>Install App</strong> icon (in the URL bar or browser menu) to install it directly onto your desktop or Dock. It opens in its own window without browser toolbars.
              </p>
            </div>

            {/* Offline URL */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/70 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Option 3: Save / Bookmark URL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The deployed URL runs client-side in the browser. You can bookmark it on any laboratory laptop or tablet. All data remains stored locally on that specific device.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
