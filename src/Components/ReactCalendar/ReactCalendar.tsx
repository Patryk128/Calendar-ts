import { useState, useEffect, useRef } from "react";
import { getAuth, signOut, User } from "firebase/auth";
import Calendar from "./Calendar.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../Authentication/firebaseConfig.js";
import Modal from "./Modal.js";
import "./styles/Modal.css";
import Holidays from "date-holidays";
import "./styles/calendar.css";

interface Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  isReminder?: boolean;
  reminderDays?: number;
}

interface Notification {
  id: string;
  message: string;
}

export default function ReactCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [color, setColor] = useState("#FF0000");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [isReminder, setIsReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("PL");
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [notificationsQueue, setNotificationsQueue] = useState<Notification[]>(
    []
  );
  const [activeNotification, setActiveNotification] =
    useState<Notification | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();
  const notificationInProgress = useRef(false);

  const fetchHolidays = (countryCode: string) => {
    const hd = new Holidays(countryCode);
    const currentYear = new Date().getFullYear();
    const allHolidays = [];

    for (let year = currentYear; year <= currentYear + 1; year++) {
      const holidays = hd.getHolidays(year);
      allHolidays.push(
        ...holidays.map((holiday) => ({
          title: holiday.name,
          start: new Date(holiday.date),
          end: new Date(holiday.date),
          color: "#00FF00",
        }))
      );
    }

    return allHolidays;
  };

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "events"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: new Date(data.start.seconds * 1000),
          end: new Date(data.end.seconds * 1000),
          color: data.color || "#FF0000",
          isReminder: data.isReminder || false,
          reminderDays: data.reminderDays || 1,
        };
      });

      const holidayEvents = fetchHolidays(selectedCountry);
      setEvents([...fetchedEvents, ...holidayEvents]);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && !loading) {
      fetchEvents();
    }
  }, [user, loading, selectedCountry]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setEvents([]);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCountry]);

  const resetForm = () => {
    setIsModalOpen(false);
    setTitle("");
    setStartDate(null);
    setEndDate(null);
    setColor("#FF0000");
    setStartTime("12:00");
    setEndTime("13:00");
    setIsReminder(false);
    setReminderDays(1);
    setError(null);
    setEditEventId(null);
  };

  const combineDateAndTime = (date: Date | null, time: string): Date | null => {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const combinedStartDate = combineDateAndTime(startDate, startTime);
    const combinedEndDate = combineDateAndTime(endDate, endTime);

    // Sprawdzamy, czy daty są poprawnie połączone i czy start jest przed end
    if (
      combinedStartDate &&
      combinedEndDate &&
      combinedStartDate <= combinedEndDate
    ) {
      // Sprawdzenie, czy `user` istnieje
      if (!user) {
        console.error("User is null. Cannot create an event without userId.");
        setError("Unable to create event. User information is missing.");
        return;
      }

      const newEvent = {
        title,
        start: combinedStartDate,
        end: combinedEndDate,
        color,
        isReminder,
        reminderDays,
        userId: user.uid,
      };

      try {
        if (editEventId) {
          const eventRef = doc(db, "events", editEventId);
          await updateDoc(eventRef, newEvent);
          console.log("Event updated successfully!");
          addNotification("Event updated successfully!");
        } else {
          await addDoc(collection(db, "events"), newEvent);
          console.log("Event added successfully!");
          addNotification("Event added successfully!");
        }

        fetchEvents();
        resetForm();
      } catch (error) {
        console.error("Error saving event: ", error);
        setError("Failed to save the event. Please try again.");
      }
    } else {
      setError("Start date/time must be before end date/time.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
      fetchEvents();
      resetForm();
      console.log("Event deleted successfully!");
      addNotification("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  useEffect(() => {
    const checkForUpcomingEvents = () => {
      const now = new Date();

      events.forEach((event) => {
        if (event.isReminder) {
          const eventStartDate = new Date(event.start);
          const reminderDays = event.reminderDays ?? 0;
          const reminderDate = new Date(eventStartDate);
          reminderDate.setDate(reminderDate.getDate() - reminderDays);

          if (reminderDate <= now && now < eventStartDate) {
            const daysUntilEvent = Math.ceil(
              (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            addNotificationToQueue(
              `Reminder: Event "${event.title}" is in ${daysUntilEvent} days!`
            );
          }
        }
      });
    };

    checkForUpcomingEvents();
  }, [events]);

  const addNotificationToQueue = (message: string) => {
    const newNotification = {
      id: `${Date.now()}`,
      message,
    };
    setNotificationsQueue((prevQueue) => [...prevQueue, newNotification]);
  };

  useEffect(() => {
    if (!notificationInProgress.current && notificationsQueue.length > 0) {
      const nextNotification = notificationsQueue[0];
      setActiveNotification(nextNotification);
      notificationInProgress.current = true;
    }
  }, [notificationsQueue]);

  const closeNotification = (id: string) => {
    setActiveNotification(null);
    setNotificationsQueue((prevQueue) =>
      prevQueue.filter((notification) => notification.id !== id)
    );
    notificationInProgress.current = false;

    if (notificationsQueue.length > 1) {
      const nextNotification = notificationsQueue[1];
      setActiveNotification(nextNotification);
      notificationInProgress.current = true;
    }
  };

  const addNotification = (message: string) => {
    const newNotification = {
      id: `${Date.now()}`,
      message,
    };
    console.log("Adding notification:", newNotification.message);
    setNotificationsQueue((prevQueue) => [...prevQueue, newNotification]);
  };

  function Notification({
    message,
    id,
    onClose,
  }: {
    message: string;
    id: string;
    onClose: (id: string) => void;
  }) {
    useEffect(() => {
      const timer = setTimeout(() => onClose(id), 2000);
      return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
      <div className="reminder-notification">
        <span>{message}</span>
        <button onClick={() => onClose(id)}>&times;</button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="header-controls">
        <div className="country-select-container">
          <label htmlFor="holiday-country">Select Holiday Country: </label>
          <select
            id="holiday-country"
            className="country-select"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="PL">Poland</option>
            <option value="US">USA</option>
            <option value="GB">UK</option>
          </select>
        </div>
        <button className="sign-out-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div style={{ height: "100vh" }}>
        <Calendar
          events={events.map((event) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            title: event.title,
            color: event.color,
          }))}
          onSelectEvent={(event: Event) => {
            setTitle(event.title);
            setStartDate(new Date(event.start));
            setEndDate(new Date(event.end));
            setEditEventId(event.id || "");
            setIsModalOpen(true);
            setIsReminder(event.isReminder || false);
            setReminderDays(event.reminderDays || 1);
          }}
          onSelectSlot={({ start, end }) => {
            setSelectedSlot({ start, end });
            setTitle("");
            setEditEventId(null);
            setError(null);
            setStartDate(start);
            setEndDate(end);
            setStartTime("12:00");
            setEndTime("13:00");
            setIsModalOpen(true);
            setIsReminder(false);
            setReminderDays(1);
          }}
          selectable
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color },
          })}
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        title={title}
        startDate={startDate}
        endDate={endDate}
        startTime={startTime}
        endTime={endTime}
        color={color}
        isReminder={isReminder}
        reminderDays={reminderDays}
        error={error}
        setTitle={setTitle}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
        setColor={setColor}
        setIsReminder={setIsReminder}
        setReminderDays={setReminderDays}
        handleSave={handleSave}
        resetForm={resetForm}
        editEventId={editEventId}
        handleDeleteEvent={() => handleDeleteEvent(editEventId!)}
      />
      {activeNotification && (
        <Notification
          key={activeNotification.id}
          id={activeNotification.id}
          message={activeNotification.message}
          onClose={closeNotification}
        />
      )}
    </div>
  );
}
