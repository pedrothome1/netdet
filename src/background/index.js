import {logEventHandlers, startRecording, stopRecording} from "./popup-requests"

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install" && details.reason !== "update") {
    return
  }

  const initialState = {
    recording: false,
    recordingName: "",
    urlPatterns: ["<all_urls>"],
  }

  const data = await chrome.storage.local.get(null)

  Object.entries(initialState).forEach(([key, val]) => {
    if (typeof data[key] !== "undefined") {
      delete initialState[key]
    }
  })

  if (Object.keys(initialState).length > 0) {
    await chrome.storage.local.set(initialState)
  }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg.netdet) return

  const handler = {
    log_event_handlers: logEventHandlers,
    start_recording: startRecording,
    stop_recording: stopRecording,
  }[msg.netdet.request]

  if (handler) {
    handler(msg.netdet.request)
    sendResponse(true)

    return
  }

  sendResponse(false)
})
