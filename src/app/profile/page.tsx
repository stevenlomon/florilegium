// The Profile Page is a Server component! No `useEffect` and no `useState`! All handled on the server by the server
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function ProfilePage() {
  // The Server Side user check, which runs before the browser even sees the page! 
  const user = await getCurrentUser();

  // If no JWT cookie exists, gracefully redirect them to the login page (to be built next)
  if (!user) {
    redirect('/login');
  }

  // The rendering. All of this HTML will arrive in the browser fully baked with data!
  return (
    <div>ProfilePage</div>
  )
}
