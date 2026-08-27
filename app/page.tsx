import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  // Redireciona a raiz do site para login/dashboard
  redirect('/login');
}
