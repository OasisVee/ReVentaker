<div align="center">

# Re-Ventaker (Originally Ventaker by Eldrazi)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Vencord Plugin](https://img.shields.io/badge/Vencord-UserPlugin-7289DA.svg)](https://vencord.dev/)

**Bring [Walltaker](https://walltaker.joi.how/) to your Discord client.**
<br>
_Sync your background seamlessly with support for both high-quality images and videos._

[Features](#-features) • [Installation](#-installation) • [Configuration](#-configuration)

---

</div>

## Features

| Feature             | Description                                                             |
| :------------------ | :---------------------------------------------------------------------- |
| **Universal Media** | Full support for **Images** (PNG, JPG, GIF) and **Videos** (MP4, WEBM). |
| **Live Sync**       | Automatically polls for updates at your preferred interval.             |
| **Full Control**    | Adjust **Opacity**, toggle **Audio**, and customize **Keybinds**.       |
| **Performance**     | Optimized fetching and rendering to keep Discord smooth.                |
| **Privacy Mode**    | Hide the background instantly with a hotkey or start hidden by default. |

<br>

## Installation

> **Note:** UserPlugins require Vencord to be installed from source. If you do not have it installed from source follow this [guide](https://docs.vencord.dev/installing/)

1. **Locate UserPlugins Directory**
   Navigate to your local Vencord source folder:

   ```sh
   Vencord/src/userplugins/
   ```

2. **Install Re-Ventaker**
   Download or clone this repository into the `userplugins` folder so it looks like `Vencord/src/userplugins/reVentaker`.

3. **Build & Inject**
   Open your terminal in the Vencord root directory and run:

   ```sh
   pnpm build && pnpm inject
   ```

4. **Activate**
   Restart Discord, open **Settings** → **Vencord** → **Plugins**, and enable **Re-Ventaker**.

<br>

## Configuration

Click the gear icon on the plugin card to customize your experience.

| Setting             | Description                                              | Default        |
| :------------------ | :------------------------------------------------------- | :------------- |
| **Link ID**         | Your unique ID from `walltaker.joi.how/links/<ID>`.      | _Required_     |
| **Update Interval** | Seconds between checks for new backgrounds. _(Min: 30s)_ | `30`           |
| **Opacity**         | Input field (0-100) controlling background transparency. | `80`           |
| **Mute Videos**     | Mutes audio playback for video wallpapers.               | `On`           |
| **Hide by Default** | Starts Discord with the background hidden.               | `Off`          |
| **Toggle Keybind**  | Hotkey to instantly show/hide the background.            | `Ctrl+Shift+V` |

<br>

## Credits

- **Original Author:** [Eldrazi](https://github.com/Eldrazi)
- **Original plugin:** [Ventaker](https://github.com/Eldrazi/Ventaker)
- **Maintainers:** [OasisVee](https://github.com/OasisVee)
- **Inspiration:** [Lycraon's Walltaker BBD Plugin](https://github.com/Lycraon/Lycraons-Walltaker-BBD-plugin)
