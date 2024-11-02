import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";
import "moment/locale/en-gb";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  isReminder?: boolean;
  reminderDays?: number;
}

moment.updateLocale("en-gb", {
  week: { dow: 1 },
});

const localizer = momentLocalizer(moment);

export default function Calendar(
  props: Omit<CalendarProps<Event, object>, "localizer">
) {
  return (
    <BigCalendar<Event, object>
      {...props}
      localizer={localizer}
      views={["month", "week", "day", "agenda"]}
      defaultView="month"
      step={15}
      showMultiDayTimes
      style={{ height: "100%" }}
    />
  );
}
