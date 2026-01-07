import { useState } from 'react';
import { Modal } from './Modal';
import type { HistorySnapshot } from '../../hooks/useHistory';
import { format } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: HistorySnapshot[];
  isLoading?: boolean;
  onRestore: (snapshot: HistorySnapshot) => void;
  onSaveSnapshot: (description: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  snapshots,
  isLoading = false,
  onRestore,
  onSaveSnapshot,
  onDeleteSnapshot,
  onClearHistory
}: HistoryModalProps) {
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('');

  const handleSave = () => {
    if (!newSnapshotDesc.trim()) return;
    onSaveSnapshot(newSnapshotDesc);
    setNewSnapshotDesc('');
  };

  const handleDownload = (snapshot: HistorySnapshot) => {
    const dataStr = JSON.stringify(snapshot, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snapshot-${format(snapshot.timestamp, 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session History"
      description="View and restore previous versions of your timesheet for this week. History is synced across devices."
      icon={
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      variant="default"
      actions={
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        {/* Create Snapshot Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Create New Snapshot</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSnapshotDesc}
              onChange={(e) => setNewSnapshotDesc(e.target.value)}
              placeholder="e.g., Before major changes"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              disabled={!newSnapshotDesc.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Snapshots List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Available Snapshots ({snapshots.length})</h4>
            {snapshots.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all history?')) {
                    onClearHistory();
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading history...
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No snapshots yet. Create one above or make changes to auto-save.
              </div>
            ) : (
              snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${snapshot.type === 'auto' ? 'bg-gray-400' : 'bg-indigo-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{snapshot.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(snapshot.timestamp, 'MMM d, h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (window.confirm('Restore this version? Current unsaved changes will be lost.')) {
                          onRestore(snapshot);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDownload(snapshot)}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download JSON"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteSnapshot(snapshot.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete snapshot"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
