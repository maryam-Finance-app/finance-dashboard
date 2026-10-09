import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';
import LogoutButton from '@/components/LogoutButton';
 
export default async function Home() {
  const supabase = await createClient();
 
  // getUser() re-validates the session with Supabase (don't use getSession() for protection)
  const {
    data: { user },
  } = await supabase.auth.getUser();
 
  if (!user) {
    redirect('/auth');
  }
 
  // RLS only lets the user read their own profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();
 
  const username = profile?.username ?? user.email;
 
  return (
    <div className="p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Financial Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Hi, <span className="font-medium">{username}</span>
          </span>
          <LogoutButton />
        </div>
      </header>
    </div>
  );
}
