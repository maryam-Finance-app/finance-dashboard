'use client';
 
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
 
export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
 
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };
 
  return (
    <button
      onClick={handleLogout}
      className="text-sm underline"
    >
      Log out
    </button>
  );
}
 
