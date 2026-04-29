# Form Type Patterns

Best practices for specific form types, derived from Vitaly Friedman's Smart Interface Design Patterns and Smashing Magazine workshops.

## Feedback Surveys (NPS, CSAT, General)

**Structure:**
- Lead with the rating question (most important data point)
- Follow with optional open-ended feedback
- End with optional contact info

**Rating inputs:**
- NPS (0-10): Use a horizontal row of labeled buttons, not a dropdown. Show anchors ("Not likely" / "Extremely likely") at ends. Highlight the selected value.
- CSAT (1-5): Star ratings or emoji scales. Each option must be keyboard-selectable and have an accessible label.
- Never use a plain number input for ratings — the visual scale IS the UX.

**Completion optimization:**
- Keep to 3-5 questions maximum
- Optional fields should be clearly marked
- Show progress if multi-question ("2 of 3")
- Confirmation screen should thank the user and set expectations ("We'll follow up within 48 hours")

## Contact Forms

**Minimum fields:** Name, email, message. Everything else is optional and should be justified.

**Patterns:**
- Pre-fill subject/category with a smart default if the user arrived from a specific page
- Textarea should have a generous minimum height (4-6 rows)
- Include expected response time in the confirmation
- Consider a "Send me a copy" checkbox

**Anti-patterns:**
- Phone number as required field (most users won't call back)
- Department dropdown with 20+ options (use autocomplete or smart routing)
- CAPTCHA without a fallback

## Registration / Signup

**Patterns:**
- Ask for email + password only. Collect profile details later (progressive profiling).
- Show password strength indicator with specific feedback ("Add a number" not "Weak")
- Accessible show/hide password toggle
- Clear password requirements listed BEFORE the field, not as error messages
- "Already have an account? Sign in" link near the submit button

**Anti-patterns:**
- Username field (let email be the identifier)
- "Confirm password" field (use show/hide toggle instead)
- Required phone number at signup
- Terms checkbox that blocks submit without clear explanation

## Multi-Step Wizards

**When to use:** More than 7 fields, or logically distinct sections (personal info → payment → confirmation).

**Patterns:**
- Step indicator showing current position and total steps (not just "Step 2")
- Each step should be completable in under 60 seconds
- Allow backward navigation without losing data
- Validate each step before advancing (don't collect errors until the end)
- Show a summary/review step before final submission
- Persist progress (localStorage or server-side) — users will abandon and return

**Navigation:**
- "Back" and "Continue" buttons (not "Previous"/"Next" — too ambiguous)
- "Back" should be secondary/ghost style, "Continue" should be primary
- Never use "Submit" until the final step

**Accessibility:**
- Announce step changes to screen readers via `aria-live`
- Each step should be a distinct landmark or heading level
- Focus management: move focus to the first field of the new step

## Medical Intake

**Sensitivity:**
- Use respectful, inclusive language
- Explain WHY each piece of information is needed
- Allow "Prefer not to say" options for sensitive fields (gender, ethnicity)
- HIPAA/privacy notice visible but not blocking

**Patterns:**
- Group by category: demographics, medical history, current medications, insurance
- Date of birth: use three dropdowns (month/day/year) not a date picker (faster, clearer)
- Medication list: autocomplete with drug database, allow free text
- Conditions: searchable checkbox list, not a wall of checkboxes

## Job Applications

**Patterns:**
- Resume upload with clear format requirements (PDF, DOCX, max size)
- Auto-parse resume to pre-fill fields where possible
- LinkedIn URL as optional shortcut
- Cover letter: optional textarea, not required file upload
- Work experience: repeatable field group (add another position)

**Anti-patterns:**
- Re-typing everything that's on the resume
- "Desired salary" as required field
- Mandatory cover letter for all positions
- Multi-page application without save/resume capability

## Payment Forms

**Security signals:**
- Lock icon, "Secure payment" text, SSL badge
- Credit card brand detection from first digits (show Visa/MC icon)
- Format card number with spaces (4242 4242 4242 4242) using input mask

**Patterns:**
- Card number → Expiry → CVV in a single row (visual credit card metaphor)
- Auto-advance between fields when filled
- Show order summary alongside payment form
- "Billing same as shipping" checkbox (default checked)
- Clear total with tax breakdown

**Accessibility:**
- `autocomplete="cc-number"`, `autocomplete="cc-exp"`, `autocomplete="cc-csc"`
- `inputmode="numeric"` for all card fields
- Error on specific field ("Expiry date must be in the future") not generic

## File Upload Forms

**Patterns:**
- Drag-and-drop zone with a fallback button ("or click to browse")
- Show accepted formats and max file size BEFORE upload
- Progress indicator during upload
- Preview for images, filename + icon for documents
- Allow multiple files if applicable (show a list)
- Remove/replace button for each uploaded file

**Accessibility:**
- The drop zone must be keyboard-accessible (focusable, activatable with Enter/Space)
- Announce upload progress to screen readers via `aria-live`
- File list must be navigable (each file is a labeled element with a remove button)
