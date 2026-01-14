import Midtrans from 'midtrans-client';

// Credit packages
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 9900,
    pricePerCredit: 990,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 19900,
    pricePerCredit: 796,
    recommended: true,
  },
  {
    id: 'value',
    name: 'Value Pack',
    credits: 50,
    price: 34900,
    pricePerCredit: 698,
  },
  {
    id: 'mega',
    name: 'Mega Pack',
    credits: 100,
    price: 59900,
    pricePerCredit: 599,
    bestValue: true,
  },
];

// Initialize Midtrans Snap
export const getMidtransSnap = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not set');
  }

  return new Midtrans.Snap({
    isProduction,
    serverKey,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
  });
};

// Create Snap transaction
export const createSnapTransaction = async (
  orderId: string,
  userId: string,
  userEmail: string,
  userName: string,
  packageId: string
): Promise<string> => {
  const packageData = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!packageData) {
    throw new Error('Invalid package ID');
  }

  const snap = getMidtransSnap();

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: packageData.price,
    },
    customer_details: {
      first_name: userName,
      email: userEmail,
    },
    item_details: [
      {
        id: packageId,
        price: packageData.price,
        quantity: 1,
        name: `${packageData.name} - ${packageData.credits} Credits`,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/success`,
      unfinish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/cancel`,
      error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/error`,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return transaction.token;
  } catch (error: any) {
    console.error('Error creating Snap transaction:', error);
    throw new Error(error.message || 'Failed to create payment transaction');
  }
};

// Verify payment status
export const verifyPayment = async (orderId: string): Promise<any> => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not set');
  }

  const core = new Midtrans.CoreApi({
    isProduction,
    serverKey,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
  });

  try {
    const status = await core.transaction.status(orderId);
    return status;
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
};

// Format Rupiah
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};
