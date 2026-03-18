import { CreditCard } from 'lucide-react'

interface BookingPaymentProps {
  specialtyName: string
  servicePrice: number
  depositPercentage: number
  bookingId: string
  onPayLater: () => void
}

export function BookingPayment({
  specialtyName,
  servicePrice,
  depositPercentage,
  bookingId,
  onPayLater,
}: BookingPaymentProps) {
  const depositAmount = Math.round(servicePrice * (depositPercentage / 100))

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900">Deposit payment</h3>
        <p className="text-gray-600">Secure your booking</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Service</span>
          <span className="font-medium">{specialtyName}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Total price</span>
          <span className="font-medium">${servicePrice}</span>
        </div>
        <div className="flex justify-between pt-2 border-t mt-2">
          <span className="font-semibold">Deposit ({depositPercentage}%)</span>
          <span className="font-bold text-blue-600">${depositAmount}</span>
        </div>
      </div>

      <button
        onClick={async () => {
          const response = await fetch('/api/bookings/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              depositAmountInCents: depositAmount * 100,
            }),
          })
          const data = await response.json()
          if (data.url) {
            window.location.href = data.url
          }
        }}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        Pay ${depositAmount}
      </button>

      <button
        onClick={onPayLater}
        className="w-full text-gray-600 py-3 mt-2 hover:text-gray-800"
      >
        Pay later
      </button>
    </div>
  )
}
