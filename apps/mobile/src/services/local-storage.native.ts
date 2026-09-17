import Storage from 'expo-sqlite/kv-store'

/** Non-secret product data; credentials continue to live in SecureStore. */
export const localStorage = Storage
