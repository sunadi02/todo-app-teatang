'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import type { User } from '@/lib/abac';
import { useState } from 'react';

interface SidebarProps {
  currentUser: User;
}

export function Sidebar({ currentUser }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-6 border-b bg-indigo-600">
        <h1 className="text-xl font-bold text-white">TaskFlow</h1>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Link
            href="/"
            className={cn(
              "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/" 
                ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200" 
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            My Todos
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        {currentUser.role === 'admin' && (
          <div className="text-sm font-semibold text-gray-900 mb-2">Admin</div>
        )}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full justify-start border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}
