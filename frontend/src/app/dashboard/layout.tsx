import { AuthProvider } from '@/contexts/AuthContext';
import DashboardNav from '@/components/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardNav />
        {/* pt-14 offsets the mobile top bar; lg:ml-64 offsets the desktop sidebar */}
        <main className="flex-1 pt-14 lg:pt-0 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
