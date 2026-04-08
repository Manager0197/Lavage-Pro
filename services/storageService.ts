import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp
} from "firebase/firestore";
import { Transaction, TransactionType, ServiceItem, Washer } from "../types";

// --- Helper Functions ---

// Helper to sanitize Firestore data and convert Timestamps to strings
// Uses WeakSet to track visited objects and strictly break circular references
const sanitizeData = (data: any, visited = new WeakSet()): any => {
  if (data === null || data === undefined) return data;
  
  // Return primitives immediately
  if (typeof data !== 'object') return data;
  
  // Handle Date objects
  if (data instanceof Date) return data.toISOString();
  
  // Handle Firestore Timestamps (method check)
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle Firestore Timestamps (property check - duck typing)
  if (data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length <= 2) {
    return new Date(data.seconds * 1000).toISOString();
  }

  // Check for circular reference
  if (visited.has(data)) {
    return null; // Return null for circular references to break the cycle
  }
  visited.add(data);

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, visited));
  }
  
  // Handle Objects
  const cleaned: any = {};
  for (const key in data) {
    // SKIP internal firebase properties that cause circular refs (minified or standard)
    if (key.startsWith('_') || key === 'firestore' || key === 'auth' || key === 'app' || key === 'proactiveRefresh') {
      continue;
    }
    
    // SKIP known problematic DOM properties or specific minified props seen in errors
    if (key === 'src' || key === 'i' || key === 'json') {
       if (typeof data[key] === 'object') continue;
    }

    if (Object.prototype.hasOwnProperty.call(data, key)) {
      try {
        cleaned[key] = sanitizeData(data[key], visited);
      } catch (e) {
        // Fallback for unserializable fields
        cleaned[key] = null;
      }
    }
  }
  return cleaned;
};

export const getSummary = (transactions: Transaction[]) => {
  const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
  
  const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWashes = incomeTransactions.length;

  const totalWasherShare = incomeTransactions.reduce((sum, t) => sum + (t.washerShare || 0), 0);
  const totalPromoterShare = incomeTransactions.reduce((sum, t) => sum + (t.promoterShare || 0), 0);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    totalWashes,
    totalWasherShare,
    totalPromoterShare
  };
};

// --- Firestore Implementation ---

const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  SERVICES: 'services',
  WASHERS: 'washers'
};

const handleFirestoreError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  if (error.code === 'permission-denied') {
    console.warn("🚨 PERMISSION REFUSÉE : Veuillez vérifier vos Règles de Sécurité dans la Console Firebase (Firestore > Règles).");
  }
};

// --- Transactions ---

export const subscribeToTransactions = (callback: (data: Transaction[]) => void) => {
  const q = query(collection(db, COLLECTIONS.TRANSACTIONS), orderBy("date", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => {
      // Create a fresh visited set for each document to allow same-structure objects but catch loops
      const rawData = doc.data();
      const sanitized = sanitizeData(rawData, new WeakSet());
      
      return {
        id: doc.id,
        ...sanitized,
        // Ensure date exists and is a string
        date: sanitized.date || new Date().toISOString()
      };
    }) as Transaction[];
    callback(transactions);
  }, (error) => {
    handleFirestoreError(error, "subscribeToTransactions");
    callback([]);
  });
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), transaction);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, "addTransaction");
    throw error;
  }
};

export const updateTransaction = async (id: string, data: Partial<Transaction>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, "updateTransaction");
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, id));
  } catch (error) {
    handleFirestoreError(error, "deleteTransaction");
    throw error;
  }
};

// --- Services ---

export const subscribeToServices = (callback: (data: ServiceItem[]) => void) => {
  const q = query(collection(db, COLLECTIONS.SERVICES), orderBy("price", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeData(doc.data(), new WeakSet())
    })) as ServiceItem[];
    callback(services);
  }, (error) => {
    handleFirestoreError(error, "subscribeToServices");
    callback([]);
  });
};

export const addService = async (service: Omit<ServiceItem, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), service);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, "addService");
    throw error;
  }
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, id));
  } catch (error) {
    handleFirestoreError(error, "deleteService");
    throw error;
  }
};

// --- Washers ---

export const subscribeToWashers = (callback: (data: Washer[]) => void) => {
  const q = query(collection(db, COLLECTIONS.WASHERS), orderBy("name", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const washers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...sanitizeData(doc.data(), new WeakSet())
    })) as Washer[];
    callback(washers);
  }, (error) => {
    handleFirestoreError(error, "subscribeToWashers");
    callback([]);
  });
};

export const addWasher = async (washer: Omit<Washer, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.WASHERS), washer);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, "addWasher");
    throw error;
  }
};

export const deleteWasher = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.WASHERS, id));
  } catch (error) {
    handleFirestoreError(error, "deleteWasher");
    throw error;
  }
};