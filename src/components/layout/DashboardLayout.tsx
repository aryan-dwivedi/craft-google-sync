import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export function DashboardLayout({ children, userEmail }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userEmail={userEmail} />
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}
