import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/customer-auth';

export default async function ContaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('customer-session')?.value;
  const session = getCustomerSession(token);

  if (session) {
    redirect(`/r/${slug}/conta/reservas`);
  } else {
    redirect(`/r/${slug}/conta/login`);
  }
}
