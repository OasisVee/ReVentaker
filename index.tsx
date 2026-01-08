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
import {
  CUSTOM_STYLES_ID,
  HOTKEY_CLASS_PREFIX,
  Modifiers,
  VIDEO_BACKGROUND_ID,
  WALLTAKER_BACKGROUND_ID,
} from "./modules/constants";
import { fetchBackgroundUrl } from "./modules/api";

let currentVideoUrl: string | null = null;
let isRecordingGlobalVentaker: boolean = false;
let backgroundDisabled: boolean = false;
let backgroundUpdateInterval: NodeJS.Timeout | null = null;
const cl = classNameFactory(HOTKEY_CLASS_PREFIX);

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

function setBackground(url: string) {
  if (backgroundDisabled) {
    console.log("Background is disabled, not setting video background.");
    return;
  }
  console.log(`Setting background to: ${url}`);

  document.documentElement.style.setProperty(
    "--reventaker-opacity",
    `${settings.store.opacity / 100}`,
  );

  if (url === currentVideoUrl) {
    console.log("Same video URL, continuing playback.");
    return;
  }

  currentVideoUrl = url;

  let videoElement = document.getElementById(
    VIDEO_BACKGROUND_ID,
  ) as HTMLVideoElement;

  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.id = VIDEO_BACKGROUND_ID;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = settings.store.muteVideos;
    videoElement.style.position = "fixed";
    videoElement.style.top = "0";
    videoElement.style.left = "0";
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.objectFit = "contain";

    videoElement.style.zIndex = "-1";
    videoElement.style.opacity = "1";
    document.body.appendChild(videoElement);
  }

  if (videoElement) {
    document.documentElement.style.removeProperty("--background-image");
  }

  videoElement.src = url;
  videoElement.style.display = "block";
}

function setBackgroundImage(url: string) {
  if (backgroundDisabled) {
    console.log("Background is disabled, not setting image background.");
    return;
  }
  console.log(`Setting background to: ${url}`);

  document.documentElement.style.setProperty(
    "--reventaker-opacity",
    `${settings.store.opacity / 100}`,
  );

  const videoElement = document.getElementById(VIDEO_BACKGROUND_ID);
  if (videoElement) {
    videoElement.remove();
    currentVideoUrl = null;
  }
  document.documentElement.style.setProperty(
    "--background-image",
    `url('${url}')`,
  );

  const styleElement = document.getElementById(WALLTAKER_BACKGROUND_ID);
  if (styleElement) {
    styleElement.remove();
  }
}

function applyStyles() {
  let styleElement = document.getElementById(CUSTOM_STYLES_ID);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = CUSTOM_STYLES_ID;
    document.head.appendChild(styleElement);
  }

  styleElement.innerHTML = cssContent;
}

function startBackgroundUpdate(linkId: string, interval: number) {
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

  updateBackground().catch((error) => {
    console.error("Failed to perform initial background update:", error);
  });
  backgroundUpdateInterval = setInterval(() => {
    updateBackground().catch((error) => {
      console.error("Failed to perform periodic background update:", error);
    });
  }, interval * 1000); // Convert seconds to milliseconds
}

export default definePlugin({
  name: "Re-Ventaker",
  description:
    "Plugin that changes your Discord background to one from Walltaker",
  authors: [
    { name: "Lumi", id: 633026209479000065n },
    { name: "mimikurama", id: 967152107922792478n },
  ],
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
    backgroundDisabled = hideByDefault;
    startBackgroundUpdate(link, intervalRate);
    applyStyles();
    document.addEventListener("keydown", this.event);
  },

  stop() {
    console.log("Re-Ventaker plugin stopped.");
    document.removeEventListener("keydown", this.event);
    if (backgroundUpdateInterval) clearInterval(backgroundUpdateInterval);
    const videoElement = document.getElementById(VIDEO_BACKGROUND_ID);
    if (videoElement) {
      videoElement.remove();
    }
    document.documentElement.style.removeProperty("--background-image");
    document.documentElement.style.removeProperty("--reventaker-opacity");
    currentVideoUrl = null;
    backgroundDisabled = false;
  },

  event(e: KeyboardEvent) {
    console.log("Keydown event detected:", e);

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
    backgroundDisabled = !backgroundDisabled;
    const videoElement = document.getElementById(
      VIDEO_BACKGROUND_ID,
    ) as HTMLVideoElement;

    if (backgroundDisabled) {
      if (videoElement) {
        videoElement.style.display = "none";
        videoElement.pause();
      }
      document.documentElement.style.removeProperty("--background-image");
    } else {
      const isVideo =
        currentVideoUrl &&
        (currentVideoUrl.endsWith(".webm") || currentVideoUrl.endsWith(".mp4"));
      if (videoElement && isVideo) {
        videoElement.style.display = "block";
        videoElement.currentTime = 0;
        videoElement.play();
      } else if (currentVideoUrl && !isVideo) {
        document.documentElement.style.setProperty(
          "--background-image",
          `url('${currentVideoUrl}')`,
        );
      }
      if (!currentVideoUrl) {
        const { link, intervalRate } = settings.store;
        startBackgroundUpdate(link, intervalRate < 30 ? 30 : intervalRate);
      }
    }
  },
});
