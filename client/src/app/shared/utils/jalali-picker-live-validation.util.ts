import { jalaliToIsoDate } from '@app/shared/utils/jalali-iranian-calendar.util';
import {
  helpKeyForValidationError,
  type ReproductiveDateValidationResult,
} from '@app/shared/utils/reproductive-date-validation.util';

export interface JalaliPickerLiveValidationOptions {
  validate: (iso: string) => ReproductiveDateValidationResult;
  translate: (key: string) => string;
  rangeHint?: string;
}

type LegacyPickerColumn = {
  selectedIndex?: number;
  options: { value?: unknown }[];
};

type LegacyPickerElement = HTMLElement & {
  getColumn: (name: string) => Promise<LegacyPickerColumn | undefined>;
  shadowRoot?: ShadowRoot | null;
};

const FEEDBACK_CLASS = 'jalali-picker-feedback';
const RANGE_HINT_CLASS = 'jalali-picker-range-hint';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pickerContentHost(picker: LegacyPickerElement): HTMLElement | null {
  const wrapper =
    picker.shadowRoot?.querySelector('.picker-wrapper') ??
    picker.querySelector('.picker-wrapper');
  return (wrapper as HTMLElement | null) ?? picker;
}

function readColumnValueFromData(col: LegacyPickerColumn | undefined): number | null {
  if (!col?.options?.length) {
    return null;
  }
  const index = col.selectedIndex ?? 0;
  const raw = col.options[index]?.value;
  if (raw == null || raw === '') {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function readJalaliIsoFromPicker(
  picker: LegacyPickerElement,
): Promise<string | null> {
  const [dayCol, monthCol, yearCol] = await Promise.all([
    picker.getColumn('day'),
    picker.getColumn('month'),
    picker.getColumn('year'),
  ]);
  const day = readColumnValueFromData(dayCol);
  const month = readColumnValueFromData(monthCol);
  const year = readColumnValueFromData(yearCol);
  if (day == null || month == null || year == null) {
    return null;
  }
  return jalaliToIsoDate(year, month, day);
}

export function showJalaliPickerRangeHint(
  picker: LegacyPickerElement,
  rangeHint: string | undefined,
): void {
  const host = pickerContentHost(picker);
  if (!host || !rangeHint) {
    return;
  }

  let hint = host.querySelector(`.${RANGE_HINT_CLASS}`) as HTMLElement | null;
  if (!hint) {
    hint = document.createElement('p');
    hint.className = RANGE_HINT_CLASS;
    hint.style.margin = '8px 16px 0';
    hint.style.padding = '8px 12px';
    hint.style.fontSize = '12px';
    hint.style.lineHeight = '1.45';
    hint.style.color = '#64748b';
    hint.style.background = 'rgba(15, 23, 42, 0.04)';
    hint.style.borderRadius = '10px';
    hint.style.textAlign = 'center';
    const columns = host.querySelector('.picker-columns');
    if (columns) {
      host.insertBefore(hint, columns);
    } else {
      host.prepend(hint);
    }
  }
  hint.textContent = rangeHint;
}

export function showJalaliPickerFeedback(
  picker: LegacyPickerElement,
  errorKey: string | null,
  translate: (key: string) => string,
): void {
  const host = pickerContentHost(picker);
  if (!host) {
    return;
  }

  let box = host.querySelector(`.${FEEDBACK_CLASS}`) as HTMLElement | null;
  if (!errorKey) {
    box?.remove();
    return;
  }

  if (!box) {
    box = document.createElement('div');
    box.className = FEEDBACK_CLASS;
    box.setAttribute('role', 'alert');
    box.style.margin = '0 16px 12px';
    box.style.padding = '10px 12px';
    box.style.background = 'rgba(194, 30, 86, 0.08)';
    box.style.borderRadius = '10px';
    box.style.textAlign = 'center';
    host.appendChild(box);
  }

  const errorText = translate(errorKey);
  const helpKey = helpKeyForValidationError(errorKey);
  const helpText = helpKey ? translate(helpKey) : '';

  box.innerHTML = `
    <p style="margin:0;font-size:13px;line-height:1.45;font-weight:600;color:#c21e56;">${escapeHtml(errorText)}</p>
    ${
      helpText
        ? `<p style="margin:6px 0 0;font-size:12px;line-height:1.45;color:#64748b;">${escapeHtml(helpText)}</p>`
        : ''
    }
  `;
}

export function attachJalaliPickerLiveValidation(
  picker: LegacyPickerElement,
  options: JalaliPickerLiveValidationOptions,
): () => Promise<ReproductiveDateValidationResult | null> {
  showJalaliPickerRangeHint(picker, options.rangeHint);

  const runValidation = async (): Promise<ReproductiveDateValidationResult | null> => {
    const iso = await readJalaliIsoFromPicker(picker);
    if (!iso) {
      showJalaliPickerFeedback(picker, null, options.translate);
      return null;
    }
    const check = options.validate(iso);
    showJalaliPickerFeedback(
      picker,
      check.valid ? null : check.errorKey,
      options.translate,
    );
    return check;
  };

  const onColumnChange = () => {
    void runValidation();
  };

  const bindColumnListeners = () => {
    const columns =
      picker.shadowRoot?.querySelectorAll('ion-picker-legacy-column') ??
      picker.querySelectorAll('ion-picker-legacy-column');
    columns.forEach((col) => {
      col.addEventListener('ionPickerColChange', onColumnChange);
    });
  };

  bindColumnListeners();
  picker.addEventListener('ionPickerColChange', onColumnChange);

  void runValidation();
  setTimeout(() => {
    bindColumnListeners();
    void runValidation();
  }, 50);

  return runValidation;
}

export function clearJalaliPickerFeedback(picker: LegacyPickerElement): void {
  pickerContentHost(picker)?.querySelector(`.${FEEDBACK_CLASS}`)?.remove();
}
