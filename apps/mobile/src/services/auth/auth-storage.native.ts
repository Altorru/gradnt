import * as SecureStore from 'expo-secure-store'

import { createChunkedStorage } from './chunked-storage'

export const authStorage = createChunkedStorage({
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
})
