export type NoteCategory = 'Home' | 'Work' | 'Personal';

export const noteCategories: NoteCategory[] = ['Home', 'Work', 'Personal'];

export function sampleNote(overrides: Partial<{ title: string; description: string; category: NoteCategory }> = {}) {
  return {
    title: overrides.title ?? 'Sample note title',
    description: overrides.description ?? 'Sample note description',
    category: overrides.category ?? 'Home',
  };
}
