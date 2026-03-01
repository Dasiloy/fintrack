/** User from session for sidebar and app shell (name, email, avatar) */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
