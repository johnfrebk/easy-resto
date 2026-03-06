// Auth: sistema de login local con localStorage

export interface AppUser {
  id: string;
  username: string;
  role: 'admin' | 'cajero';
}

export interface StoredUser extends AppUser {
  password: string;
}

const USERS_KEY = 'pos_users';
const SESSION_KEY = 'pos_session';

function getUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Inicializar con usuario admin por defecto si no existe
export function initAuth() {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([
      { id: crypto.randomUUID(), username: 'admin', password: 'admin123', role: 'admin' },
      { id: crypto.randomUUID(), username: 'cajero', password: 'cajero123', role: 'cajero' },
    ]);
  }
}

export function login(username: string, password: string): AppUser | null {
  initAuth();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const session: AppUser = { id: user.id, username: user.username, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AppUser | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'admin';
}

export function getUsers(): StoredUser[] {
  initAuth();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function addUser(username: string, password: string, role: 'admin' | 'cajero') {
  const users = getUsers();
  users.push({ id: crypto.randomUUID(), username, password, role });
  saveUsers(users);
}

export function deleteUser(id: string) {
  saveUsers(getUsers().filter(u => u.id !== id));
}

