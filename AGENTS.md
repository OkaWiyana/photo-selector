# AGENTS.md — Photo Selector

## Project Mission

Build a small, maintainable photo-selection/proofing web application for photographers.

The core workflow is:

```text
Photographer
Google Drive folder
        ↓
Create gallery
        ↓
Share gallery URL
        ↓
Client opens gallery
        ↓
Select photos
        ↓
Send selected filenames through WhatsApp
```

The project is primarily a portfolio/learning project that may later be used for real photography jobs.

---

## Current Development Strategy

Work incrementally.

**Do not implement the entire product in one step.**

The required order is:

1. Mock client gallery.
2. Selection interaction.
3. Selection limit.
4. Photo preview.
5. WhatsApp message generation.
6. Photographer create-gallery UI.
7. Gallery routing/configuration.
8. Google Drive integration.
9. Persistence/database.
10. Deployment hardening.

Always keep the application runnable after each meaningful change.

---

## Technology Rules

Use:

- Next.js
- TypeScript
- App Router
- Tailwind CSS

Prefer the existing project dependencies before installing additional packages.

Do not add a dependency merely because it makes a small task slightly easier.

When a new dependency is genuinely useful, explain why it is needed before introducing it.

---

## Architecture Principles

### Server vs client

Prefer Server Components by default.

Use `"use client"` only for components that need browser-side interactivity/state, such as:

- Photo selection.
- Lightbox interactions.
- Client-side gallery controls.

Do not turn entire pages into Client Components unnecessarily.

### Google Drive

Google Drive is the photo storage layer.

Do not copy original photos into the application unless a future requirement explicitly calls for it.

Google API credentials/secrets must never be exposed to the browser.

Google Drive API calls that require secrets should be handled server-side.

### WhatsApp

Use a WhatsApp deep link with a URL-encoded message.

Do not introduce the WhatsApp Business API for the MVP.

---

## Coding Style

- TypeScript strictness should remain enabled.
- Prefer clear, descriptive names.
- Keep components small and focused.
- Avoid giant components.
- Avoid premature abstractions.
- Avoid unnecessary design-system complexity.
- Keep business logic separate from visual components when it improves clarity.
- Use semantic HTML.
- Keep accessibility in mind.
- Handle loading, empty, and error states deliberately.

---

## UI/UX Rules

The client gallery is the most important interface.

Priorities:

1. Photos.
2. Easy selection.
3. Clear selection count.
4. Fast mobile interaction.
5. Clear submit action.

The design should feel like a photography proofing gallery, not a generic admin dashboard.

Use:
- Clean typography.
- Neutral visual treatment.
- Generous spacing.
- Subtle transitions.
- Strong selected states.

Avoid:
- Excessive gradients.
- Excessive cards.
- Heavy shadows.
- Unnecessary animations.
- Clutter.
- Generic SaaS styling.

Mobile-first thinking is required for the client gallery.

---

## Selection Rules

A gallery has a configurable maximum number of selections.

Example:

```text
Selected 7 / 10
```

Rules:

- Selecting a photo increases the count.
- Unselecting decreases the count.
- Selection beyond the limit is blocked.
- The limit must be visually clear.
- The submit action should not allow an empty selection.
- Selection state must be consistent while opening/closing photo previews.

Do not silently remove previously selected photos when the limit is reached.

---

## Mock Data First

Before integrating Google Drive, use local mock data.

Example conceptual shape:

```ts
type MockPhoto = {
  id: string;
  name: string;
  src: string;
};
```

The mock gallery must exercise the real selection UI.

Do not build a fake UI that will need to be completely rewritten when Google Drive is introduced.

Keep the interface between gallery UI and photo data simple enough that the data source can later be replaced by Google Drive.

---

## Google Drive Integration Rules

When Google Drive integration begins:

1. Accept a Google Drive folder URL.
2. Extract the folder ID.
3. Validate the folder ID.
4. Query only the intended folder.
5. Filter to supported image MIME types.
6. Retrieve only metadata and preview information required by the gallery.
7. Keep privileged API access server-side.
8. Handle inaccessible folders gracefully.
9. Do not expose credentials.
10. Do not assume every Drive file has a usable thumbnail.

Do not implement OAuth until the basic public/shared-folder approach is proven.

---

## Routing

The intended client URL shape is:

```text
/gallery/[id]
```

Keep gallery IDs independent from Google Drive folder IDs.

Do not expose sensitive credentials or internal configuration in the URL.

---

## WhatsApp Message

The generated message should contain:

- A short greeting.
- The selected filenames.
- Total number of selected photos.

Example:

```text
Halo Kak, saya sudah memilih foto untuk diedit.

1. IMG_001.JPG
2. IMG_023.JPG
3. IMG_105.JPG

Total: 3 foto.
```

The message must be URL encoded safely.

Do not rely on filenames being URL-safe.

---

## Error Handling

Never expose:

- API keys.
- Environment variable values.
- Stack traces.
- Internal server details.

Provide user-friendly messages for:

- Invalid Drive URL.
- Gallery not found.
- Drive folder inaccessible.
- No images found.
- Failed image preview.
- Invalid selection.
- WhatsApp submission failure.

---

## Performance

Assume a client gallery may contain hundreds of photos.

Prefer:
- Lazy-loaded images.
- Thumbnail/preview URLs.
- Responsive sizing.
- Minimal initial JavaScript.
- Efficient rendering.

Do not intentionally download original full-resolution images for every gallery tile.

If a later implementation requires virtualization/pagination, introduce it only when actual gallery size makes it necessary.

---

## Security

Treat all external input as untrusted.

Validate:
- Google Drive URLs.
- Gallery IDs.
- Selection limits.
- User-provided strings.

Never put secrets in:
- React components.
- `NEXT_PUBLIC_*` environment variables unless the value is genuinely public.
- Client-side source code.

---

## Environment Variables

Keep secrets in environment variables.

Document required environment variables in an example file when integration begins:

```text
.env.example
```

Never commit actual secrets.

---

## Git Practices

Use small, meaningful commits where practical.

Examples:

```text
feat: add client photo gallery
feat: enforce photo selection limit
feat: add photo preview
feat: generate WhatsApp selection message
feat: integrate Google Drive folder
```

Avoid giant commits that mix unrelated changes.

---

## Agent Workflow

Before making a substantial change:

1. Inspect the existing project.
2. Identify the relevant files.
3. Reuse existing patterns.
4. Make the smallest coherent change.
5. Run lint/type checks/build when appropriate.
6. Report what changed and any remaining issue.

Do not rewrite working code without a reason.

Do not install packages automatically just because they are commonly used.

Do not implement future features unless explicitly requested.

---

## Definition of Done

A task is not done merely because the UI looks correct.

For a feature to be considered complete:

- It works in the intended flow.
- TypeScript has no relevant errors.
- ESLint passes when applicable.
- The application still starts with `npm run dev`.
- Responsive behavior is considered.
- Loading/empty/error states are handled where relevant.
- No secrets are exposed.
- The implementation does not unnecessarily block future Google Drive integration.

---

## Current Priority

The immediate development target is:

### Phase 1 — Mock Photo Gallery

Build:

1. Client gallery page.
2. Mock photo data.
3. Responsive image grid.
4. Photo selection.
5. Selection counter.
6. Maximum selection enforcement.
7. Photo preview/lightbox.
8. WhatsApp message generation.

Do not implement Google Drive or Supabase during this phase.
