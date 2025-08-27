export interface Message {
  id: number;
  sender: 'player' | 'admin';
  text: string;
  time: string;
  pending?: boolean;
  error?: boolean;
}
