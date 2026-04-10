# Privacy and Trust Specification (MVP)

## Privacy-First Defaults

- Sensitive notification content hidden by default.
- Data collection minimized to required tracking fields.
- Reproductive mode is private profile data and not shown externally.
- Background analytics for sensitive events disabled unless explicit consent is granted.

## Notification Policy

- Default push copy should be generic:
  - "You have a health reminder."
  - Avoid symptom names, period status, pregnancy week, or fertility details on lock screen.
- User options:
  - Disable all reminders
  - Time-window controls for reminder delivery
  - Per-category toggles (cycle, pregnancy, symptoms)

## App Protection Controls

- Optional lock methods:
  - Device biometric
  - App PIN fallback
- Re-authentication required after idle timeout.
- App switcher preview masking enabled when app lock is active.

## Consent and Transparency

- Consent moments:
  - Onboarding consent summary
  - Separate consent for optional data sharing
- Privacy center includes:
  - What data is stored
  - Why each data type is needed
  - How long data is retained
  - How to revoke permissions

## Data Rights and Controls

- Export data:
  - User-triggered export in structured format suitable for clinician sharing.
- Delete data:
  - Per-entry deletion
  - Full account/data deletion
- Confirmation and cooldown:
  - Clear confirmation dialogs for destructive operations
  - Account deletion safety notice before final action

## Security Baseline (MVP)

- Encrypt data in transit and at rest.
- Token-based authenticated access for user records.
- Basic audit events:
  - login
  - export requested
  - deletion requested/completed
- No exposure of sensitive fields in logs or crash reports.

## Trust Content Rules

- Never present predictive values as certainty.
- Use confidence and uncertainty labels in non-alarmist language.
- Include medical disclaimer where clinically sensitive content appears:
  - "This app provides informational support and does not replace medical advice."
