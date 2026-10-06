import type { Customer } from "@/lib/types";

const STATUS_LABEL: Record<Customer["status"], string> = {
  invited: "הוזמן",
  active: "פעיל",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL");
}

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-5 text-body-md text-text-muted">
        עדיין אין משתמשים במערכת.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-start text-body-md">
        <thead className="bg-surface-raised text-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              מייל
            </th>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              סטטוס
            </th>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              תוכניות
            </th>
            <th scope="col" className="px-4 py-3 text-start font-semibold">
              התחברות ראשונה
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <span dir="ltr" className="inline-block">
                  {customer.email}
                </span>
                {customer.role === "admin" && (
                  <span className="ms-2 rounded-full border border-border-emphasis px-2 py-0.5 text-label-md text-text-secondary">
                    מנהל
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    customer.status === "active" ? "text-volt" : "text-text-secondary"
                  }
                >
                  {STATUS_LABEL[customer.status]}
                </span>
              </td>
              <td className="px-4 py-3">
                {customer.enrollments.length === 0 ? (
                  <span className="text-text-muted">—</span>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {customer.enrollments.map((enrollment) => (
                      <li
                        key={enrollment.planSlug}
                        className="rounded-full border border-border-emphasis bg-well px-3 py-1 text-label-md"
                      >
                        {enrollment.planNameHe ?? enrollment.planSlug} · רמה{" "}
                        {enrollment.levelNumber}
                        {enrollment.levelNameHe ? ` - ${enrollment.levelNameHe}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                <span dir="ltr" className="inline-block">
                  {formatDate(customer.firstLoginAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
