import webPush from 'web-push'

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL!}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export function sendPushNotification(
  subscriptionJson: string,
  payload: { title: string; body: string }
) {
  const subscription = JSON.parse(subscriptionJson) as webPush.PushSubscription
  return webPush.sendNotification(subscription, JSON.stringify(payload))
}

export { webPush }
