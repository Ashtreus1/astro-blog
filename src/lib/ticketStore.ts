import { create } from 'zustand';

export interface Ticket { id: string; name: string; issue: string; status: string; }

interface TicketState {
  tickets: Ticket[];
  addTicket: (t: Ticket) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  addTicket: (t) => set((s) => ({ tickets: [...s.tickets, t] })),
}));
