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
import { db } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';

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
}

export const getUser = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const createUser = async (user: FirebaseUser): Promise<void> => {
  try {
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
    };

    await setDoc(doc(db, 'users', user.uid), {
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
    await updateDoc(doc(db, 'users', uid), {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<UserData | null> => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
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
    const requestRef = doc(collection(db, 'partnerRequests'));
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
      collection(db, 'partnerRequests'),
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
      collection(db, 'partnerRequests'),
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
    const requestDoc = await getDoc(doc(db, 'partnerRequests', requestId));
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
    await updateDoc(doc(db, 'partnerRequests', requestId), {
      status: 'approved',
    });

    // Update current user - set partner (own document, allowed)
    await updateDoc(doc(db, 'users', currentUid), {
      partnerUid: requesterUid,
    });

    // Update requester user - set partner (other user's document, needs special rule)
    try {
      await updateDoc(doc(db, 'users', requesterUid), {
        partnerUid: currentUid,
      });
    } catch (error: any) {
      // If update fails, rollback current user's partnerUid
      await updateDoc(doc(db, 'users', currentUid), {
        partnerUid: null,
      });
      await updateDoc(doc(db, 'partnerRequests', requestId), {
        status: 'pending',
      });
      throw new Error(`Failed to update partner: ${error.message}`);
    }

    // Delete other pending requests from/to these users
    const allRequests = await getDocs(
      query(
        collection(db, 'partnerRequests'),
        where('status', '==', 'pending')
      )
    );
    
    const batch = writeBatch(db);
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
    const requestDoc = await getDoc(doc(db, 'partnerRequests', requestId));
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
    await updateDoc(doc(db, 'partnerRequests', requestId), {
      status: 'declined',
    });
  } catch (error) {
    console.error('Error declining partner request:', error);
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
    const matchRef = doc(collection(db, 'matches'));
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
      collection(db, 'matches'),
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
        collection(db, 'matches'),
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
    await updateDoc(matchDoc.ref, {
      players: [...matchData.players, playerUid],
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
    const matchRef = doc(collection(db, 'matches'));
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
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
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
    await updateDoc(doc(db, 'matches', matchId), {
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
      collection(db, 'matches'),
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
      return { grid: Array(6).fill(null).map(() => Array(7).fill(null)) };
    case 'dotsboxes':
      return {
        hLines: Array(4).fill(null).map(() => Array(3).fill(false)),
        vLines: Array(3).fill(null).map(() => Array(4).fill(false)),
        boxes: Array(9).fill(null),
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
