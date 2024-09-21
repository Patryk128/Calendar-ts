import Calendar from "../Calendar";
import { useRef } from "react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig.js";
import "./Modal.css";

// Notification component for reminders
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
    // Automatyczne zamknięcie powiadomienia po 5 sekundach
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer); // Sprzątanie timera, gdy komponent zostanie odmontowany
  }, [id, onClose]);

  return (
    <div
      className="notification"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "#444",
        color: "#fff",
        padding: "10px",
        borderRadius: "5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "250px",
        marginBottom: "10px",
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        style={{
          backgroundColor: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "16px",
          cursor: "pointer",
          marginLeft: "10px",
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default function ReactCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#FF0000");
  const [startTime, setStartTime] = useState<string>("12:00");
  const [endTime, setEndTime] = useState<string>("13:00");
  const [notificationsQueue, setNotificationsQueue] = useState<
    { id: string; message: string }[]
  >([]);
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const notificationInProgress = useRef(false);

  // State for reminders
  const [isReminder, setIsReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(1);
  const [notifications, setNotifications] = useState<
    { id: string; message: string }[]
  >([]);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const fetchedEvents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setTitle("");
    setEditEventId(null);
    setError(null);
    setStartDate(start);
    setEndDate(start);
    setStartTime("12:00");
    setEndTime("13:00");
    setIsModalOpen(true);
    setIsReminder(false); // Reset reminder checkbox
    setReminderDays(1); // Reset reminder days input
  };

  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setStartTime("12:00");
    setEndTime("13:00");
    setTitle("");
    setColor("#FF0000");
    setError(null);
    setIsModalOpen(false);
    setEditEventId(null);
    setIsReminder(false);
    setReminderDays(1);
  };

  const combineDateAndTime = (date: Date | null, time: string): Date | null => {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate;
  };
  const addNotification = (message: string) => {
    const newNotification = {
      id: `${Date.now()}`,
      message,
    };
    setNotificationsQueue((prevQueue) => [...prevQueue, newNotification]);
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
          addNotification("Event updated successfully!");
        } else {
          await addDoc(collection(db, "events"), newEvent);
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
      setIsModalOpen(false);
      addNotification("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleEventClick = (event: any) => {
    const startDate = event.start.seconds
      ? new Date(event.start.seconds * 1000)
      : new Date(event.start);

    const endDate = event.end?.seconds
      ? new Date(event.end.seconds * 1000)
      : null;

    setTitle(event.title);
    setStartDate(startDate);
    setEndDate(endDate || startDate);
    setEditEventId(event.id);
    setIsModalOpen(true);
    setIsReminder(event.isReminder || false);
    setReminderDays(event.reminderDays || 1);
  };

  // Check if any reminder is due (run on every render)
  useEffect(() => {
    const today = new Date();

    // Sortowanie wydarzeń w kolejności od najbliższych do najdalszych
    const sortedEvents = [...events].sort((a, b) => {
      const eventAStartDate = new Date(a.start.seconds * 1000);
      const eventBStartDate = new Date(b.start.seconds * 1000);
      return eventAStartDate.getTime() - eventBStartDate.getTime();
    });

    const newNotifications = [];

    sortedEvents.forEach((event) => {
      if (event.isReminder) {
        const eventStartDate = new Date(event.start.seconds * 1000);
        const reminderDate = new Date(eventStartDate);
        reminderDate.setDate(reminderDate.getDate() - event.reminderDays);

        // Sprawdzamy, czy przypomnienie powinno się było już pojawić
        if (reminderDate <= today && eventStartDate >= today) {
          const daysUntilEvent = Math.ceil(
            (eventStartDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
          );
          newNotifications.push({
            id: `${event.id}-${Date.now()}`, // Unikalny ID dla każdego powiadomienia
            message: `Reminder: ${event.title} is coming up in ${daysUntilEvent} days!`,
          });
        }
      }
    });

    // Dodaj nowe powiadomienia do kolejki
    setNotificationsQueue((prevQueue) => [...prevQueue, ...newNotifications]);
  }, [events]);

  useEffect(() => {
    if (!notificationInProgress.current && notificationsQueue.length > 0) {
      const nextNotification = notificationsQueue[0];
      setActiveNotification(nextNotification);
      notificationInProgress.current = true; // Blokujemy kolejne powiadomienia do czasu zamknięcia bieżącego
    }
  }, [notificationsQueue]);

  // Funkcja do zamykania powiadomienia
  const closeNotification = (id: string) => {
    setActiveNotification(null); // Usuwamy aktywne powiadomienie
    setNotificationsQueue((prevQueue) =>
      prevQueue.filter((notification) => notification.id !== id)
    );
    notificationInProgress.current = false; // Odblokowujemy kolejne powiadomienia
  };

  return (
    <div>
      <div style={{ height: "80vh" }}>
        <Calendar
          events={events.map((event) => ({
            ...event,
            start: new Date(event.start.seconds * 1000),
            end: new Date(event.end.seconds * 1000),
            color: event.color || "#FF0000",
          }))}
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color },
          })}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventClick}
        />
      </div>

      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editEventId ? "Edit Event" : "Add New Event"}</h3>
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {error && <p style={{ color: "red" }}>{error}</p>}

            <label>Start Date:</label>
            <DatePicker
              selected={startDate || new Date()}
              onChange={(date) => setStartDate(date)}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select start date"
            />
            <label>Start Time (24h format):</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />

            <label>End Date:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select end date"
            />
            <label>End Time (24h format):</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />

            <label>Color:</label>
            <div className="color-picker">
              {[
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#FFA500",
                "#800080",
              ].map((c) => (
                <button
                  key={c}
                  style={{
                    backgroundColor: c,
                    width: "30px",
                    height: "30px",
                    border: c === color ? "3px solid black" : "none",
                    cursor: "pointer",
                    margin: "0 5px",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            {/* Reminder Checkbox and Days Input */}
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isReminder}
                  onChange={() => setIsReminder(!isReminder)}
                />
                Set Reminder
              </label>
              {isReminder && (
                <div>
                  <label>Reminder Days Before:</label>
                  <input
                    type="number"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button onClick={handleSave}>
                {editEventId ? "Update" : "Save"}
              </button>
              {editEventId && (
                <button
                  onClick={() => handleDeleteEvent(editEventId!)}
                  style={{ backgroundColor: "red", color: "white" }}
                >
                  Delete
                </button>
              )}
              <button onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Wyświetl aktywne powiadomienie */}
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
