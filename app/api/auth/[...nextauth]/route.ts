// app/api/auth/[...nextauth]/route.ts
// Handler NextAuth — expõe os endpoints /api/auth/*

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
