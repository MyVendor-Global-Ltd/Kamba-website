'use client'

import { useMemo } from 'react'

function appendBits(target: number[], value: number, length: number) {
  for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1)
}

function multiplyGf256(left: number, right: number) {
  let result = 0
  let a = left
  let b = right
  while (b > 0) {
    if (b & 1) result ^= a
    a <<= 1
    if (a & 0x100) a ^= 0x11d
    b >>>= 1
  }
  return result
}

function encodeNumericQr(value: string): boolean[][] {
  if (!/^\d{6}$/.test(value)) return []

  const bits: number[] = [0, 0, 0, 1]
  appendBits(bits, value.length, 10)
  for (let index = 0; index < value.length; index += 3) {
    const chunk = value.slice(index, index + 3)
    appendBits(bits, Number(chunk), chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4)
  }

  const capacity = 19 * 8
  bits.push(...Array(Math.min(4, capacity - bits.length)).fill(0))
  while (bits.length % 8 !== 0) bits.push(0)

  const data: number[] = []
  for (let index = 0; index < bits.length; index += 8) {
    let byte = 0
    for (let bit = 0; bit < 8; bit += 1) byte = (byte << 1) | bits[index + bit]
    data.push(byte)
  }
  const padding = [0xec, 0x11]
  let paddingIndex = 0
  while (data.length < 19) data.push(padding[paddingIndex++ % 2])

  let generator = [1]
  let root = 1
  for (let index = 0; index < 7; index += 1) {
    const next = Array(generator.length + 1).fill(0)
    generator.forEach((coefficient, coefficientIndex) => {
      next[coefficientIndex] ^= coefficient
      next[coefficientIndex + 1] ^= multiplyGf256(coefficient, root)
    })
    generator = next
    root = multiplyGf256(root, 2)
  }

  const message = [...data, ...Array(7).fill(0)]
  for (let index = 0; index < 19; index += 1) {
    const factor = message[index]
    if (factor === 0) continue
    generator.forEach((coefficient, coefficientIndex) => {
      message[index + coefficientIndex] ^= multiplyGf256(coefficient, factor)
    })
  }

  const codewords = [...data, ...message.slice(19)]
  const stream = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, bit) => (byte >>> (7 - bit)) & 1))
  const size = 21
  const matrix: Array<Array<boolean | null>> = Array.from({ length: size }, () => Array(size).fill(null))
  const functionModules = Array.from({ length: size }, () => Array(size).fill(false))

  const setFunction = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    matrix[y][x] = dark
    functionModules[y][x] = true
  }

  for (const [originX, originY] of [[0, 0], [14, 0], [0, 14]]) {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
        const dark = inside && (
          dx === 0 || dx === 6 || dy === 0 || dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
        )
        setFunction(originX + dx, originY + dy, dark)
      }
    }
  }

  for (let index = 8; index <= 12; index += 1) {
    setFunction(index, 6, index % 2 === 0)
    setFunction(6, index, index % 2 === 0)
  }
  setFunction(8, 13, true)

  const formatData = (1 << 3)
  let remainder = formatData << 10
  for (let bit = 14; bit >= 10; bit -= 1) {
    if ((remainder >>> bit) & 1) remainder ^= 0x537 << (bit - 10)
  }
  const formatBits = ((formatData << 10) | remainder) ^ 0x5412
  for (let bit = 0; bit < 6; bit += 1) setFunction(8, bit, ((formatBits >>> bit) & 1) !== 0)
  setFunction(8, 7, ((formatBits >>> 6) & 1) !== 0)
  setFunction(8, 8, ((formatBits >>> 7) & 1) !== 0)
  setFunction(7, 8, ((formatBits >>> 8) & 1) !== 0)
  for (let bit = 9; bit < 15; bit += 1) setFunction(14 - bit, 8, ((formatBits >>> bit) & 1) !== 0)
  for (let bit = 0; bit < 8; bit += 1) setFunction(size - 1 - bit, 8, ((formatBits >>> bit) & 1) !== 0)
  for (let bit = 8; bit < 15; bit += 1) setFunction(8, size - 15 + bit, ((formatBits >>> bit) & 1) !== 0)

  let streamIndex = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vertical = 0; vertical < size; vertical += 1) {
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset
        const upward = ((right + 1) & 2) === 0
        const y = upward ? size - 1 - vertical : vertical
        if (functionModules[y][x]) continue
        let dark = streamIndex < stream.length ? stream[streamIndex] === 1 : false
        streamIndex += 1
        if ((x + y) % 2 === 0) dark = !dark
        matrix[y][x] = dark
      }
    }
  }

  return matrix.map((row) => row.map(Boolean))
}

export function PickupQr({ value }: { value: string }) {
  const matrix = useMemo(() => encodeNumericQr(value), [value])
  if (matrix.length !== 21) return <p className="text-sm text-text-secondary">A six-digit pickup code is required to generate this QR pass.</p>

  return (
    <div className="mx-auto w-full max-w-56 rounded-xl bg-white p-4 text-primary">
      <svg viewBox="0 0 29 29" role="img" aria-label="QR code containing the one-time pickup code" className="h-auto w-full" shapeRendering="crispEdges">
        <rect width="29" height="29" fill="white" />
        {matrix.flatMap((row, y) => row.map((dark, x) => dark ? <rect key={`${x}-${y}`} x={x + 4} y={y + 4} width="1" height="1" fill="currentColor" /> : null))}
      </svg>
      <p className="mt-2 text-center text-xs font-medium text-primary">Kamba pickup pass</p>
    </div>
  )
}
