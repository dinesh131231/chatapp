import { AlertTriangleIcon, LoaderIcon, XIcon } from "lucide-react";
import { createPortal } from "react-dom";

function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          disabled={isLoading}
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isDangerous ? "bg-red-500/10" : "bg-cyan-500/10"
            }`}
          >
            <AlertTriangleIcon className={`w-6 h-6 ${isDangerous ? "text-red-400" : "text-cyan-400"}`} />
          </div>

          <h3 className="text-slate-200 font-semibold text-lg mb-2">{title}</h3>
          <p className="text-slate-400 text-sm mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isDangerous
                  ? "bg-red-500/90 hover:bg-red-500 text-white"
                  : "bg-cyan-500/90 hover:bg-cyan-500 text-slate-900"
              }`}
            >
              {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
export default ConfirmationModal;