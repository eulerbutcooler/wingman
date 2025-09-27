import type {
  Course as CourseType,
  Topic as TopicType,
  Lesson as LessonType,
} from "@/types";

interface Course extends CourseType {
  topics?: Topic[];
}

interface Topic extends TopicType {
  lessons?: Lesson[];
}

interface Lesson extends LessonType {
  lessons?: Lesson[];
  fileUrl?: string | null; // Added for library display (from files table join)
}

type ViewType = "library" | "course" | "topic" | "create";

export { Course, Topic, Lesson, ViewType };
