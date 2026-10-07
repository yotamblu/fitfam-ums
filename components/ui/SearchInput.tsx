import { SearchIcon } from "./icons";

export default function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        dir="ltr"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-full border border-border-emphasis bg-well ps-11 pe-4 text-start text-body-md text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      />
    </label>
  );
}
