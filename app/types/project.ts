// app/types/project.ts
export interface ProjectTask {
  TaskID: number;
  TaskName: string;
  StartDate: Date;
  EndDate: Date;
  ResourceID: string;
  Progress: number;
}

export interface Resource {
  ResourceID: string;
  ResourceName: string;
}
