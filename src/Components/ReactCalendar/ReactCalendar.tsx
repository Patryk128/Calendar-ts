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

  // Fetch events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const fetchedEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: new Date(data.start.seconds * 1000), // Zamiana Firebase Timestamp na Date
          end: new Date(data.end.seconds * 1000), // Zamiana Firebase Timestamp na Date
          color: data.color || "#FF0000",
          isReminder: data.isReminder || false,
          reminderDays: data.reminderDays || 1,
        };
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń: ", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
    console.log("Clicked event:", event); // Loguj kliknięcia dla debugowania
    setTitle(event.title);
    setStartDate(new Date(event.start)); // Konwersja startu na Date
    setEndDate(new Date(event.end)); // Konwersja końca na Date
    setEditEventId(event.id);
    setIsModalOpen(true); // Otwórz modal
    setIsReminder(event.isReminder || false);
    setReminderDays(event.reminderDays || 1);
  };
  useEffect(() => {
    const checkForUpcomingEvents = () => {
      const now = new Date(); // Aktualna data
      console.log("Aktualna data i czas:", now);

      events.forEach((event) => {
        if (event.isReminder) {
          const eventStartDate = new Date(event.start); // Data rozpoczęcia wydarzenia
          const reminderDate = new Date(eventStartDate); // Kopia daty rozpoczęcia

          // Odejmowanie dni przypomnienia od daty wydarzenia
          reminderDate.setDate(reminderDate.getDate() - event.reminderDays);

          console.log(
            `Przypomnienie dla wydarzenia "${event.title}" planowane na:`,
            reminderDate
          );

          // Sprawdzanie, czy aktualna data jest między datą przypomnienia a datą wydarzenia
          if (reminderDate <= now && now < eventStartDate) {
            // Obliczanie liczby dni do wydarzenia
            const daysUntilEvent = Math.ceil(
              (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Dodanie powiadomienia do kolejki
            addNotificationToQueue(
              `Przypomnienie: Wydarzenie "${event.title}" odbędzie się za ${daysUntilEvent} dni!`
            );
          } else {
            console.log(
              `Przypomnienie dla wydarzenia "${event.title}" nie jest jeszcze wyświetlane.`
            );
          }
        }
      });
    };

    // Uruchomienie sprawdzania przypomnień na starcie aplikacji
    checkForUpcomingEvents();

    if (events.length > 0) {
      const reminderInterval = setInterval(checkForUpcomingEvents, 60000); // Sprawdzanie co minutę
      return () => clearInterval(reminderInterval); // Czyszczenie interwału przy odmontowaniu komponentu
    }
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
      notificationInProgress.current = true; // Blokuj wyświetlanie kolejnych powiadomień, dopóki obecne nie zostanie zamknięte
    }
  }, [notificationsQueue]);

  const closeNotification = (id: string) => {
    setActiveNotification(null);
    setNotificationsQueue((prevQueue) =>
      prevQueue.filter((notification) => notification.id !== id)
    );
    notificationInProgress.current = false; // Odblokuj, by można było wyświetlić kolejną notyfikację

    // Po zamknięciu aktualnej notyfikacji, sprawdź, czy jest więcej powiadomień w kolejce
    if (notificationsQueue.length > 1) {
      const nextNotification = notificationsQueue[1]; // Pobieramy kolejną notyfikację
      setActiveNotification(nextNotification);
      notificationInProgress.current = true; // Ustawiamy flagę, by uniknąć jednoczesnego wyświetlania
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
    setIsModalOpen(true); // Otwórz modal
    setIsReminder(false); // Resetowanie przypomnienia
    setReminderDays(1); // Resetowanie dni przypomnienia
  };
  const addNotification = (message: string) => {
    const newNotification = {
      id: `${Date.now()}`,
      message,
    };
    console.log("Dodawanie notyfikacji:", newNotification.message); // Sprawdź czy notyfikacja jest wywoływana
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
      // Timer automatycznie zamykający notyfikację po 5 sekundach
      const timer = setTimeout(() => onClose(id), 2000);
      return () => clearTimeout(timer); // Czyszczenie timera
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
      <div style={{ height: "100vh" }}>
        <Calendar
          events={events.map((event) => ({
            ...event,
            start: new Date(event.start), // Upewnij się, że są to obiekty Date
            end: new Date(event.end),
            title: event.title,
            color: event.color,
          }))}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color }, // Styl dla wydarzeń
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
