# Tetiana Fedotova: photography portfolio

A plain HTML/CSS/JS site with no build step and nothing to install.
Double-click `index.html` to open it in your browser.

The Portraits and Black & White pages show the photos in one row, all the same
height, that scrolls sideways. Visitors can use the mouse wheel, a trackpad swipe,
the grey bar under the photos (drag or click it) or the ← → keys. On phones they
swipe. Order on the page = order in the editor, left to right.

## Changing the site yourself: `editor.html`

Open **`editor.html`** in **Microsoft Edge** or **Google Chrome** (double-click it,
or right-click → Open with → Edge). Then click **Choose website folder**, pick
this folder, and allow the browser to edit files when it asks.

| What | How |
|---|---|
| **Add photos** | Click **+ Add photos**, or drag photos from your computer onto the page. They're shrunk to 2000 px and saved as JPG automatically. |
| **Change the order** | Drag the tiles. Or select a photo and use **← Earlier / Later →**. |
| **Size** | Select a photo → **Full height** (same height as the others) or **Smaller** (about 70%). To make a photo wider or narrower, change its crop. |
| **Crop** | Select a photo → **Crop…** → pick a shape (Original, Free, 4:5, 2:3, 1:1, 3:2, 16:9), drag the frame, drag a corner to resize. Your original file is kept, so you can re-crop or **Remove crop** any time. |
| **Description / caption** | Description helps Google and screen readers; caption shows in full-screen view. |
| **Move or remove** | **Move to Black & White** (or back), or **Remove** (with Undo). |
| **Layout preview** | Switch from **Order** to **Layout preview** to see the sideways row as it will look. |
| **About page** | **About** tab: replace or crop your photo, edit the headline, bio and "Based in". |
| **Links** | **Links** tab: email, Instagram, LinkedIn, Facebook. Leave one empty to hide it. |

Nothing changes in the folder until you press **Save changes** (or Ctrl+S).
Then refresh the website tab to see the result.

**Good to know**
- The folder must be in a normal place such as **Documents**. Edge and Chrome refuse
  folders inside hidden system areas (like AppData).
- iPhone HEIC photos can't be added directly. Export them as JPG first.
- Removing a photo takes it off the site but leaves the file in `photos/`.
  Delete leftover files there by hand if you want to tidy up.

## The live site (GitHub Pages)

- Website: https://mesopotania.github.io/tetiana-fedotova/
- Repository: https://github.com/mesopotania/tetiana-fedotova

**To update the live site**
1. Make your changes in the editor and press **Save changes**.
2. Open **GitHub Desktop**. Your changes are listed on the left.
3. Type a short summary at the bottom left (e.g. "New photos"), click
   **Commit to main**, then **Push origin** at the top.
4. The website updates within a minute or two. Refresh it to check.

The editor is never uploaded (`.gitignore` keeps it on this computer only).
Optional later: connect your own domain (e.g. `tetianafedotova.com`, about
$10–15/year from any domain registrar) under the repository's Settings → Pages.

## Files

| File | What it is |
|---|---|
| `editor.html` | The visual editor (works on your computer only) |
| `config.js` | Your settings: photos, order, sizes, crops, About text, links. Written by the editor. |
| `index.html` | Portraits (home page) |
| `black-and-white.html` | Black & White gallery |
| `contact.html` | Info & Contact |
| `photos/` | Your images |
| `assets/` | Design and code (`style.css` holds colours, sizes and the wordmark spacing) |
| `.gitignore` | Keeps the editor off GitHub (and so off the public site) |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are |
| `_redirects` | Keeps the editor private if you ever use Netlify instead |
