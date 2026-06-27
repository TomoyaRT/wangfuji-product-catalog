import { useStore } from '../store/useStore'

export default function FeedbackToast() {
  const feedbackMessage = useStore((s) => s.feedbackMessage)

  if (!feedbackMessage) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-plum text-paper text-sm px-4 py-2 rounded-full shadow-lg"
    >
      {feedbackMessage}
    </div>
  )
}
