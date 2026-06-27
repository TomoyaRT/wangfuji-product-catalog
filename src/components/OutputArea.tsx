import { forwardRef } from 'react'
import { useStore } from '../store/useStore'

const OutputArea = forwardRef<HTMLDivElement>((_, ref) => {
  const textareaContent = useStore((s) => s.textareaContent)
  const setTextareaContent = useStore((s) => s.setTextareaContent)
  const copyTextarea = useStore((s) => s.copyTextarea)

  return (
    <div ref={ref} className="px-4 pt-4 pb-6">
      <p className="text-xs text-espresso/50 mb-2 font-sans">輸出結果</p>
      <div className="border-2 border-dashed border-muted rounded-lg p-3">
        <textarea
          value={textareaContent}
          onChange={(e) => setTextareaContent(e.target.value)}
          placeholder="點擊「完成」後，結果會顯示在這裡"
          rows={4}
          className="w-full bg-transparent font-mono text-sm text-espresso resize-none focus:outline-none placeholder:text-espresso/30"
        />
      </div>
      <button
        onClick={copyTextarea}
        disabled={!textareaContent}
        className="mt-3 w-full py-2 rounded-lg border border-plum text-plum text-sm font-medium disabled:opacity-30"
      >
        複製
      </button>
    </div>
  )
})

OutputArea.displayName = 'OutputArea'
export default OutputArea
