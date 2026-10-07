import { Suspense } from "react";
import AddUserPage from "@/components/AddUserPage";

export default function Add() {
  // AddUserPage reads the ?email= query string, which needs a Suspense boundary.
  return (
    <Suspense fallback={<p className="text-body-md text-text-muted">טוען...</p>}>
      <AddUserPage />
    </Suspense>
  );
}
