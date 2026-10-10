import { Suspense } from "react";
import WorkoutEditorPage from "@/components/WorkoutEditorPage";

export default function WorkoutEditor() {
  // The editor reads ?levelId= and ?type= when creating, which needs a Suspense boundary.
  return (
    <Suspense fallback={<p className="text-body-md text-text-muted">טוען...</p>}>
      <WorkoutEditorPage />
    </Suspense>
  );
}
