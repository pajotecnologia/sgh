import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona a raiz do site para o dashboard (ou login caso não esteja autenticado, via middleware)
  redirect('/dashboard');
}
