import { Modal } from '../../shared/Modal'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  markdown: string
}

export function TemplateModal({ isOpen, onClose, title, markdown }: TemplateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Render markdown as preformatted text */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
            {markdown}
          </pre>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
