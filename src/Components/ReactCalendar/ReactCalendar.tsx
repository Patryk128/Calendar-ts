import React, { useState, useEffect, useRef } from "react";
import Calendar from "../Calendar"; // Assuming you have this imported correctly
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig.js"; // Firebase config import
import Modal from "./Modal"; // Import the Modal component
import "./Modal.css";
import Holidays from "date-holidays"; // Importing the library

export default function ReactCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [color, setColor] = useState("#FF0000");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [isReminder, setIsReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("PL"); // Default to Poland
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [notificationsQueue, setNotificationsQueue] = useState<
    { id: string; message: string }[]
  >([]);

  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const notificationInProgress = useRef(false);

  const fetchHolidays = (countryCode: string) => {
    const hd = new Holidays(countryCode); // Set the country code dynamically
    const currentYear = new Date().getFullYear();
    const holidays = hd.getHolidays(currentYear);

    // Convert holidays to a format suitable for the calendar
    const holidayEvents = holidays.map((holiday) => ({
      title: holiday.name,
      start: new Date(holiday.date),
      end: new Date(holiday.date),
      color: "#00FF00", // Set color for holidays
    }));

    return holidayEvents;
  };

  // Fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
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
      const holidayEvents = fetchHolidays(selectedCountry); // Fetch holidays based on selected country
      setEvents([...fetchedEvents, ...holidayEvents]); // Add holidays to events
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  // Fetch events and holidays when the component mounts and when the country changes
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

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value); // Update selected country
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

    if (
      combinedStartDate &&
      combinedEndDate &&
      combinedStartDate <= combinedEndDate
    ) {
      const newEvent = {
        title,
        start: combinedStartDate,
        end: combinedEndDate,
        color,
        isReminder,
        reminderDays,
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

  const handleEventClick = (event: any) => {
    console.log("Clicked event:", event); // Log event clicks for debugging
    setTitle(event.title);
    setStartDate(new Date(event.start)); // Convert start to Date
    setEndDate(new Date(event.end)); // Convert end to Date
    setEditEventId(event.id);
    setIsModalOpen(true); // Open modal
    setIsReminder(event.isReminder || false);
    setReminderDays(event.reminderDays || 1);
  };

  useEffect(() => {
    const checkForUpcomingEvents = () => {
      const now = new Date();

      events.forEach((event) => {
        if (event.isReminder) {
          const eventStartDate = new Date(event.start);
          const reminderDate = new Date(eventStartDate);
          reminderDate.setDate(reminderDate.getDate() - event.reminderDays);

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

    // Run reminder checking on app start
    checkForUpcomingEvents();
  }, [events]); // Runs again when `events` is fetched

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

    // Check if there's more notifications in the queue after closing the current one
    if (notificationsQueue.length > 1) {
      const nextNotification = notificationsQueue[1]; // Get the next notification
      setActiveNotification(nextNotification);
      notificationInProgress.current = true; // Set flag to avoid simultaneous display
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setTitle("");
    setEditEventId(null);
    setError(null);
    setStartDate(start);
    setEndDate(end);
    setStartTime("12:00");
    setEndTime("13:00");
    setIsModalOpen(true); // Open modal
    setIsReminder(false); // Reset reminder
    setReminderDays(1); // Reset reminder days
  };

  const addNotification = (message: string) => {
    const newNotification = {
      id: `${Date.now()}`,
      message,
    };
    console.log("Adding notification:", newNotification.message); // Check if notification is triggered
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
      // Auto-close notification after 5 seconds
      const timer = setTimeout(() => onClose(id), 2000);
      return () => clearTimeout(timer); // Cleanup timer
    }, [id, onClose]);

    return (
      <div className="notification">
        <span>{message}</span>
        <button onClick={() => onClose(id)}>&times;</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="holiday-country">Select Holiday Country: </label>
        <select
          id="holiday-country"
          value={selectedCountry}
          onChange={handleCountryChange}
        >
          <option value="PL">Poland</option>
          <option value="US">USA</option>
          <option value="GB">UK</option>
        </select>
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
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
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
