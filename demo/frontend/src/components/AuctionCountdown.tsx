import { useEffect, useMemo, useState } from 'react'

type AuctionCountdownProps = {
  endTime: string
  compact?: boolean
}

function formatTimeLeft(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export default function AuctionCountdown({ endTime }: AuctionCountdownProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  const endMs = useMemo(() => new Date(endTime).getTime(), [endTime])
  const timeLeft = endMs - now
  const expired = Number.isNaN(endMs) || timeLeft <= 0

  if (expired) {
    return <span className="text-lg font-black text-rose-600 tabular-nums">Ended</span>
  }

  return (
    <span className="text-3xl font-black text-[#221b16] tabular-nums tracking-tight">
      {formatTimeLeft(timeLeft)}
    </span>
  )
}
