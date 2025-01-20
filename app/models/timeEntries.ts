import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '~/lib/firebase';
import type { TimeEntry } from '~/types';

export async function createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'created' | 'modified'>) {
  const docRef = await addDoc(collection(db, 'timeEntries'), {
    ...timeEntry,
    date: Timestamp.fromDate(timeEntry.date),
    created: Timestamp.now(),
    modified: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTimeEntriesByEmployee(employeeId: string, startDate: Date, endDate: Date) {
  const q = query(
    collection(db, 'timeEntries'),
    where('employeeId', '==', employeeId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    created: doc.data().created.toDate(),
    modified: doc.data().modified.toDate(),
  })) as TimeEntry[];
}

export async function getTimeEntriesByProject(projectId: string) {
  const q = query(
    collection(db, 'timeEntries'),
    where('projectId', '==', projectId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    created: doc.data().created.toDate(),
    modified: doc.data().modified.toDate(),
  })) as TimeEntry[];
}