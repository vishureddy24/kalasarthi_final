import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata = {
  title: 'Dashboard | KalaSarthi',
  description: 'Manage your artisan profile and discover handcrafted products',
}

export default function DashboardPage() {
  return (
    <div className="container py-6">
      <DashboardClient />
    </div>
  )
}
