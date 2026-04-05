// Types — extends @axis/shared where applicable
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = number; // 1-10

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  lifeArea: string;
  priority: TaskPriority;
  impact?: number;
  status: TaskStatus;
  isTopTask: boolean;
  aiReason?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brief {
  id: string;
  userId: string;
  date: string;
  topPriorities: string[];
  topTask?: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  timezone: string;
  wakeUpTime: string;
  sleepTime: string;
  roles: string[];
  lifeAreas: LifeArea[];
  quarterlyGoals: string[];
  isComplete: boolean;
}

export interface LifeArea {
  name: string;
  order: number;
  active: boolean;
}

// Base API fetch

const API_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  // API wraps responses in { success, data } — unwrap if present
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// Domain helpers

export async function getTodaysBrief(userId: string): Promise<Brief | null> {
  try {
    return await fetchApi<Brief>(
      `/briefs/today?userId=${encodeURIComponent(userId)}`,
    );
  } catch {
    return null;
  }
}

export async function getTodaysTasks(userId: string): Promise<Task[]> {
  try {
    return await fetchApi<Task[]>(
      `/tasks/today?userId=${encodeURIComponent(userId)}`,
    );
  } catch {
    return [];
  }
}

export async function getUserTasks(
  userId: string,
  filters?: { status?: string; lifeArea?: string },
): Promise<Task[]> {
  const params = new URLSearchParams({ userId });
  if (filters?.status != null && filters.status !== '') {
    params.set('status', filters.status);
  }
  if (filters?.lifeArea != null && filters.lifeArea !== '') {
    params.set('lifeArea', filters.lifeArea);
  }
  try {
    return await fetchApi<Task[]>(`/tasks?${params.toString()}`);
  } catch {
    return [];
  }
}

export async function updateTask(
  id: string,
  data: Partial<Task>,
): Promise<Task> {
  return fetchApi<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getBriefs(userId: string): Promise<Brief[]> {
  try {
    return await fetchApi<Brief[]>(
      `/briefs?userId=${encodeURIComponent(userId)}`,
    );
  } catch {
    return [];
  }
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  try {
    return await fetchApi<UserProfile>(
      `/profile/${encodeURIComponent(userId)}`,
    );
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  return fetchApi<UserProfile>(`/profile/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
