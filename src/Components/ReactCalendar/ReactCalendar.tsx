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
  const [tasks, setTasks] = useState<any[]>([]);
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
  const [isTask, setIsTask] = useState(false); // New state to toggle between event and task
  const [editTask, setEditTask] = useState(false); // New state to track if we're editing a task

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

  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const fetchedTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchTasks();
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setTitle("");
    setEditEventId(null);
    setEditTask(false);
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
    setEditTask(false); // Reset task edit state
    setIsTask(false); // Reset to default (event)
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

    if (isTask) {
      // Save or update task
      const newTask = {
        title,
        start: combinedStartDate,
        color,
      };

      try {
        if (editTask) {
          const taskRef = doc(db, "tasks", editEventId!);
          await updateDoc(taskRef, newTask);
        } else {
          await addDoc(collection(db, "tasks"), newTask);
        }

        fetchTasks();
        resetForm();
      } catch (error) {
        console.error("Error saving task: ", error);
      }
    } else {
      // Save or update event
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
          if (editEventId && !editTask) {
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
    }
  };

  const handleDeleteEvent = async (eventId: string, isTaskItem: boolean) => {
    try {
      const collectionName = isTaskItem ? "tasks" : "events";
      await deleteDoc(doc(db, collectionName, eventId));
      if (isTaskItem) {
        fetchTasks();
      } else {
        fetchEvents();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting event or task: ", error);
    }
  };

  const handleEventClick = (event: any, isTaskItem = false) => {
    const startDate = event.start.seconds
      ? new Date(event.start.seconds * 1000)
      : new Date(event.start);

    const endDate = event.end?.seconds
      ? new Date(event.end.seconds * 1000)
      : new Date(event.end || event.start); // Tasks do not have end dates

    setTitle(event.title);
    setStartDate(startDate);
    setEndDate(endDate);
    setEditEventId(event.id);
    setEditTask(isTaskItem); // Set whether we're editing a task
    setIsTask(isTaskItem); // Show task-related fields accordingly
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ height: "80vh" }}>
        <Calendar
          events={[
            ...events.map((event) => ({
              ...event,
              start: new Date(event.start.seconds * 1000),
              end: new Date(event.end.seconds * 1000),
              color: event.color || "#FF0000",
            })),
            ...tasks.map((task) => ({
              ...task,
              start: new Date(task.start.seconds * 1000),
              end: new Date(task.start.seconds * 1000), // Tasks have no end time
              color: task.color || "#00FF00", // Optional: Different color for tasks
            })),
          ]}
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color },
          })}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => handleEventClick(event, !!event.end)} // If no end time, it's a task
        />
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              {editEventId
                ? editTask
                  ? "Edit Task"
                  : "Edit Event"
                : isTask
                ? "Add New Task"
                : "Add New Event"}
            </h3>
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div>
              <label>
                <input
                  type="radio"
                  name="event-task-toggle"
                  checked={!isTask}
                  onChange={() => setIsTask(false)}
                />
                Event
              </label>
              <label>
                <input
                  type="radio"
                  name="event-task-toggle"
                  checked={isTask}
                  onChange={() => setIsTask(true)}
                />
                Task
              </label>
            </div>

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
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            {!isTask && (
              <>
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
              </>
            )}

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

            <button onClick={handleSave}>
              {editEventId ? "Update" : "Save"}
            </button>
            {editEventId && (
              <button onClick={() => handleDeleteEvent(editEventId, isTask)}>
                Delete
              </button>
            )}
            <button onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
