import { WifiOff } from 'lucide-react'
import ReloadButton from './ReloadButton'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          You are offline
        </h1>
        <p className="text-gray-600 mb-8">
          It looks like you don&apos;t have an internet connection.
          Please check your connection and try again.
        </p>

        <ReloadButton />
      </div>
    </div>
  )
}
