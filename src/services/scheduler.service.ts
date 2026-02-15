import cron from 'node-cron';
import { sendPreMatchNotifications, sendLiveMatchUpdates } from './notification.service.firebase';

let schedulerStarted = false;
let preMatchTask: cron.ScheduledTask | null = null;
let liveUpdateTask: cron.ScheduledTask | null = null;

export function startNotificationScheduler(): void {
  if (schedulerStarted) {
    console.log('⚠️ Notification scheduler already started');
    return;
  }

  // Run every minute to check for matches starting in 15 minutes
  preMatchTask = cron.schedule('* * * * *', async () => {
    console.log('⏰ Running pre-match notification check...');
    try {
      await sendPreMatchNotifications();
    } catch (error) {
      console.error('Error in pre-match scheduler:', error);
    }
  });

  // Run every 2 minutes to send live match updates (persistent notification refresh)
  liveUpdateTask = cron.schedule('*/2 * * * *', async () => {
    try {
      await sendLiveMatchUpdates();
    } catch (error) {
      console.error('Error in live update scheduler:', error);
    }
  });

  schedulerStarted = true;
  console.log('✅ Notification scheduler started - pre-match every 1min, live updates every 2min');
}

export function stopNotificationScheduler(): void {
  if (preMatchTask) {
    preMatchTask.stop();
    preMatchTask = null;
  }
  if (liveUpdateTask) {
    liveUpdateTask.stop();
    liveUpdateTask = null;
  }
  schedulerStarted = false;
  console.log('🛑 Notification scheduler stopped');
}
