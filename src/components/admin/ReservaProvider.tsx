"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import NovaReservaModal from "./NovaReservaModal";

interface ReservaContextType {
  openModal: (preselectedTable?: string) => void;
}

const ReservaContext = createContext<ReservaContextType>({ openModal: () => {} });

export function useReserva() {
  return useContext(ReservaContext);
}

export function ReservaProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselectedTable, setPreselectedTable] = useState<string | undefined>();

  const openModal = (table?: string) => {
    setPreselectedTable(table);
    setOpen(true);
  };

  return (
    <ReservaContext.Provider value={{ openModal }}>
      {children}
      <NovaReservaModal
        open={open}
        onClose={() => setOpen(false)}
        preselectedTable={preselectedTable}
      />
    </ReservaContext.Provider>
  );
}
