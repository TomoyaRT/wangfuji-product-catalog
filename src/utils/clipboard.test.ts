import { it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from './clipboard'

beforeEach(() => {
  vi.restoreAllMocks()
})

it('uses navigator.clipboard.writeText when available', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })
  await copyToClipboard('甘宋梅')
  expect(writeText).toHaveBeenCalledWith('甘宋梅')
})

it('falls back to execCommand when clipboard API throws', async () => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
  })
  const execCommand = vi.fn().mockReturnValue(true)
  Object.assign(document, { execCommand })
  await copyToClipboard('甘宋梅')
  expect(execCommand).toHaveBeenCalledWith('copy')
})
