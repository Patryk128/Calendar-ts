import Calendar from "../Calendar";
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
  const [endTime, setEndTime] = useState<string>("12:00");

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
  };

  const combineDateAndTime = (date: Date | null, time: string): Date | null => {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate;
  };

  const handleSaveEvent = async () => {
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
      };

      try {
        if (editEventId) {
          const eventRef = doc(db, "events", editEventId);
          await updateDoc(eventRef, newEvent);
        } else {
          await addDoc(collection(db, "events"), newEvent);
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
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleEventClick = (event: any) => {
    const startDate = event.start.seconds
      ? new Date(event.start.seconds * 1000)
      : new Date(event.start);

    const endDate = event.end.seconds
      ? new Date(event.end.seconds * 1000)
      : new Date(event.end);

    setTitle(event.title);
    setStartDate(startDate);
    setEndDate(endDate);
    setEditEventId(event.id);
    setIsModalOpen(true);
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
        <div className="modal">
          <div className="modal-content">
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
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                setEndDate(date);
              }}
              dateFormat="yyyy/MM/dd"
              placeholderText="Select start date"
            />
            <label>Start Time (24h format):</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                const [hours, minutes] = e.target.value.split(":").map(Number);
                const endHours = (hours + 1) % 24;
                setEndTime(
                  `${endHours.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}`
                );
              }}
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
            <button onClick={handleSaveEvent}>
              {editEventId ? "Update Event" : "Save Event"}
            </button>
            <button onClick={() => resetForm()}>Cancel</button>
            {editEventId && (
              <button onClick={() => handleDeleteEvent(editEventId)}>
                Delete Event
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
