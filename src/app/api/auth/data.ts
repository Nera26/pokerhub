export interface User {
  id: number;
  email: string;
  password: string;
}

export const USERS: User[] = [
  { id: 1, email: 'player@example.com', password: 'password123' },
];

// Map of email -> reset code
export const resetCodes = new Map<string, string>();
