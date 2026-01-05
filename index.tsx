/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import cssContent from "./style.css";
import { useState } from "@webpack/common";
import { classNameFactory } from "@api/Styles";

let currentVideoUrl = null;
let isRecordingGlobalVentaker: boolean = false;
let backgroundDisabled: boolean = false;
let backgroundUpdateInterval: any = null;
const cl = classNameFactory("ventaker-hotkey-");

// Define the settings for the plugin
const settings = definePluginSettings({
  link: {
    type: OptionType.STRING,
    description: "Enter the link ID to connect your background to",
    restartNeeded: true,
  },
  intervalRate: {
    type: OptionType.NUMBER,
    description:
      "The rate (in seconds) at which to check for new backgrounds. A minimum of 30 seconds is enforced to reduce server strain",
    default: 30,
    restartNeeded: true,
  },
  muteVideos: {
    type: OptionType.BOOLEAN,
    description: "Mute audio for videos",
    default: true,
    restartNeeded: true,
  },
  hideByDefault: {
    type: OptionType.BOOLEAN,
    description:
      "Hide background by default, show only after pressing keybind.",
    default: false,
    restartNeeded: true,
  },
  opacity: {
    type: OptionType.NUMBER,
    description: "Background opacity, from 0 to 100 (100 is opaque).",
    default: 80,
    restartNeeded: true,
  },
  disableKeybind: {
    description: "Hotkey to toggle the background on/off.",
    type: OptionType.COMPONENT,
    default: ["Control", "Shift", "V"],
    component: () => {
      const [isRecording, setIsRecording] = useState(false);

      const recordKeybind = (setIsRecording: (value: boolean) => void) => {
        let currentKeys: Set<string> = new Set();
        let recordedKeys: string[] = [];

        const keydownListener = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();

          const key = e.key;
          if (!currentKeys.has(key)) {
            currentKeys.add(key);
            recordedKeys = Array.from(currentKeys);
          }
        };

        const keyupListener = (e: KeyboardEvent) => {
          e.preventDefault();
          e.stopPropagation();

          currentKeys.delete(e.key);
          if (currentKeys.size === 0 && recordedKeys.length > 0) {
            settings.store.disableKeybind = recordedKeys.map((key) =>
              key.toLowerCase(),
            );
            stopRecording();
          }
        };

        const stopRecording = () => {
          setIsRecording(false);
          isRecordingGlobalVentaker = false;
          document.removeEventListener("keydown", keydownListener);
          document.removeEventListener("keyup", keyupListener);
        };

        setIsRecording(true);
        isRecordingGlobalVentaker = true;
        currentKeys.clear();
        recordedKeys = [];

        document.addEventListener("keydown", keydownListener);
        document.addEventListener("keyup", keyupListener);
      };

      return (
        <>
          <div
            className={cl("key-recorder-container")}
            onClick={() => recordKeybind(setIsRecording)}
          >
            <div
              className={`${cl("key-recorder")} ${isRecording ? cl("recording") : ""}`}
            >
              {settings.store.disableKeybind
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" + ")}
              <button
                className={`${cl("key-recorder-button")} ${isRecording ? cl("recording-button") : ""}`}
                disabled={isRecording}
              >
                {isRecording ? "Recording..." : "Record keybind"}
              </button>
            </div>
          </div>
        </>
      );
    },
  },
});

// Function to fetch the background URL from Walltaker
async function fetchBackgroundUrl(linkId) {
  const url = `https://walltaker.joi.how/links/${linkId}.json`;
  try {
    console.log(`Fetching background URL from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch background");
    const data = await response.json();
    console.log("Fetched data:", data);
    return data.post_url; // Assuming the JSON response has a 'post_url' property
  } catch (error) {
    console.error("Error fetching background:", error);
    return null;
  }
}

function setBackground(url) {
  if (backgroundDisabled) {
    console.log("Background is disabled, not setting video background.");
    return;
  }
  console.log(`Setting background to: ${url}`);

  document.documentElement.style.setProperty(
    "--reventaker-opacity",
    `${settings.store.opacity / 100}`,
  );

  // Check if the URL is the same as the current video URL
  if (url === currentVideoUrl) {
    console.log("Same video URL, continuing playback.");
    return;
  }

  currentVideoUrl = url;

  let videoElement = document.getElementById(
    "walltaker-video-background",
  ) as HTMLVideoElement;

  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.id = "walltaker-video-background";
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = settings.store.muteVideos;
    videoElement.style.position = "fixed";
    videoElement.style.top = "0";
    videoElement.style.left = "0";
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.objectFit = "cover";
    videoElement.style.zIndex = "-1";
    videoElement.style.opacity = "1";
    document.body.appendChild(videoElement);
  }

  if (videoElement) {
    // Also ensure to clear the CSS background property when a video is set
    document.documentElement.style.removeProperty("--background-image");
  }

  videoElement.src = url;
  videoElement.style.display = "block";
}

// Function to set the background in the Discord client
function setBackgroundImage(url) {
  if (backgroundDisabled) {
    console.log("Background is disabled, not setting image background.");
    return;
  }
  console.log(`Setting background to: ${url}`);

  document.documentElement.style.setProperty(
    "--reventaker-opacity",
    `${settings.store.opacity / 100}`,
  );

  // Remove existing video element if any
  const videoElement = document.getElementById("walltaker-video-background");
  if (videoElement) {
    videoElement.remove();
    currentVideoUrl = null; // Reset the current video URL
  }
  document.documentElement.style.setProperty(
    "--background-image",
    `url('${url}')`,
  );

  // Remove old style element for cleanup
  const styleElement = document.getElementById("walltaker-background");
  if (styleElement) {
    styleElement.remove();
  }
}

// Function to apply additional CSS styles
function applyStyles() {
  let styleElement = document.getElementById("ventaker-custom-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "ventaker-custom-styles";
    document.head.appendChild(styleElement);
  }

  // Pretty shit time :3
  styleElement.innerHTML = cssContent;
}

// Function to periodicall update the background
function startBackgroundUpdate(linkId, interval) {
  if (backgroundUpdateInterval) clearInterval(backgroundUpdateInterval);

  async function updateBackground() {
    const backgroundUrl = await fetchBackgroundUrl(linkId);
    if (backgroundUrl) {
      if (backgroundUrl.endsWith(".webm") || backgroundUrl.endsWith(".mp4")) {
        setBackground(backgroundUrl);
      } else {
        setBackgroundImage(backgroundUrl);
      }
    }
  }

  updateBackground(); // Initial update
  backgroundUpdateInterval = setInterval(updateBackground, interval * 1000); // Convert seconds to milliseconds
}

// Plugin initialization
export default definePlugin({
  name: "Re-Ventaker",
  description:
    "Plugin that changes your Discord background to one from Walltaker",
  authors: [{ name: "Lumi", id: 633026209479000065n }],
  settings,
  startAt: StartAt.DOMContentLoaded,
  async start() {
    console.log("Re-Ventaker plugin started.");
    console.log("Plugin loaded with settings:", settings);
    const { link, hideByDefault } = settings.store;
    var { intervalRate } = settings.store;
    if (intervalRate < 30) {
      intervalRate = 30;
    }
    document.documentElement.style.setProperty(
      "--reventaker-opacity",
      `${settings.store.opacity / 100}`,
    );
    backgroundDisabled = hideByDefault; // Initialize backgroundDisabled based on hideByDefault setting
    startBackgroundUpdate(link, intervalRate);
    applyStyles();
    document.addEventListener("keydown", this.event);
  },

  stop() {
    console.log("Re-Ventaker plugin stopped.");
    document.removeEventListener("keydown", this.event);
    if (backgroundUpdateInterval) clearInterval(backgroundUpdateInterval);
    const videoElement = document.getElementById("walltaker-video-background");
    if (videoElement) {
      videoElement.remove();
    }
    document.documentElement.style.removeProperty("--background-image");
    document.documentElement.style.removeProperty("--reventaker-opacity");
    currentVideoUrl = null;
    backgroundDisabled = false; // Reset backgroundDisabled when plugin stops
  },

  event(e: KeyboardEvent) {
    console.log("Keydown event detected:", e);
    enum Modifiers {
      control = "ctrlKey",
      shift = "shiftKey",
      alt = "altKey",
      meta = "metaKey",
    }

    const { disableKeybind } = settings.store;
    const pressedKey = e.key.toLowerCase();

    if (isRecordingGlobalVentaker) return;

    for (let i = 0; i < disableKeybind.length; i++) {
      const lowercasedRequiredKey = disableKeybind[i].toLowerCase();

      if (
        lowercasedRequiredKey in Modifiers &&
        !e[Modifiers[lowercasedRequiredKey]]
      ) {
        return;
      }

      if (
        !(lowercasedRequiredKey in Modifiers) &&
        pressedKey !== lowercasedRequiredKey
      ) {
        return;
      }
    }

    console.log("Hotkey matched! Toggling background.");
    // Hotkey pressed, toggle background visibility
    backgroundDisabled = !backgroundDisabled;
    const videoElement = document.getElementById(
      "walltaker-video-background",
    ) as HTMLVideoElement;

    if (backgroundDisabled) {
      if (videoElement) {
        videoElement.style.display = "none";
        videoElement.pause();
      }
      document.documentElement.style.removeProperty("--background-image");
    } else {
      // Re-enable background, re-fetch if necessary
      const isVideo =
        currentVideoUrl &&
        (currentVideoUrl.endsWith(".webm") || currentVideoUrl.endsWith(".mp4"));
      if (videoElement && isVideo) {
        videoElement.style.display = "block";
        videoElement.currentTime = 0; // Restart video from the beginning
        videoElement.play();
      } else if (currentVideoUrl && !isVideo) {
        // Re-apply image background
        document.documentElement.style.setProperty(
          "--background-image",
          `url('${currentVideoUrl}')`,
        );
      }
      // If no currentUrl, re-fetch. This scenario might happen if the keybind was pressed before first fetch.
      if (!currentVideoUrl) {
        const { link, intervalRate } = settings.store;
        startBackgroundUpdate(link, intervalRate < 30 ? 30 : intervalRate);
      }
    }
  },
});
