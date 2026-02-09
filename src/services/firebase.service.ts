import admin from 'firebase-admin';

// تهيئة Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'apppp-3ce5b',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'apppp-3ce5b.appspot.com',
  });
}

export interface FCMNotification {
  token: string;
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

export interface FCMMulticastNotification {
  tokens: string[];
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

/**
 * إرسال إشعار لجهاز واحد
 */
export async function sendFCMNotification(notification: FCMNotification): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      token: notification.token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'match-notifications',
          priority: 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending FCM notification:', error);
    
    // إذا كان Token غير صالح، نعيد false
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.log('⚠️ Invalid or unregistered token');
      return false;
    }
    
    throw error;
  }
}

/**
 * إرسال إشعار لعدة أجهزة
 */
export async function sendFCMMulticastNotification(
  notification: FCMMulticastNotification
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  try {
    if (notification.tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: notification.tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'match-notifications',
          priority: 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // جمع Tokens غير الصالحة
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (error?.code === 'messaging/invalid-registration-token' ||
            error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(notification.tokens[idx]);
        }
      }
    });

    console.log(`✅ FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
    if (invalidTokens.length > 0) {
      console.log(`⚠️ Invalid tokens: ${invalidTokens.length}`);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('❌ Error sending FCM multicast notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار صامت (Data-only message)
 */
export async function sendFCMDataMessage(
  token: string,
  data: { [key: string]: string }
): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      token,
      data,
      android: {
        priority: 'high',
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM data message sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending FCM data message:', error);
    
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      return false;
    }
    
    throw error;
  }
}

/**
 * رفع صورة إلى Firebase Storage والحصول على رابط عام
 */
export async function uploadImageToStorage(
  localFilePath: string,
  destinationPath: string
): Promise<string | null> {
  try {
    const bucket = admin.storage().bucket();
    await bucket.upload(localFilePath, {
      destination: destinationPath,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });

    const file = bucket.file(destinationPath);
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
    console.log('✅ Image uploaded to Firebase Storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to Firebase Storage:', error);
    return null;
  }
}

export default {
  sendFCMNotification,
  sendFCMMulticastNotification,
  sendFCMDataMessage,
  uploadImageToStorage,
};
