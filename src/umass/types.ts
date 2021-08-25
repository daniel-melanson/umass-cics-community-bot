interface Event {
  date: Date;
  description: string;
}

export type Season = "spring" | "summer" | "fall" | "winter";
export interface Semester {
  season: Season;
  year: number;
  startDate: Date;
  endDate: Date;
  events: Array<Event>;
}

export type CourseSubject = "CICS" | "COMPSCI" | "INFO" | "MATH" | "STATISTIC";
export interface Course {
  subject: CourseSubject;
  id: string;
  title: string;
  number: string;
  description: string;
  staff?: Array<string>;
  website?: string;
  frequency?: string;
  career?: string;
  units?: string;
  gradingBasis?: string;
  components?: string;
  enrollmentRequirement?: string;
}

export interface Staff {
  names: Array<string>;
  title: string;
  photo: string;
  email: string;
  website: string;
  courses: Array<string>;
}
