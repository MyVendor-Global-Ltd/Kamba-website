'use client'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <button
        onClick={() => reset()}
        className="mt-4 text-primary hover:underline"
      >
        Try again
      </button>
    </div>
  )
}