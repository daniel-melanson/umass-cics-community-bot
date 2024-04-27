export interface TermEvent {
  date: string;
  description: string;
}

export interface Term {
  url: string;
  id: string;
  season: string;
  year: number;
  ordinal: number;
  start_date: string;
  end_date: string;
  events: TermEvent[];
}
