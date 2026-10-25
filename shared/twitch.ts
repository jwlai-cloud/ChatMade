export type TwitchView = {
  status: 'unconfigured' | 'disconnected' | 'authorizing' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  channel: string | null;
  message: string;
  accepted: number;
  rejected: number;
  authorization?: { userCode: string; verificationUri: string; expiresAt: number };
};
