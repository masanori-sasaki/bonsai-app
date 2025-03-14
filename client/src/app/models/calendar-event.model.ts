import { WorkType } from './work-record.model';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color: string;
  textColor: string;
  extendedProps: {
    type: 'schedule' | 'record';
    bonsaiId: string;
    workTypes: WorkType[];
    description: string;
    originalId: string;
  }
}
