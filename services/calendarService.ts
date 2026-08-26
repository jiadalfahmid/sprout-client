import { getAccessToken, googleSignIn } from './googleAuth';
import { Appointment, CalendarEvent, FamilyMember, Bill, Task, Medicine } from '../types';

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'popup' | 'email'; minutes: number }>;
  };
  colorId?: string;
}

/**
 * Ensure valid Google OAuth access token is available.
 */
async function ensureAccessToken(): Promise<string | null> {
  const token = await getAccessToken();
  return token;
}

/**
 * Fetch events from the user's primary Google Calendar.
 */
export const fetchGoogleCalendarEvents = async (
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> => {
  try {
    const token = await ensureAccessToken();
    if (!token) {
      // User is not signed in with Google OAuth yet - return empty array safely without error
      return [];
    }

    const start = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

    const params = new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('Google Calendar authorization expired or scope required.');
        return [];
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to fetch Google Calendar events (${response.status})`);
    }

    const data = await response.json();
    const items = data.items || [];

    const mappedEvents: CalendarEvent[] = items.map((item: any) => {
      const startDateTimeStr = item.start?.dateTime || item.start?.date;
      const endDateTimeStr = item.end?.dateTime || item.end?.date;
      const eventDate = startDateTimeStr ? new Date(startDateTimeStr) : new Date();
      const endDate = endDateTimeStr ? new Date(endDateTimeStr) : undefined;

      return {
        id: `gcal-${item.id}`,
        date: eventDate,
        endDate: endDate,
        title: item.summary || '(No title)',
        type: 'google_event' as const,
        status: 'google_sync' as const,
        isGoogleCalendarEvent: true,
        googleEventId: item.id,
        location: item.location || '',
        details: {
          description: item.description || '',
          htmlLink: item.htmlLink,
          creator: item.creator?.email,
          attendees: item.attendees?.map((a: any) => a.email) || [],
        },
      };
    });

    return mappedEvents;
  } catch (error: any) {
    console.warn('Notice in fetchGoogleCalendarEvents:', error.message || error);
    return [];
  }
};

/**
 * Create or sync a Sprout Appointment into Google Calendar.
 */
export const syncAppointmentToGoogleCalendar = async (
  appointment: Appointment,
  member?: FamilyMember
): Promise<{ success: boolean; googleEventId?: string; error?: string }> => {
  try {
    const token = await ensureAccessToken();
    if (!token) {
      return { 
        success: false, 
        error: 'Google account is not connected. Please connect with Google in Settings or Calendar.' 
      };
    }

    const startDate = new Date(appointment.dateTime);
    // End time is 1 hour after start by default
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const memberName = member ? member.name : 'Family Member';
    const summary = `🩺 Doctor Appointment: ${appointment.doctorName} for ${memberName}`;
    const description = [
      `Sprout Family Care - Medical Appointment`,
      `Patient: ${memberName}`,
      `Doctor: ${appointment.doctorName} ${appointment.specialization ? `(${appointment.specialization})` : ''}`,
      `Clinic / Hospital: ${appointment.clinicName}`,
      `Purpose: ${appointment.purpose}`,
      `Status: ${appointment.status}`,
    ].join('\n');

    const payload: GoogleCalendarEventPayload = {
      summary,
      description,
      location: appointment.clinicName,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 1440 }, // 1 day before
          { method: 'email', minutes: 1440 }, // 1 day before email
        ],
      },
      colorId: '11', // Bold red / flamingo for health/medical
    };

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    let method = 'POST';

    // If already has googleEventId, update existing
    if (appointment.googleEventId) {
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleEventId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // If updating failed because event was deleted from Google Calendar, try creating new
      if (response.status === 404 && method === 'PUT') {
        const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          return { success: true, googleEventId: created.id };
        }
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Calendar API error (${response.status})`);
    }

    const data = await response.json();
    return { success: true, googleEventId: data.id };
  } catch (error: any) {
    console.error('Failed to sync appointment to Google Calendar:', error);
    return { success: false, error: error.message || 'Sync failed' };
  }
};

/**
 * Sync a bill reminder to Google Calendar.
 */
export const syncBillToGoogleCalendar = async (
  bill: Bill,
  currencySymbol: string = '$'
): Promise<{ success: boolean; googleEventId?: string; error?: string }> => {
  try {
    const token = await ensureAccessToken();
    if (!token) {
      return { 
        success: false, 
        error: 'Google account is not connected. Please connect with Google in Settings or Calendar.' 
      };
    }
    const dueDate = new Date(bill.dueDate);
    const endDate = new Date(dueDate.getTime() + 30 * 60 * 1000);

    const payload: GoogleCalendarEventPayload = {
      summary: `💳 Bill Due: ${bill.name} (${currencySymbol}${bill.amount.toFixed(2)})`,
      description: `Sprout Family Finance\nCategory: ${bill.category}\nAmount: ${currencySymbol}${bill.amount.toFixed(2)}\nStatus: ${bill.paid ? 'Paid' : 'Unpaid'}\nRecurrence: ${bill.recurrence}`,
      start: { dateTime: dueDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 }, // 1 day before
          { method: 'popup', minutes: 120 }, // 2 hours before
        ],
      },
      colorId: '5', // Banana / Yellow for bills
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Calendar error (${response.status})`);
    }

    const data = await response.json();
    return { success: true, googleEventId: data.id };
  } catch (error: any) {
    console.error('Failed to sync bill to Google Calendar:', error);
    return { success: false, error: error.message || 'Sync failed' };
  }
};

/**
 * Delete an event from Google Calendar with proper error handling.
 */
export const deleteGoogleCalendarEvent = async (googleEventId: string): Promise<boolean> => {
  try {
    const token = await ensureAccessToken();
    if (!token) return false;
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 204 No Content is success, 404/410 means already deleted
    return response.ok || response.status === 404 || response.status === 410;
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return false;
  }
};
