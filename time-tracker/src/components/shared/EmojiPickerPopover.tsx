import { useState } from 'react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'

interface EmojiPickerPopoverProps {
  icon: string
  onChange: (icon: string) => void
}

export function EmojiPickerPopover({ icon, onChange }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="w-8 h-8 flex items-center justify-center text-lg rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 focus:border-emerald-500 focus:outline-none bg-gray-50/50 transition-all cursor-pointer"
          title="Change icon"
        >
          {icon || <span className="opacity-40 grayscale text-sm">😀</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" align="start">
        <EmojiPicker 
          onEmojiClick={(data) => {
            onChange(data.emoji)
            setOpen(false)
          }}
          theme={Theme.LIGHT}
          lazyLoadEmojis={true}
        />
      </PopoverContent>
    </Popover>
  )
}
