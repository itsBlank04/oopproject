import { Client } from '@stomp/stompjs'
import type { Bid } from '@/types'

let client: Client | null = null

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const wsBase = `${wsProtocol}//${window.location.host}`

export function connectAuction(lotId: number, onBid: (bid: Bid) => void, onLotUpdate: (data: unknown) => void) {
  if (client?.active) {
    client.deactivate()
  }

  client = new Client({
    brokerURL: `${wsBase}/ws`,
    connectHeaders: {},
    debug: () => {},
    reconnectDelay: 5000,
  })

  client.onConnect = () => {
    client?.subscribe(`/topic/lots/${lotId}/bids`, (msg) => {
      try {
        const bid: Bid = JSON.parse(msg.body)
        onBid(bid)
      } catch {}
    })

    client?.subscribe(`/topic/lots/${lotId}`, (msg) => {
      try {
        const data = JSON.parse(msg.body)
        onLotUpdate(data)
      } catch {}
    })
  }

  client.activate()
}

export function disconnectAuction() {
  if (client?.active) {
    client.deactivate()
  }
  client = null
}
