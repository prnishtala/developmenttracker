import webpush, { PushSubscription } from 'web-push';

type PushEnv = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function getPushEnv(): PushEnv | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export function getPublicVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export function isPushConfigured(): boolean {
  return getPushEnv() !== null;
}

export function configureWebPush(): boolean {
  const env = getPushEnv();
  if (!env) return false;

  webpush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
  return true;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/'
    })
  );
}
