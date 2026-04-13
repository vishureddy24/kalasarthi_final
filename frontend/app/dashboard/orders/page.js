import OrdersClient from '@/components/dashboard/OrdersClient'

export const metadata = {
  title: 'My Orders | KalaSarthi',
  description: 'View and manage your orders',
}

export default function OrdersPage() {
  return (
    <div className="container py-6">
      <OrdersClient />
    </div>
  )
}
