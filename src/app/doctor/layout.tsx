import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import prisma from '@/lib/data/prisma';

interface DoctorLayoutProps {
  children: ReactNode;
}

export default async function DoctorLayout({ children }: DoctorLayoutProps) {
  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/api/auth/signin?callbackUrl=/doctor');
  }

  // Check if user has a doctor profile
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
  });

  // Show access denied if not a doctor
  if (!doctorProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Doctor Access Required</h1>
          <p className="text-gray-600 mb-6">
            This area is restricted to healthcare providers with a registered doctor profile.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6">
        <nav className="space-y-4">
          <Link href="/doctor" className="block hover:text-gray-300">
            Dashboard
          </Link>
          <Link href="/doctor/patients" className="block hover:text-gray-300">
            Patients
          </Link>
          <Link href="/doctor/requests" className="block hover:text-gray-300">
            Requests
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
        <footer className="p-4 text-xs text-gray-500 text-center border-t mt-8">
          This platform provides observational data only. Medical interpretation and consultation occur outside the system.
        </footer>
      </main>
    </div>
  );
}
