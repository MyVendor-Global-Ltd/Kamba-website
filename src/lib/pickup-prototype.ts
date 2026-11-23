'use client'

export type PickupStage = 'awaiting_confirmation' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'collected'
export interface PickupDemo {
  orderId: string
  orderNumber: string
  stage: PickupStage
  pickupCode?: string
  pickupLocation?: string
  readyAt?: string
  collectedAt?: string
  disputeWindowEndsAt?: string
  payoutStatus: 'held' | 'awaiting_dispute_window' | 'eligible_for_processing'
}

const STORAGE_KEY = 'kamba_pickup_prototype'
const DEMO_LOCATION = 'Kamba Demo Collection Point, Port Harcourt, Rivers State (prototype location — not a real collection address)'

function readAll(): Record<string, PickupDemo> {
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function createUniquePickupCode(usedCodes: Set<string>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000))
    if (!usedCodes.has(candidate)) return candidate
  }
  throw new Error('Could not generate a unique pickup code. Try again.')
}
function save(record: PickupDemo) {
  const all = readAll()
  all[record.orderId] = record
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return record
}
export function getPickupDemo(orderId: string): PickupDemo {
  const all = readAll()
  return all[orderId] || { orderId, orderNumber: orderId.toUpperCase(), stage: 'awaiting_confirmation', payoutStatus: 'held' }
}
export function listPickupDemos(): PickupDemo[] { return Object.values(readAll()) }
export function confirmPickupOrderDemo(orderId: string) {
  const current = getPickupDemo(orderId)
  if (current.stage !== 'awaiting_confirmation') throw new Error('This order is not awaiting vendor confirmation.')
  return save({ ...current, stage: 'confirmed' })
}
export function setPickupStage(orderId: string, stage: 'preparing' | 'ready_for_pickup') {
  const current = getPickupDemo(orderId)
  if (stage === 'preparing' && current.stage !== 'confirmed') throw new Error('Confirm the order before preparing it.')
  if (stage === 'ready_for_pickup' && current.stage !== 'preparing') throw new Error('Move the order to Preparing before marking it ready.')
  const next: PickupDemo = { ...current, stage }
  if (stage === 'ready_for_pickup') {
    const usedCodes = new Set(Object.values(readAll()).map((record) => record.pickupCode).filter((code): code is string => Boolean(code)))
    next.pickupCode = createUniquePickupCode(usedCodes)
    next.pickupLocation = DEMO_LOCATION
    next.readyAt = new Date().toISOString()
  }
  return save(next)
}
export function verifyPickupDemo(orderId: string, code: string) {
  const current = getPickupDemo(orderId)
  if (current.stage !== 'ready_for_pickup' || !current.pickupCode || current.pickupCode !== code.trim()) return { valid: false, record: current }
  return { valid: true, record: current }
}
export function confirmPickupDemo(orderId: string, code: string) {
  const result = verifyPickupDemo(orderId, code)
  if (!result.valid) throw new Error('Pickup code is invalid or the order is not ready.')
  const now = new Date()
  return save({ ...result.record, stage: 'collected', collectedAt: now.toISOString(), disputeWindowEndsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), payoutStatus: 'awaiting_dispute_window' })
}
