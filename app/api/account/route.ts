import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = decodedToken.admin === true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get account information from Exaroton
    const client = getExarotonClient();
    const account = await (client as any).getAccount();

    return NextResponse.json({
      name: account.name,
      email: account.email,
      credits: account.credits,
      verified: account.verified,
    });
  } catch (error: any) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch account information' },
      { status: 500 }
    );
  }
}
