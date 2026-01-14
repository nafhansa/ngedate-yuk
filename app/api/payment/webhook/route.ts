import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/services/payment';
import { addCredits } from '@/services/credits';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/services/firebase';
import { CREDIT_PACKAGES } from '@/services/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, transaction_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    // Verify payment status with Midtrans
    const paymentStatus = await verifyPayment(order_id);

    const db = getDbInstance();
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Get payment record
    const paymentDoc = await getDoc(doc(db, 'payments', order_id));
    if (!paymentDoc.exists()) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data();
    const userId = paymentData.userId;
    const packageId = paymentData.packageId;

    // Find package
    const packageData = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!packageData) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    // Update payment status
    await updateDoc(doc(db, 'payments', order_id), {
      status: paymentStatus.transaction_status,
      midtransTransactionId: paymentStatus.transaction_id || transaction_id,
      paymentMethod: paymentStatus.payment_type || null,
      updatedAt: serverTimestamp(),
    });

    // If payment is successful (settlement), add credits
    if (paymentStatus.transaction_status === 'settlement') {
      // Check if credits already added (prevent duplicate)
      if (paymentData.status !== 'settlement') {
        await addCredits(
          userId,
          packageData.credits,
          order_id,
          `Purchased ${packageData.name}`
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
