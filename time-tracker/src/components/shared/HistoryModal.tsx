import { useState } from 'react';
import { Modal } from './Modal';
import type { HistorySnapshot } from '../../hooks/useLocalHistory';
import { format } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: HistorySnapshot[];
  onRestore: (snapshot: HistorySnapshot) => void;
  onSaveSnapshot: (description: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  snapshots,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session History"
      description="View and restore previous versions of your timesheet for this week."
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
            {snapshots.length === 0 ? (
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
