import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { getUser } from './db';

// Helper to get db instance or throw error
const getDb = () => {
  const dbInstance = getDbInstance();
  if (!dbInstance) {
    throw new Error('Firebase not initialized');
  }
  return dbInstance;
};

export interface CreditTransaction {
  transactionId: string;
  userId: string;
  type: 'purchase' | 'deduct' | 'bonus';
  amount: number; // Jumlah credit (bisa positif untuk purchase/bonus, negatif untuk deduct)
  matchId: string | null;
  midtransOrderId: string | null;
  description: string;
  createdAt: Timestamp;
}

// Get current credit balance
export const getUserCredits = async (uid: string): Promise<number> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      throw new Error('User not found');
    }
    return user.credits || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
};

// Check if user has sufficient credits
export const checkSufficientCredits = async (uid: string, required: number = 1): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      return false;
    }
    
    // Admin memiliki unlimited credits
    if (user.isAdmin) {
      return true;
    }
    
    return (user.credits || 0) >= required;
  } catch (error) {
    console.error('Error checking sufficient credits:', error);
    return false;
  }
};

// Deduct credits from user (deduct from free credits first, then paid credits)
export const deductCredits = async (uid: string, matchId: string, amount: number = 1): Promise<void> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Admin tidak perlu deduct credits
    if (user.isAdmin) {
      // Admin has unlimited credits, no deduction needed
      return;
    }
    
    const currentCredits = user.credits || 0;
    const currentFreeCredits = user.freeCredits || 0;
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct from free credits first, then paid credits
    let remainingDeduct = amount;
    let newFreeCredits = currentFreeCredits;
    let newCredits = currentCredits;
    
    if (currentFreeCredits > 0) {
      const deductFromFree = Math.min(remainingDeduct, currentFreeCredits);
      newFreeCredits = currentFreeCredits - deductFromFree;
      remainingDeduct -= deductFromFree;
    }
    
    if (remainingDeduct > 0) {
      newCredits = currentCredits - remainingDeduct;
    } else {
      newCredits = currentCredits - amount;
    }
    
    // Update user credits
    await updateDoc(doc(getDb(), 'users', uid), {
      credits: newCredits,
      freeCredits: newFreeCredits,
    });
    
    // Create transaction record
    await createCreditTransaction({
      userId: uid,
      type: 'deduct',
      amount: -amount,
      matchId,
      description: `Deducted ${amount} credit(s) for game`,
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};

// Add credits to user (after purchase)
export const addCredits = async (
  uid: string, 
  amount: number, 
  midtransOrderId: string | null = null,
  description?: string
): Promise<void> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentCredits = user.credits || 0;
    const currentPurchased = user.totalCreditsPurchased || 0;
    
    // Update user credits
    await updateDoc(doc(getDb(), 'users', uid), {
      credits: currentCredits + amount,
      totalCreditsPurchased: currentPurchased + amount,
    });
    
    // Create transaction record
    await createCreditTransaction({
      userId: uid,
      type: 'purchase',
      amount,
      matchId: null,
      midtransOrderId,
      description: description || `Purchased ${amount} credit(s)`,
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

// Create credit transaction record
const createCreditTransaction = async (data: {
  userId: string;
  type: 'purchase' | 'deduct' | 'bonus';
  amount: number;
  matchId: string | null;
  midtransOrderId?: string | null;
  description: string;
}): Promise<void> => {
  try {
    const transactionRef = doc(collection(getDb(), 'creditTransactions'));
    await setDoc(transactionRef, {
      transactionId: transactionRef.id,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      matchId: data.matchId,
      midtransOrderId: data.midtransOrderId || null,
      description: data.description,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    throw error;
  }
};

// Get credit transaction history
export const getCreditTransactions = async (uid: string): Promise<CreditTransaction[]> => {
  try {
    const q = query(
      collection(getDb(), 'creditTransactions'),
      where('userId', '==', uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CreditTransaction);
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    return [];
  }
};

// Deduct credits for both players atomically
export const deductCreditsForBothPlayers = async (
  player1Uid: string,
  player2Uid: string,
  matchId: string,
  amount: number = 1
): Promise<void> => {
  try {
    const batch = writeBatch(getDb());
    
    // Get both users
    const [user1, user2] = await Promise.all([
      getUser(player1Uid),
      getUser(player2Uid),
    ]);
    
    if (!user1 || !user2) {
      throw new Error('One or both users not found');
    }
    
    // Deduct for player 1 (if not admin)
    if (!user1.isAdmin) {
      const currentCredits1 = user1.credits || 0;
      const currentFreeCredits1 = user1.freeCredits || 0;
      
      if (currentCredits1 < amount) {
        throw new Error(`Player 1 (${user1.displayName}) has insufficient credits`);
      }
      
      let newFreeCredits1 = currentFreeCredits1;
      let newCredits1 = currentCredits1;
      let remainingDeduct1 = amount;
      
      if (currentFreeCredits1 > 0) {
        const deductFromFree = Math.min(remainingDeduct1, currentFreeCredits1);
        newFreeCredits1 = currentFreeCredits1 - deductFromFree;
        remainingDeduct1 -= deductFromFree;
      }
      
      if (remainingDeduct1 > 0) {
        newCredits1 = currentCredits1 - remainingDeduct1;
      } else {
        newCredits1 = currentCredits1 - amount;
      }
      
      batch.update(doc(getDb(), 'users', player1Uid), {
        credits: newCredits1,
        freeCredits: newFreeCredits1,
      });
    }
    
    // Deduct for player 2 (if not admin)
    if (!user2.isAdmin) {
      const currentCredits2 = user2.credits || 0;
      const currentFreeCredits2 = user2.freeCredits || 0;
      
      if (currentCredits2 < amount) {
        throw new Error(`Player 2 (${user2.displayName}) has insufficient credits`);
      }
      
      let newFreeCredits2 = currentFreeCredits2;
      let newCredits2 = currentCredits2;
      let remainingDeduct2 = amount;
      
      if (currentFreeCredits2 > 0) {
        const deductFromFree = Math.min(remainingDeduct2, currentFreeCredits2);
        newFreeCredits2 = currentFreeCredits2 - deductFromFree;
        remainingDeduct2 -= deductFromFree;
      }
      
      if (remainingDeduct2 > 0) {
        newCredits2 = currentCredits2 - remainingDeduct2;
      } else {
        newCredits2 = currentCredits2 - amount;
      }
      
      batch.update(doc(getDb(), 'users', player2Uid), {
        credits: newCredits2,
        freeCredits: newFreeCredits2,
      });
    }
    
    // Commit batch
    await batch.commit();
    
    // Create transaction records (only for non-admin players)
    const transactionPromises = [];
    
    if (!user1.isAdmin) {
      transactionPromises.push(
        createCreditTransaction({
          userId: player1Uid,
          type: 'deduct',
          amount: -amount,
          matchId,
          description: `Deducted ${amount} credit(s) for game`,
        })
      );
    }
    
    if (!user2.isAdmin) {
      transactionPromises.push(
        createCreditTransaction({
          userId: player2Uid,
          type: 'deduct',
          amount: -amount,
          matchId,
          description: `Deducted ${amount} credit(s) for game`,
        })
      );
    }
    
    if (transactionPromises.length > 0) {
      await Promise.all(transactionPromises);
    }
  } catch (error) {
    console.error('Error deducting credits for both players:', error);
    throw error;
  }
};
