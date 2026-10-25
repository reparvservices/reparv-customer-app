import notifee, {AndroidImportance} from '@notifee/react-native';

export async function displayNotification(remoteMessage) {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title:
      remoteMessage?.notification?.title ||
      remoteMessage?.data?.title ||
      'Notification',
    body: remoteMessage?.notification?.body || remoteMessage?.data?.body || '',
    android: {
      channelId: 'default',
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_launcher',
    },
  });
}
