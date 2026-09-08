import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { getJurisdiction, JURISDICTION_STORAGE_KEY, type Jurisdiction } from '../data/jurisdictions';

interface JurisdictionContextValue {
  code: string;
  active: Jurisdiction;
  setCode: (code: string) => void;
}

const JurisdictionContext = createContext<JurisdictionContextValue>({
  code: 'LR',
  active: getJurisdiction('LR'),
  setCode: () => {},
});

function readStored(): string {
  try {
    return localStorage.getItem(JURISDICTION_STORAGE_KEY) ?? 'LR';
  } catch {
    return 'LR';
  }
}

export function JurisdictionProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<string>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(JURISDICTION_STORAGE_KEY, code);
    } catch {
      /* private mode */
    }
  }, [code]);

  const setCode = useCallback((next: string) => {
    setCodeState(next);
    try {
      localStorage.setItem(JURISDICTION_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  return (
    <JurisdictionContext.Provider value={{ code, active: getJurisdiction(code), setCode }}>
      {children}
    </JurisdictionContext.Provider>
  );
}

/** Global respect-area country — tap a flag anywhere, the whole app (incl. AI) follows. */
export function useJurisdiction(): JurisdictionContextValue {
  return useContext(JurisdictionContext);
}
