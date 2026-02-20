---
name: nano-banana-pro
description: "Generate/edit images with Nano Banana Pro (Gemini 3 Pro Image). Supports text-to-image + image-to-image with 1K/2K/4K resolution."
metadata: {"openclaw":{"emoji":"🍌","requires":{"bins":["python"],"env":["GEMINI_API_KEY"]}}}
---

# Nano Banana Pro Image Generation & Editing

Generate new images or edit existing ones using Google's Gemini 3 Pro Image API.

## Prerequisites

- `uv` package manager installed
- `GEMINI_API_KEY` environment variable set

## Usage

Run the script using absolute path (do NOT cd to skill directory first):

**Generate new image:**
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "your image description" --filename "output-name.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

**Edit existing image:**
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "editing instructions" --filename "output-name.png" --input-image "path/to/input.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

**Important:** Always run from the user's current working directory so images are saved where the user is working, not in the skill directory.

---

## Default Workflow (Draft → Iterate → Final)

Goal: Fast iteration without burning time on 4K until the prompt is correct.

### Draft (1K)
Quick feedback loop:
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "<draft prompt>" --filename "yyyy-mm-dd-hh-mm-ss-draft.png" --resolution 1K
```

### Iterate
Adjust prompt in small diffs; keep filename new per run. If editing: keep the same `--input-image` for every iteration until you're happy.

### Final (4K)
Only when prompt is locked:
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "<final prompt>" --filename "yyyy-mm-dd-hh-mm-ss-final.png" --resolution 4K
```

---

## Resolution Options

The Gemini 3 Pro Image API supports three resolutions (uppercase K required):

| Resolution | Size | Use Case |
|------------|------|----------|
| **1K** (default) | ~1024px | Drafts, quick iterations |
| **2K** | ~2048px | Normal quality |
| **4K** | ~4096px | Final high-resolution output |

### Resolution Mapping

Map user requests to API parameters:

| User Says | Use |
|-----------|-----|
| No mention of resolution | `1K` |
| "low resolution", "1080", "1080p", "1K" | `1K` |
| "2K", "2048", "normal", "medium resolution" | `2K` |
| "high resolution", "high-res", "hi-res", "4K", "ultra" | `4K` |

---

## API Key

The script checks for API key in this order:

1. `--api-key` argument (use if user provided key in chat)
2. `GEMINI_API_KEY` environment variable

If neither is available, the script exits with an error message.

---

## Preflight & Common Failures

### Preflight Checks
```bash
command -v uv                    # Must exist
test -n "$GEMINI_API_KEY"        # Or pass --api-key
test -f "path/to/input.png"      # If editing
```

### Common Failures

| Error | Fix |
|-------|-----|
| `Error: No API key provided.` | Set `GEMINI_API_KEY` or pass `--api-key` |
| `Error loading input image:` | Wrong path / unreadable file; verify `--input-image` |
| "quota/permission/403" errors | Wrong key, no access, or quota exceeded |

---

## Filename Generation

Generate filenames with the pattern: `yyyy-mm-dd-hh-mm-ss-name.png`

**Format:** `{timestamp}-{descriptive-name}.png`

- Timestamp: Current date/time in format `yyyy-mm-dd-hh-mm-ss` (24-hour format)
- Name: Descriptive lowercase text with hyphens
- Keep the descriptive part concise (1-5 words typically)
- Use context from user's prompt or conversation
- If unclear, use random identifier (e.g., `x9k2`, `a7b3`)

**Examples:**
- Prompt "A serene Japanese garden" → `2025-11-23-14-23-05-japanese-garden.png`
- Prompt "sunset over mountains" → `2025-11-23-15-30-12-sunset-mountains.png`
- Prompt "create an image of a robot" → `2025-11-23-16-45-33-robot.png`
- Unclear context → `2025-11-23-17-12-48-x9k2.png`

---

## Image Editing

When the user wants to modify an existing image:

1. Check if they provide an image path or reference an image in the current directory
2. Use `--input-image` parameter with the path to the image
3. The prompt should contain editing instructions (e.g., "make the sky more dramatic", "remove the person", "change to cartoon style")
4. Common editing tasks: add/remove elements, change style, adjust colors, blur background, etc.

---

## Prompt Handling

**For generation:** Pass user's image description as-is to `--prompt`. Only rework if clearly insufficient.

**For editing:** Pass editing instructions in `--prompt` (e.g., "add a rainbow in the sky", "make it look like a watercolor painting")

Preserve user's creative intent in both cases.

---

## Prompt Templates (High Hit-Rate)

Use templates when the user is vague or when edits must be precise.

### Generation Template
```
Create an image of: <subject>. Style: <style>. Composition: <camera/shot>. Lighting: <lighting>. Background: <background>. Color palette: <palette>. Avoid: <list>.
```

### Editing Template (Preserve Everything Else)
```
Change ONLY: <single change>. Keep identical: subject, composition/crop, pose, lighting, color palette, background, text, and overall style. Do not add new objects. If text exists, keep it unchanged.
```

---

## Output

- Saves PNG to current directory (or specified path if filename includes directory)
- Script outputs the full path to the generated image
- **Do not read the image back** - just inform the user of the saved path

---

## Examples

**Generate new image:**
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "A serene Japanese garden with cherry blossoms" --filename "2025-11-23-14-23-05-japanese-garden.png" --resolution 4K
```

**Edit existing image:**
```bash
uv run ~/.openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt "make the sky more dramatic with storm clouds" --filename "2025-11-23-14-25-30-dramatic-sky.png" --input-image "original-photo.jpg" --resolution 2K
```
