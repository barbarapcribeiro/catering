import { PHONE_COUNTRIES, type PhoneNumber } from "../types";
import "./PhoneNumberField.css";

export function PhoneNumberField({
  value,
  onChange,
  label = "Celular (WhatsApp)",
}: {
  value: PhoneNumber;
  onChange: (value: PhoneNumber) => void;
  label?: string;
}) {
  return (
    <div className="field-label">
      {label}
      <div className="phone-number-field">
        <select
          className="phone-number-field__country"
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.label}
            </option>
          ))}
        </select>
        <input
          className="phone-number-field__ddd"
          value={value.ddd}
          onChange={(e) => onChange({ ...value, ddd: e.target.value.replace(/\D/g, "").slice(0, 3) })}
          placeholder="DDD"
          inputMode="numeric"
        />
        <input
          className="phone-number-field__number"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value })}
          placeholder="91234-5678"
          inputMode="tel"
        />
      </div>
    </div>
  );
}
