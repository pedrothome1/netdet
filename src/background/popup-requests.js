import config from "./config"
import {
  onBeforeRequest,
  onBeforeSendHeaders,
  onHeadersReceived,
  onCompleted,
} from "./web-requests"

export const logEventHandlers = (_) => {
  if (chrome.webRequest.onBeforeRequest.hasListener(onBeforeRequest)) {
    console.log("onBeforeRequest")
  }
  if (chrome.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeaders)) {
    console.log("onBeforeSendHeaders")
  }
  if (chrome.webRequest.onHeadersReceived.hasListener(onHeadersReceived)) {
    console.log("onHeadersReceived")
  }
  if (chrome.webRequest.onCompleted.hasListener(onCompleted)) {
    console.log("onCompleted")
  }
  console.log("Done!")
}

export const startRecording = async (_) => {
  const {types} = config
  const {urlPatterns: urls} = await chrome.storage.local.get("urlPatterns")

  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    {urls, types},
    ["requestBody", "extraHeaders"]
  )

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    {urls, types},
    ["requestHeaders", "extraHeaders"]
  )

  chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    {urls, types},
    ["responseHeaders", "extraHeaders"]
  )

  chrome.webRequest.onCompleted.addListener(onCompleted, {
    urls,
    types,
  })

  chrome.storage.local.set({
    recording: true,
    recordingName: new Date().toLocaleString("pt-BR"),
  })
}

export const stopRecording = (_) => {
  chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest)
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders)
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived)
  chrome.webRequest.onCompleted.removeListener(onCompleted)

  chrome.storage.local.set({
    recording: false,
    recordingName: "",
  })
}
