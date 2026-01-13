'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { requestPartner, approvePartnerRequest, declinePartnerRequest, getMatchHistory, getUser, getIncomingRequests, PartnerRequest, MatchData } from '@/services/db';
import { formatDate, getGameDisplayName } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { UserPlus, Trophy, TrendingUp, TrendingDown, Minus, Check, X, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<PartnerRequest[]>([]);
  const [requestSenders, setRequestSenders] = useState<Record<string, any>>({});
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<Record<string, boolean>>({});
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadPartnerData = useCallback(async () => {
    if (!userData?.partnerUid) return;
    try {
      const data = await getUser(userData.partnerUid);
      setPartnerData(data);
    } catch (error) {
      console.error('Error loading partner data:', error);
    }
  }, [userData?.partnerUid]);

  const loadIncomingRequests = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoadingRequests(true);
      const requests = await getIncomingRequests(user.uid);
      setIncomingRequests(requests);
      
      // Load sender data for each request
      const senders: Record<string, any> = {};
      for (const request of requests) {
        const senderData = await getUser(request.fromUid);
        if (senderData) {
          senders[request.requestId] = senderData;
        }
      }
      setRequestSenders(senders);
    } catch (error) {
      console.error('Error loading incoming requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.uid]);

  const loadMatchHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const history = await getMatchHistory(user.uid);
      setMatchHistory(history.sort((a, b) => {
        const aTime = a.lastMoveAt?.toMillis() || 0;
        const bTime = b.lastMoveAt?.toMillis() || 0;
        return bTime - aTime;
      }));
    } catch (error) {
      console.error('Error loading match history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (userData?.partnerUid) {
      loadPartnerData();
    }
    loadIncomingRequests();
    loadMatchHistory();
  }, [userData?.partnerUid, user?.uid, loadPartnerData, loadIncomingRequests, loadMatchHistory]);

  const handleRequestPartner = async () => {
    if (!partnerEmail.trim()) {
      toast.error('Please enter a partner email');
      return;
    }

    if (userData?.partnerUid) {
      toast.error('You already have a partner. Please disconnect first.');
      return;
    }

    setLoading(true);
    try {
      await requestPartner(user!.uid, partnerEmail.trim());
      toast.success('Partner request sent! Waiting for approval...');
      setPartnerEmail('');
      // Reload requests
      await loadIncomingRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send partner request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(prev => ({ ...prev, [requestId]: true }));
    try {
      const request = incomingRequests.find(r => r.requestId === requestId);
      const requesterUid = request?.fromUid;
      
      await approvePartnerRequest(user!.uid, requestId);
      toast.success('Partner request approved!');
      
      // Update UI immediately - remove request and set partner
      setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId));
      const newSenders = { ...requestSenders };
      const senderData = newSenders[requestId];
      delete newSenders[requestId];
      setRequestSenders(newSenders);
      
      // Set partner data immediately if we have it
      if (senderData && requesterUid) {
        setPartnerData(senderData);
      }
      
      // Reload partner data to ensure it's up to date
      if (requesterUid) {
        try {
          const updatedPartner = await getUser(requesterUid);
          if (updatedPartner) {
            setPartnerData(updatedPartner);
          }
        } catch (error) {
          console.error('Error loading partner data:', error);
        }
      }
      
      // Reload requests to clear any other pending requests
      await loadIncomingRequests();
      
      // Small delay then reload to get updated userData from context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
      setProcessingRequest(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequest(prev => ({ ...prev, [requestId]: true }));
    try {
      await declinePartnerRequest(user!.uid, requestId);
      toast.success('Partner request declined');
      
      // Remove the declined request from UI immediately
      setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId));
      const newSenders = { ...requestSenders };
      delete newSenders[requestId];
      setRequestSenders(newSenders);
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline request');
      setProcessingRequest(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (!user || !userData) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Profile</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Info */}
            <Card>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Profile</h2>
              <div className="flex items-center space-x-4 mb-4">
                {userData.photoURL ? (
                  <Image
                    src={userData.photoURL}
                    alt={userData.displayName}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-semibold">
                    {userData.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{userData.displayName}</p>
                  <p className="text-sm text-slate-600">{userData.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-500">{userData.stats.wins}</div>
                  <div className="text-sm text-slate-600">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-600">{userData.stats.losses}</div>
                  <div className="text-sm text-slate-600">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-600">{userData.stats.draws}</div>
                  <div className="text-sm text-slate-600">Draws</div>
                </div>
              </div>
            </Card>

            {/* Partner Connection */}
            <Card>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Partner</h2>
              {userData.partnerUid && partnerData ? (
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    {partnerData.photoURL ? (
                      <Image
                        src={partnerData.photoURL}
                        alt={partnerData.displayName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-semibold">
                        {partnerData.displayName?.[0] || 'P'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{partnerData.displayName}</p>
                      <p className="text-sm text-slate-600">{partnerData.email}</p>
                    </div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-lg">
                    <p className="text-sm text-rose-700">
                      ✓ Connected with {partnerData.displayName}
                    </p>
                  </div>
                </div>
              ) : incomingRequests.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Partner Requests ({incomingRequests.length})
                  </p>
                  {loadingRequests ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto"></div>
                    </div>
                  ) : (
                    incomingRequests.map((request) => {
                      const senderData = requestSenders[request.requestId];
                      if (!senderData) return null;
                      
                      return (
                        <div key={request.requestId} className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                          <div className="flex items-center space-x-3 mb-4">
                            {senderData.photoURL ? (
                              <Image
                                src={senderData.photoURL}
                                alt={senderData.displayName}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {senderData.displayName?.[0] || 'U'}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{senderData.displayName}</p>
                              <p className="text-sm text-slate-600">{senderData.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              onClick={() => handleApproveRequest(request.requestId)}
                              disabled={processingRequest[request.requestId]}
                              className="flex-1"
                            >
                              {processingRequest[request.requestId] ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2 inline" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.requestId)}
                              disabled={processingRequest[request.requestId]}
                              className="flex-1"
                            >
                              {processingRequest[request.requestId] ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                                  Declining...
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-2 inline" />
                                  Decline
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-slate-600 mb-4">
                    Send a partner request to start playing games together.
                  </p>
                  <Input
                    type="email"
                    placeholder="Partner's email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="mb-4"
                    disabled={incomingRequests.length > 0}
                  />
                  {incomingRequests.length > 0 && (
                    <p className="text-sm text-amber-600 mb-4">
                      You have pending partner requests. Please respond to them first.
                    </p>
                  )}
                  <Button
                    variant="primary"
                    onClick={handleRequestPartner}
                    disabled={loading || incomingRequests.length > 0 || !!userData?.partnerUid}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2 inline" />
                        Send Partner Request
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Match History */}
          <Card>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Match History</h2>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
              </div>
            ) : matchHistory.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No matches yet. Start playing to see your history!</p>
            ) : (
              <div className="space-y-3">
                {matchHistory.map((match) => {
                  const isWinner = match.winnerUid === user.uid;
                  const isDraw = match.winnerUid === null;
                  return (
                    <div
                      key={match.matchId}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {getGameDisplayName(match.gameType)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {formatDate(match.lastMoveAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isDraw ? (
                          <>
                            <Minus className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-600">Draw</span>
                          </>
                        ) : isWinner ? (
                          <>
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 font-semibold">Win</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <span className="text-red-600 font-semibold">Loss</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
