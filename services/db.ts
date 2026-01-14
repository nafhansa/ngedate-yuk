import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { array2DToObject } from '@/utils/helpers';

// Helper to get db instance or throw error
const getDb = () => {
  const dbInstance = getDbInstance();
  if (!dbInstance) {
    throw new Error('Firebase not initialized');
  }
  return dbInstance;
};

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  partnerUid: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
  credits: number;
  freeCredits: number;
  totalCreditsPurchased: number;
  isAdmin?: boolean; // Admin dengan unlimited credits
}

export interface PartnerRequest {
  requestId: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: Timestamp;
}

export type GameType = 'tictactoe' | 'connect4' | 'seabattle' | 'dotsboxes';
export type MatchStatus = 'waiting' | 'playing' | 'finished';

export interface MatchData {
  matchId: string;
  gameType: GameType;
  status: MatchStatus;
  players: string[];
  turn: string;
  winnerUid: string | null;
  createdAt: Timestamp;
  lastMoveAt: Timestamp;
  gameState: any;
  roomCode?: string;
  playersReady?: Record<string, boolean>; // { "uid1": true, "uid2": false }
  creditsDeducted?: boolean; // Apakah credit sudah terpotong
  creditsDeductedAt?: Timestamp | null;
}

export const getUser = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(getDb(), 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Admin emails dengan unlimited credits
const ADMIN_EMAILS = [
  'nafhan.sh@gmail.com',
  '18224027@std.stei.itb.ac.id',
  'nafhangojek@gmail.com',
  'nafhan1723@gmail.com',
  'nailatisha8@gmail.com',
];

export const createUser = async (user: FirebaseUser): Promise<void> => {
  try {
    const isAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
    
    const userData: Omit<UserData, 'createdAt' | 'lastLogin'> = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      partnerUid: null,
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
      },
      credits: isAdmin ? 999999 : 5, // Admin unlimited, user baru dapat 5 free credits
      freeCredits: isAdmin ? 0 : 5, // Free credits untuk user baru
      totalCreditsPurchased: 0,
      isAdmin: isAdmin,
    };

    await setDoc(doc(getDb(), 'users', user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserLastLogin = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(getDb(), 'users', uid), {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<UserData | null> => {
  try {
    const q = query(collection(getDb(), 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Request partner connection
export const requestPartner = async (currentUid: string, partnerEmail: string): Promise<void> => {
  try {
    const partnerUser = await getUserByEmail(partnerEmail);
    if (!partnerUser) {
      throw new Error('Partner not found');
    }

    if (partnerUser.uid === currentUid) {
      throw new Error('Cannot add yourself as partner');
    }

    if (partnerUser.partnerUid) {
      throw new Error('This user already has a partner');
    }

    // Check if there's already a pending request
    const existingRequest = await getPendingRequest(currentUid, partnerUser.uid);
    if (existingRequest) {
      throw new Error('You already sent a request to this user');
    }

    // Check if there's a request from them to you
    const incomingRequest = await getPendingRequest(partnerUser.uid, currentUid);
    if (incomingRequest) {
      throw new Error('This user already sent you a request. Please check your profile.');
    }

    // Create request document in partnerRequests collection
    const requestRef = doc(collection(getDb(), 'partnerRequests'));
    await setDoc(requestRef, {
      requestId: requestRef.id,
      fromUid: currentUid,
      toUid: partnerUser.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error requesting partner:', error);
    throw error;
  }
};

// Get pending request between two users
export const getPendingRequest = async (fromUid: string, toUid: string): Promise<PartnerRequest | null> => {
  try {
    const q = query(
      collection(getDb(), 'partnerRequests'),
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as PartnerRequest;
    }
    return null;
  } catch (error) {
    console.error('Error getting pending request:', error);
    return null;
  }
};

// Get incoming requests for a user
export const getIncomingRequests = async (uid: string): Promise<PartnerRequest[]> => {
  try {
    const q = query(
      collection(getDb(), 'partnerRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as PartnerRequest);
  } catch (error) {
    console.error('Error getting incoming requests:', error);
    return [];
  }
};

// Approve partner request
export const approvePartnerRequest = async (currentUid: string, requestId: string): Promise<void> => {
  try {
    const requestDoc = await getDoc(doc(getDb(), 'partnerRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const request = requestDoc.data() as PartnerRequest;
    if (request.toUid !== currentUid) {
      throw new Error('Unauthorized: This request is not for you');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    const requesterUid = request.fromUid;
    const requesterUser = await getUser(requesterUid);
    if (!requesterUser) {
      throw new Error('Requester not found');
    }

    const currentUser = await getUser(currentUid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    if (requesterUser.partnerUid || currentUser.partnerUid) {
      throw new Error('One of the users already has a partner');
    }

    // Update request status first (this is allowed by rules)
    await updateDoc(doc(getDb(), 'partnerRequests', requestId), {
      status: 'approved',
    });

    // Update current user - set partner (own document, allowed)
    await updateDoc(doc(getDb(), 'users', currentUid), {
      partnerUid: requesterUid,
    });

    // Update requester user - set partner (other user's document, needs special rule)
    try {
      await updateDoc(doc(getDb(), 'users', requesterUid), {
        partnerUid: currentUid,
      });
    } catch (error: any) {
      // If update fails, rollback current user's partnerUid
      await updateDoc(doc(getDb(), 'users', currentUid), {
        partnerUid: null,
      });
      await updateDoc(doc(getDb(), 'partnerRequests', requestId), {
        status: 'pending',
      });
      throw new Error(`Failed to update partner: ${error.message}`);
    }

    // Delete other pending requests from/to these users
    const allRequests = await getDocs(
      query(
        collection(getDb(), 'partnerRequests'),
        where('status', '==', 'pending')
      )
    );
    
    const batch = writeBatch(getDb());
    allRequests.docs.forEach(docSnap => {
      const req = docSnap.data() as PartnerRequest;
      if ((req.fromUid === currentUid || req.toUid === currentUid || 
           req.fromUid === requesterUid || req.toUid === requesterUid) &&
          docSnap.id !== requestId) {
        batch.delete(docSnap.ref);
      }
    });
    
    if (allRequests.docs.length > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error approving partner request:', error);
    throw error;
  }
};

// Decline partner request
export const declinePartnerRequest = async (currentUid: string, requestId: string): Promise<void> => {
  try {
    const requestDoc = await getDoc(doc(getDb(), 'partnerRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const request = requestDoc.data() as PartnerRequest;
    if (request.toUid !== currentUid) {
      throw new Error('Unauthorized: This request is not for you');
    }

    if (request.status !== 'pending') {
      throw new Error('This request has already been processed');
    }

    // Update request status to declined
    await updateDoc(doc(getDb(), 'partnerRequests', requestId), {
      status: 'declined',
    });
  } catch (error) {
    console.error('Error declining partner request:', error);
    throw error;
  }
};

// Remove partner relationship
export const removePartner = async (currentUid: string): Promise<void> => {
  try {
    const currentUser = await getUser(currentUid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    if (!currentUser.partnerUid) {
      throw new Error('You do not have a partner');
    }

    const partnerUid = currentUser.partnerUid;

    // Verify partner relationship is mutual
    const partnerUser = await getUser(partnerUid);
    if (!partnerUser) {
      throw new Error('Partner not found');
    }

    if (partnerUser.partnerUid !== currentUid) {
      throw new Error('Partner relationship is not mutual');
    }

    // Use batch write for atomic operation
    const batch = writeBatch(getDb());
    
    // Update current user - remove partner (own document, allowed)
    batch.update(doc(getDb(), 'users', currentUid), {
      partnerUid: null,
    });

    // Update partner user - remove partner (other user's document, needs special rule)
    batch.update(doc(getDb(), 'users', partnerUid), {
      partnerUid: null,
    });

    // Commit both updates atomically
    await batch.commit();
  } catch (error) {
    console.error('Error removing partner:', error);
    throw error;
  }
};

// Update user display name
export const updateDisplayName = async (uid: string, displayName: string): Promise<void> => {
  try {
    if (!displayName.trim()) {
      throw new Error('Display name cannot be empty');
    }

    if (displayName.trim().length > 50) {
      throw new Error('Display name must be 50 characters or less');
    }

    await updateDoc(doc(getDb(), 'users', uid), {
      displayName: displayName.trim(),
    });
  } catch (error) {
    console.error('Error updating display name:', error);
    throw error;
  }
};

// Generate a random 6-character room code
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a room with a room code (player 1 creates room)
export const createRoomWithCode = async (
  gameType: GameType,
  hostUid: string
): Promise<{ matchId: string; roomCode: string }> => {
  try {
    const matchRef = doc(collection(getDb(), 'matches'));
    const matchId = matchRef.id;
    const roomCode = generateRoomCode();

    const initialGameState = getInitialGameState(gameType);

    await setDoc(matchRef, {
      matchId,
      gameType,
      status: 'waiting' as MatchStatus,
      players: [hostUid],
      turn: hostUid,
      winnerUid: null,
      createdAt: serverTimestamp(),
      lastMoveAt: serverTimestamp(),
      gameState: initialGameState,
      roomCode,
      playersReady: { [hostUid]: false },
      creditsDeducted: false,
      creditsDeductedAt: null,
    });

    return { matchId, roomCode };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Join a room by room code (player 2 joins)
export const joinRoomByCode = async (
  roomCode: string,
  gameType: GameType,
  playerUid: string
): Promise<string> => {
  try {
    const upperRoomCode = roomCode.toUpperCase();
    console.log('Joining room:', { roomCode: upperRoomCode, gameType, playerUid });

    // Find match with this room code, game type, and status 'waiting'
    const q = query(
      collection(getDb(), 'matches'),
      where('roomCode', '==', upperRoomCode),
      where('gameType', '==', gameType),
      where('status', '==', 'waiting')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Query result:', { 
      empty: querySnapshot.empty, 
      size: querySnapshot.size,
      docs: querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    });

    if (querySnapshot.empty) {
      // Try to find if room exists but with different status
      const qAnyStatus = query(
        collection(getDb(), 'matches'),
        where('roomCode', '==', upperRoomCode),
        where('gameType', '==', gameType)
      );
      const anyStatusSnapshot = await getDocs(qAnyStatus);
      
      if (!anyStatusSnapshot.empty) {
        const matchData = anyStatusSnapshot.docs[0].data() as MatchData;
        if (matchData.status !== 'waiting') {
          throw new Error('Room sudah dimulai atau selesai');
        }
        if (matchData.players.length >= 2) {
          throw new Error('Room sudah penuh');
        }
      }
      
      throw new Error('Room tidak ditemukan. Pastikan kode room benar dan game type sesuai');
    }

    const matchDoc = querySnapshot.docs[0];
    const matchData = matchDoc.data() as MatchData;

    // Check if player is already in the room
    if (matchData.players.includes(playerUid)) {
      console.log('Player already in room, returning matchId');
      return matchData.matchId;
    }

    // Check if room is full
    if (matchData.players.length >= 2) {
      throw new Error('Room sudah penuh');
    }

    // Add player to the room
    console.log('Adding player to room:', { 
      currentPlayers: matchData.players, 
      newPlayer: playerUid 
    });
    const hostUid = matchData.players[0];
    await updateDoc(matchDoc.ref, {
      players: [...matchData.players, playerUid],
      playersReady: { [hostUid]: false, [playerUid]: false },
    });

    console.log('Successfully joined room:', matchData.matchId);
    return matchData.matchId;
  } catch (error: any) {
    console.error('Error joining room:', error);
    // If it's a Firebase permissions error, provide helpful message
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      throw new Error('Tidak memiliki izin. Pastikan Firestore rules sudah di-deploy');
    }
    // Re-throw with original message if it's already a user-friendly error
    if (error.message && !error.code) {
      throw error;
    }
    throw new Error(error.message || 'Gagal bergabung ke room');
  }
};

// Legacy function - keep for backward compatibility but mark as deprecated
export const createMatch = async (
  gameType: GameType,
  hostUid: string,
  partnerUid: string
): Promise<string> => {
  try {
    const matchRef = doc(collection(getDb(), 'matches'));
    const matchId = matchRef.id;
    const roomCode = generateRoomCode();

    const initialGameState = getInitialGameState(gameType);

    await setDoc(matchRef, {
      matchId,
      gameType,
      status: 'waiting' as MatchStatus,
      players: [hostUid, partnerUid],
      turn: hostUid,
      winnerUid: null,
      createdAt: serverTimestamp(),
      lastMoveAt: serverTimestamp(),
      gameState: initialGameState,
      roomCode,
    });

    return matchId;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

export const getMatch = async (matchId: string): Promise<MatchData | null> => {
  try {
    const matchDoc = await getDoc(doc(getDb(), 'matches', matchId));
    if (matchDoc.exists()) {
      return matchDoc.data() as MatchData;
    }
    return null;
  } catch (error) {
    console.error('Error getting match:', error);
    throw error;
  }
};

export const updateMatch = async (matchId: string, updates: Partial<MatchData>): Promise<void> => {
  try {
    await updateDoc(doc(getDb(), 'matches', matchId), {
      ...updates,
      lastMoveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
};

export const getMatchHistory = async (uid: string): Promise<MatchData[]> => {
  try {
    const q = query(
      collection(getDb(), 'matches'),
      where('players', 'array-contains', uid),
      where('status', '==', 'finished')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MatchData);
  } catch (error) {
    console.error('Error getting match history:', error);
    throw error;
  }
};

function getInitialGameState(gameType: GameType): any {
  switch (gameType) {
    case 'tictactoe':
      return { board: Array(9).fill(null) };
    case 'connect4':
      // Convert nested array to object for Firestore compatibility
      const connect4Grid = Array(10).fill(null).map(() => Array(10).fill(null));
      return { 
        grid: array2DToObject(connect4Grid),
        gridRows: 10,
        gridCols: 10,
      };
    case 'dotsboxes':
      // Convert nested arrays to objects for Firestore compatibility
      // 8x8 grid: 9 dots per side = 9 rows of hLines with 8 cols, 8 rows of vLines with 9 cols
      const hLines = Array(9).fill(null).map(() => Array(8).fill(false));
      const vLines = Array(8).fill(null).map(() => Array(9).fill(false));
      return {
        hLines: array2DToObject(hLines),
        vLines: array2DToObject(vLines),
        hLinesRows: 9,
        hLinesCols: 8,
        vLinesRows: 8,
        vLinesCols: 9,
        boxes: Array(64).fill(null),
        scores: {},
      };
    case 'seabattle':
      return {
        p1Board: null,
        p2Board: null,
        p1Shots: [],
        p2Shots: [],
        p1Ready: false,
        p2Ready: false,
      };
    default:
      return {};
  }
}

// Set player ready status
export const setPlayerReady = async (matchId: string, userId: string): Promise<void> => {
  try {
    const match = await getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (!match.players.includes(userId)) {
      throw new Error('User is not a participant in this match');
    }
    
    if (match.status !== 'waiting') {
      throw new Error('Match is not in waiting status');
    }
    
    if (match.creditsDeducted) {
      throw new Error('Credits already deducted');
    }
    
    const playersReady = match.playersReady || {};
    playersReady[userId] = true;
    
    await updateDoc(doc(getDb(), 'matches', matchId), {
      playersReady,
    });
  } catch (error) {
    console.error('Error setting player ready:', error);
    throw error;
  }
};

// Check if both players are ready and start game (deduct credits)
export const checkAndStartGame = async (matchId: string): Promise<boolean> => {
  try {
    const match = await getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (match.status !== 'waiting') {
      return false;
    }
    
    if (match.creditsDeducted) {
      // Credits already deducted, just start the game
      if (match.status === 'waiting') {
        await updateMatch(matchId, { status: 'playing' });
      }
      return true;
    }
    
    if (match.players.length !== 2) {
      return false;
    }
    
    const playersReady = match.playersReady || {};
    const [player1, player2] = match.players;
    
    const player1Ready = playersReady[player1] || false;
    const player2Ready = playersReady[player2] || false;
    
    if (player1Ready && player2Ready) {
      // Both ready, deduct credits and start game
      const { deductCreditsForBothPlayers } = await import('./credits');
      
      try {
        await deductCreditsForBothPlayers(player1, player2, matchId, 1);
        
        // Update match: deduct credits and start game
        await updateDoc(doc(getDb(), 'matches', matchId), {
          creditsDeducted: true,
          creditsDeductedAt: serverTimestamp(),
          status: 'playing' as MatchStatus,
        });
        
        return true;
      } catch (error: any) {
        console.error('Error deducting credits:', error);
        // If credit deduction fails, reset ready status for both players
        await updateDoc(doc(getDb(), 'matches', matchId), {
          playersReady: { [player1]: false, [player2]: false },
        });
        throw error;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking and starting game:', error);
    throw error;
  }
};
