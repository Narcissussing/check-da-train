import { createContext, useContext } from 'react'

const SleepModeContext = createContext(false)

export const SleepModeProvider = SleepModeContext.Provider

export default function useSleepMode() {
  return useContext(SleepModeContext)
}
