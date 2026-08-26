import type { Notification as AppNotification, Medicine, Bill, Appointment, Task, FamilyMember, NotificationSettings } from '../types';

export const defaultNotificationSettings: NotificationSettings = {
  browserPushEnabled: false,
  medicineReminders: true,
  billDueAlerts: true,
  appointmentReminders: true,
  taskAlerts: true,
  lowStockAlerts: true,
  soundEnabled: true,
};

/**
 * Request permission for native HTML5 Browser Notifications
 */
export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'denied';
  }
  
  if (window.Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (window.Notification.permission !== 'denied') {
    const permission = await window.Notification.requestPermission();
    return permission;
  }
  
  return window.Notification.permission;
};

/**
 * Send a native browser notification
 */
export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (window.Notification.permission === 'granted') {
    try {
      const notification = new window.Notification(title, {
        icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        silent: false,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error('Error dispatching browser notification:', e);
    }
  }
};

/**
 * Play a gentle alert chime using Web Audio API
 */
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (error) {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
};

/**
 * Intelligent Alert Engine
 * Evaluates medicine schedules, low stock thresholds, overdue or upcoming bills, and doctor appointments.
 */
export const generateSystemAlerts = ({
  medicines,
  bills,
  appointments,
  tasks,
  familyMembers,
  settings,
}: {
  medicines: Medicine[];
  bills: Bill[];
  appointments: Appointment[];
  tasks: Task[];
  familyMembers: FamilyMember[];
  settings: NotificationSettings;
}): AppNotification[] => {
  const alerts: AppNotification[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Low Medicine Stock Alerts
  if (settings.lowStockAlerts) {
    medicines.forEach((med) => {
      const threshold = med.doseQuantity ? med.doseQuantity * 5 : 5;
      if (med.stock <= threshold) {
        alerts.push({
          id: `alert-stock-${med.id}`,
          message: `⚠️ Low Stock: Only ${med.stock} pieces left for ${med.name}. Restock soon!`,
          type: 'warning',
          domain: 'health',
          path: '/restock',
          read: false,
          createdAt: now.toISOString(),
        });
      }
    });
  }

  // 2. Medicine Dose Reminders for Today
  if (settings.medicineReminders) {
    const referenceDate = new Date(2024, 0, 1);
    const daysDiff = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));

    medicines.forEach((med) => {
      const isScheduledToday =
        med.schedule.type === 'daily' ||
        (med.schedule.type === 'alternate_days' && daysDiff % 2 === 0);

      if (isScheduledToday && med.times && med.times.length > 0) {
        const member = familyMembers.find((m) => m.id === med.memberId);
        med.times.forEach((timeStr) => {
          const [hourStr, minuteStr] = timeStr.split(':');
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minuteStr, 10);

          // Check if dose was logged for this time today
          const takenToday = med.history?.some((h) => {
            const hDate = new Date(h.timestamp);
            return (
              hDate.toDateString() === today.toDateString() &&
              hDate.getHours() === hour &&
              h.status === 'taken'
            );
          });

          if (!takenToday) {
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            const isDueNow =
              currentHour === hour && Math.abs(currentMin - minute) <= 45;
            const isPastDue =
              currentHour > hour || (currentHour === hour && currentMin > minute + 45);

            if (isDueNow) {
              alerts.push({
                id: `alert-dose-due-${med.id}-${timeStr}`,
                message: `💊 Time for ${med.name} (${med.doseQuantity} ${med.unit || 'unit'}) for ${member?.name || 'you'}.`,
                type: 'warning',
                domain: 'health',
                path: '/settings/medicines',
                read: false,
                createdAt: now.toISOString(),
              });
            } else if (isPastDue) {
              alerts.push({
                id: `alert-dose-missed-${med.id}-${timeStr}`,
                message: `⏰ Scheduled dose of ${med.name} at ${timeStr} was not logged today.`,
                type: 'info',
                domain: 'health',
                path: '/settings/medicines',
                read: false,
                createdAt: now.toISOString(),
              });
            }
          }
        });
      }
    });
  }

  // 3. Bill Due Date Alerts (Due Today, Tomorrow, or Overdue)
  if (settings.billDueAlerts) {
    bills.forEach((bill) => {
      if (!bill.paid) {
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `alert-bill-overdue-${bill.id}`,
            message: `🚨 Overdue Bill: ${bill.name} ($${bill.amount}) was due on ${dueDate.toLocaleDateString()}.`,
            type: 'warning',
            domain: 'finance',
            path: '/finance',
            read: false,
            createdAt: now.toISOString(),
          });
        } else if (diffDays === 0) {
          alerts.push({
            id: `alert-bill-today-${bill.id}`,
            message: `💳 Bill Due Today: ${bill.name} ($${bill.amount}) is due today!`,
            type: 'warning',
            domain: 'finance',
            path: '/finance',
            read: false,
            createdAt: now.toISOString(),
          });
        } else if (diffDays <= 3) {
          alerts.push({
            id: `alert-bill-upcoming-${bill.id}`,
            message: `🗓️ Upcoming Bill: ${bill.name} ($${bill.amount}) is due in ${diffDays} days.`,
            type: 'info',
            domain: 'finance',
            path: '/finance',
            read: false,
            createdAt: now.toISOString(),
          });
        }
      }
    });
  }

  // 4. Upcoming Doctor Appointments (Within 48 hours)
  if (settings.appointmentReminders) {
    appointments.forEach((appt) => {
      if (appt.status === 'upcoming') {
        const apptDate = new Date(appt.dateTime);
        const diffTime = apptDate.getTime() - now.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);

        if (diffHours >= 0 && diffHours <= 48) {
          const member = familyMembers.find((m) => m.id === appt.memberId);
          const hoursText =
            diffHours <= 2
              ? 'in less than 2 hours'
              : diffHours <= 24
              ? 'within 24 hours'
              : 'tomorrow';

          alerts.push({
            id: `alert-appt-${appt.id}`,
            message: `🩺 Doctor Appointment: ${member?.name || 'Family member'} has an appointment with ${appt.doctorName} at ${appt.clinicName} ${hoursText}.`,
            type: 'info',
            domain: 'health',
            path: '/settings/appointments',
            read: false,
            createdAt: now.toISOString(),
          });
        }
      }
    });
  }

  return alerts;
};
