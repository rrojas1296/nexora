import { ModuleWorkspace } from "@/features/workspace/components/module-workspace";

// Auth may omit this segment; do not validate navigation through the session gate.
export const instant = false;

export default function DashboardPage() {
  return <ModuleWorkspace module="dashboard" />;
}
