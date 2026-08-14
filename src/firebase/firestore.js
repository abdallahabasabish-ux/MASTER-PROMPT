import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from './init.js';

// CRUD Operations
export async function createDocument(collectionName, id, data) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id };
  } catch (error) {
    console.error(`Create document error in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function readDocument(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Document not found' };
  } catch (error) {
    console.error(`Read document error in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateDocument(collectionName, id, data) {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error(`Update document error in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocument(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Delete document error in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function queryDocuments(collectionName, constraints = []) {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: results };
  } catch (error) {
    console.error(`Query documents error in ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

export function listenToDocument(collectionName, id, callback) {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Listen document error in ${collectionName}:`, error);
  });
}

export function listenToQuery(collectionName, constraints, callback) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);
  return onSnapshot(q, (querySnapshot) => {
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    callback(results);
  }, (error) => {
    console.error(`Listen query error in ${collectionName}:`, error);
  });
}

// Batch operations
export async function batchWrite(operations) {
  try {
    const batch = writeBatch(db);
    operations.forEach((op) => {
      const docRef = doc(db, op.collection, op.id);
      if (op.type === 'set') {
        batch.set(docRef, op.data);
      } else if (op.type === 'update') {
        batch.update(docRef, op.data);
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Batch write error:', error);
    return { success: false, error: error.message };
  }
}

// Transaction
export async function runTransactionFn(updateFn) {
  try {
    const result = await runTransaction(db, updateFn);
    return { success: true, result };
  } catch (error) {
    console.error('Transaction error:', error);
    return { success: false, error: error.message };
  }
}
