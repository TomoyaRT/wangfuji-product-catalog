import { useRef, useEffect } from 'react'
import { useStore } from './store/useStore'
import Header from './components/Header'
import CategoryList from './components/CategoryList'
import ActionBar from './components/ActionBar'
import OutputArea from './components/OutputArea'
import FeedbackToast from './components/FeedbackToast'
import HistoryModal from './components/HistoryModal'

export default function App() {
  const outputAreaRef = useRef<HTMLDivElement>(null)
  const finalize = useStore((s) => s.finalize)
  const shouldScrollToOutput = useStore((s) => s.shouldScrollToOutput)
  const clearScrollFlag = useStore((s) => s.clearScrollFlag)

  useEffect(() => {
    if (shouldScrollToOutput) {
      setTimeout(() => {
        outputAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      clearScrollFlag()
    }
  }, [shouldScrollToOutput, clearScrollFlag])

  const handleFinalize = () => {
    finalize()
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <FeedbackToast />
      <Header />
      <main className="flex-1 pb-16">
        <CategoryList />
        <OutputArea ref={outputAreaRef} />
      </main>
      <ActionBar onFinalize={handleFinalize} />
      <HistoryModal />
    </div>
  )
}
