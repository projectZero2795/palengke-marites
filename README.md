# @palengke/marites

Shared Marites bubble for the Palengke ecosystem.

This package keeps the Marites launcher, panel, size, image, idle hide behavior, and drag behavior in one place so apps do not keep copying their own bubble code.

## React usage

```tsx
"use client";

import { PalengkeMaritesBubble } from "@palengke/marites";
import "@palengke/marites/styles.css";

export function AnonymousContactBubble() {
  return <PalengkeMaritesBubble apiBasePath="/api/marites" />;
}
```

For `palengke.es`, which posts through its shared backend proxy:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { PalengkeMaritesBubble } from "@palengke/marites";
import { apiFetch } from "@/lib/client-api";

export function AnonymousContactBubble() {
  const router = useRouter();
  return (
    <PalengkeMaritesBubble
      supportPath="/support/tickets"
      wantedPath="/wanted-posts"
      postJson={(path, payload) =>
        apiFetch(path, {
          method: "POST",
          body: JSON.stringify(payload)
        })
      }
      onWantedPosted={() => router.refresh()}
    />
  );
}
```

## Static page usage

```html
<link rel="stylesheet" href="/vendor/palengke-marites/styles.css">
<script type="module">
  import { mountPalengkeMarites } from "/vendor/palengke-marites/vanilla.js";

  mountPalengkeMarites({
    apiBasePath: "/api/marites"
  });
</script>
```

## Backend helpers

Node backends can reuse payload normalization and the Palengke API proxy helpers:

```js
import { createSupportTicket, createWantedPost } from "@palengke/marites/backend";

app.post("/api/marites/support", async (req, res) => {
  const ticket = await createSupportTicket(req.body, {
    palengkeApiUrl: process.env.PALENGKE_API_URL,
    sourceLabel: "jobs.palengke.es"
  });
  res.json(ticket);
});

app.post("/api/marites/wanted", async (req, res) => {
  const post = await createWantedPost(req.body, {
    palengkeApiUrl: process.env.PALENGKE_API_URL,
    sourceLabel: "jobs.palengke.es"
  });
  res.json(post);
});
```

Python/FastAPI services should keep their small proxy endpoints but can mirror the same payload contract:

- `POST /api/marites/support`
- `POST /api/marites/wanted`

## Image

The default image URL is:

```txt
https://images.palengke.es/jobs/support-agent.png
```

The package also ships the exact production image at `@palengke/marites/support-agent.png`.

Production hash:

```txt
c464160a0e4d13615dd354c83cea97207ea186e6948dfb96e5c3413ec0c6110f
```
