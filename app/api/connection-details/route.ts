import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

const API_KEY = process.env.LIVEKIT_API_KEY as string;
const API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_URL = process.env.LIVEKIT_URL as string;

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      throw new Error('Missing LIVEKIT_URL / API Key / API Secret');
    }

    const roomName = 'friday-agent-session';
    const participantIdentity = `user_${Math.floor(Math.random() * 10000)}`;

    const token = await createToken(participantIdentity, roomName);

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName: participantIdentity,
      participantToken: token,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

async function createToken(identity: string, roomName: string): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity,
    name: identity,
    ttl: '15m',
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };
  at.addGrant(grant);

  at.roomConfig = new RoomConfiguration({
    agents: [{ agentName: 'friday-agent' }],
  });

  return await at.toJwt();
}
