import { useCallback, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import ResultDialog from '../components/ResultDialog'

type ConfirmOpts = {
  title: string
  description: string
  tone?: 'default' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
  label: string
  request: () => Promise<unknown>
}

type ConfirmState = Required<Omit<ConfirmOpts, 'tone' | 'confirmLabel' | 'cancelLabel'>> & {
  tone: 'default' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
}

type ResultState = { title: string; tone: 'success' | 'error' } | null

export function useConfirmAction() {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [result, setResult] = useState<ResultState>(null)
  const [pending, setPending] = useState(false)

  const askConfirm = useCallback((opts: ConfirmOpts) => {
    setConfirm({
      title: opts.title,
      description: opts.description,
      tone: opts.tone ?? 'default',
      label: opts.label,
      request: opts.request,
      confirmLabel: opts.confirmLabel,
      cancelLabel: opts.cancelLabel,
    })
  }, [])

  const performConfirmed = useCallback(async () => {
    if (!confirm) return
    setPending(true)
    const { label, request } = confirm
    setConfirm(null)
    try {
      await request()
      setResult({ title: label, tone: 'success' })
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Action failed'
      setResult({ title: msg, tone: 'error' })
    } finally {
      setPending(false)
    }
  }, [confirm])

  const cancelConfirm = useCallback(() => setConfirm(null), [])
  const closeResult = useCallback(() => setResult(null), [])
  const showResult = useCallback((title: string, tone: 'success' | 'error' = 'success') => {
    setResult({ title, tone })
  }, [])

  const Dialogs = (
    <>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        tone={confirm?.tone}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={confirm?.cancelLabel}
        pending={pending}
        onConfirm={performConfirmed}
        onCancel={cancelConfirm}
      />
      <ResultDialog
        open={!!result}
        title={result?.title ?? ''}
        tone={result?.tone}
        onClose={closeResult}
      />
    </>
  )

  return { askConfirm, showResult, Dialogs }
}
