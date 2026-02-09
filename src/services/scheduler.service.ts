import cron from 'node-cron';
import { sendPreMatchNotifications } from './notification.service.firebase';

let schedulerStarted = false;
let schedulerTask: cron.ScheduledTask | null = null;

export function startNotificationScheduler(): void {
  if (schedulerStarted) {
    console.log('⚠️ Notification scheduler already started');
    return;
  }

  // Run every minute to check for matches starting in 15 minutes
  schedulerTask = cron.schedule('* * * * *', async () => {
    console.log('⏰ Running pre-match notification check...');
    try {
      await sendPreMatchNotifications();
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  });

  schedulerStarted = true;
  console.log('✅ Notification scheduler started - checking every minute');
}

export function stopNotificationScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }
  schedulerStarted = false;
  console.log('🛑 Notification scheduler stopped');
}
