import React, { useState } from 'react';
import { Bookmark, X, Save, Trash2, Check, Download, Upload, Clock, Plus, Edit2 } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';

export const SaveLayoutModal: React.FC = () => {
  const { 
    isSaveLayoutModalOpen, 
    setSaveLayoutModalOpen, 
    savedLayouts, 
    currentLayoutName, 
    saveCurrentLayout, 
    loadLayout, 
    deleteLayout, 
    renameLayout 
  } = useMarketStore();

  const [newLayoutName, setNewLayoutName] = useState(currentLayoutName || 'My Strategy Layout');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isSaveLayoutModalOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayoutName.trim()) return;
    saveCurrentLayout(newLayoutName.trim());
    showToast(`Layout "${newLayoutName.trim()}" saved!`);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLayouts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `otivo_layouts_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Layouts exported to JSON file');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            parsed.forEach(layout => {
              if (layout.name) {
                saveCurrentLayout(layout.name);
              }
            });
            showToast('Layouts imported successfully!');
          }
        } catch (err) {
          showToast('Failed to import JSON file');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-tv-card border border-tv-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border bg-tv-panel/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tv-accent/10 text-tv-accent">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-tv-text">Chart Layouts & Templates</h2>
              <p className="text-xs text-tv-muted">Save your indicators, tools & setup</p>
            </div>
          </div>
          <button 
            onClick={() => setSaveLayoutModalOpen(false)}
            className="p-1.5 hover:bg-tv-hover rounded-lg text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast notification */}
        {toastMsg && (
          <div className="px-4 py-2 bg-tv-accent text-white text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Save Current Form */}
        <div className="p-4 border-b border-tv-border bg-tv-panel/30">
          <form onSubmit={handleSave} className="space-y-2">
            <label className="block text-xs font-medium text-tv-muted">Save Current Setup</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="Layout name..."
                className="flex-1 bg-tv-input border border-tv-border rounded-lg px-3 py-2 text-xs sm:text-sm text-tv-text focus:outline-none focus:border-tv-accent"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-tv-accent hover:bg-tv-accent/90 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>

        {/* Layout list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <span className="block text-xs font-medium text-tv-muted mb-1">Your Saved Layouts</span>
          {savedLayouts.length === 0 ? (
            <div className="text-center py-8 text-tv-muted text-xs">
              No saved layouts yet. Enter a name above to save your first chart layout.
            </div>
          ) : (
            savedLayouts.map((item) => {
              const isCurrent = item.name === currentLayoutName;
              return (
                <div 
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    isCurrent 
                      ? 'bg-tv-accent/10 border-tv-accent/40' 
                      : 'bg-tv-panel hover:bg-tv-hover border-tv-border'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-tv-input border border-tv-border rounded px-2 py-1 text-xs text-tv-text"
                      />
                      <button
                        onClick={() => {
                          if (editingName.trim()) {
                            renameLayout(item.id, editingName.trim());
                            setEditingId(null);
                          }
                        }}
                        className="p-1 bg-tv-accent text-white rounded text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-0.5 min-w-0 flex-1 cursor-pointer" onClick={() => loadLayout(item.id)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-tv-text truncate">{item.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-tv-accent text-white font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-tv-muted">
                        <span>{item.symbol} • {item.timeframe}</span>
                        <span>•</span>
                        <span>{item.indicators?.length || 0} indicators</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                      className="p-1.5 text-tv-muted hover:text-tv-text rounded-md hover:bg-tv-panel transition-colors cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteLayout(item.id)}
                      className="p-1.5 text-tv-muted hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Import / Export */}
        <div className="px-5 py-3 bg-tv-panel border-t border-tv-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-tv-card hover:bg-tv-hover border border-tv-border rounded-lg text-tv-text transition-colors cursor-pointer"
              title="Export layouts as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-tv-card hover:bg-tv-hover border border-tv-border rounded-lg text-tv-text transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <span className="text-[11px] text-tv-muted">Auto-saved to browser</span>
        </div>
      </div>
    </div>
  );
};
