import { ChangePasswordScreen } from "@/features/auth/components/change-password-screen";

// Auth may omit this segment; do not validate navigation through the session gate.
export const instant = false;

export default function ChangePasswordPage() {
  return <ChangePasswordScreen />;
}
