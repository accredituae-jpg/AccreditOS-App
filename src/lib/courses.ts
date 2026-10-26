export interface Course {
  id: string;
  name: string;
}

export function getCourses(): Course[] {
  return [];
}

export function saveCourses(courses: Course[]): void {
  // Deprecated: client-side persistence is replaced by server-side DB operations
}

