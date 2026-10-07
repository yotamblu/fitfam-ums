"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { Customer, Plan } from "@/lib/types";
import AddCustomerForm from "./AddCustomerForm";
import { useAdminSession } from "./AdminSession";
import CustomersTable from "./CustomersTable";

export default function UsersPage() {
  const { onSessionLost } = useAdminSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyData = useCallback(
    ([loadedPlans, loadedCustomers]: [Plan[], Customer[]]) => {
      setPlans(loadedPlans);
      setCustomers(loadedCustomers);
      setLoadError(null);
      setLoaded(true);
    },
    [],
  );

  const handleLoadError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return;
      }
      setLoadError(describeError(e));
    },
    [onSessionLost],
  );

  // Used after adding a customer and by the retry button (event handlers, not effects).
  const reload = useCallback(async () => {
    try {
      applyData(await Promise.all([api.listPlans(), api.listUsers()]));
    } catch (e) {
      handleLoadError(e);
    }
  }, [applyData, handleLoadError]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listPlans(), api.listUsers()])
      .then((data) => {
        if (!cancelled) applyData(data);
      })
      .catch((e) => {
        if (!cancelled) handleLoadError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [applyData, handleLoadError]);

  return (
    <div className="flex flex-col gap-8">
      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-body-md text-danger"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full border border-border-emphasis px-4 py-1.5 text-text-primary hover:bg-surface-raised"
          >
            נסו שוב
          </button>
        </div>
      )}

      {loaded && (
        <>
          <AddCustomerForm plans={plans} onAdded={reload} onSessionLost={onSessionLost} />

          <section aria-labelledby="customers-title" className="flex flex-col gap-3">
            <h2 id="customers-title" className="font-heading text-headline-sm font-bold">
              משתמשים ({customers.length})
            </h2>
            <CustomersTable customers={customers} />
          </section>
        </>
      )}

      {!loaded && !loadError && <p className="text-body-md text-text-muted">טוען...</p>}
    </div>
  );
}
