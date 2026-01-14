import { NextRequest, NextResponse } from 'next/server';
import { createSnapTransaction, CREDIT_PACKAGES } from '@/services/payment';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/services/firebase';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { packageId, userId, userEmail, userName } = body;

    if (!packageId || !userId || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find package
    const packageData = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!packageData) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `CREDIT-${Date.now()}-${userId.substring(0, 8)}`;

    // Create payment record
    const db = getDbInstance();
    if (db) {
      await setDoc(doc(db, 'payments', orderId), {
        paymentId: orderId,
        userId,
        orderId,
        amount: packageData.price,
        currency: 'IDR',
        status: 'pending',
        paymentMethod: null,
        midtransTransactionId: null,
        packageId,
        credits: packageData.credits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Create Snap transaction
    const snapToken = await createSnapTransaction(
      orderId,
      userId,
      userEmail,
      userName,
      packageId
    );

    return NextResponse.json({
      token: snapToken,
      orderId,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
