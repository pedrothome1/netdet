import config from "./config"

const trips = {}

export const onBeforeRequest = (details) => {
  trips[details.requestId] = {}

  trips[details.requestId].method = details.method
  trips[details.requestId].url = details.url
  trips[details.requestId].requestBody = details.requestBody
  trips[details.requestId].type = details.type
  trips[details.requestId].timeStamp = details.timeStamp
}

export const onBeforeSendHeaders = (details) => {
  trips[details.requestId].requestHeaders = details.requestHeaders
}

export const onHeadersReceived = (details) => {
  trips[details.requestId].responseHeaders = details.responseHeaders
  trips[details.requestId].statusCode = details.statusCode
}

export const onCompleted = (details) => {
  if (!config.includeMethods.includes(details.method)) {
    return
  }

  const trip = (() => {
    const trip = trips[details.requestId]

    if (!trip.requestBody || trip.requestBody.error) {
      return trip
    }

    if (trip.requestBody.formData) {
      trip.requestBody = trip.requestBody.formData
      return trip
    }

    let rawStr
    const decoder = new TextDecoder()

    try {
      rawStr = decoder.decode(trip.requestBody.raw[0].bytes)
    } catch (e) {
      delete trip.requestBody
      return trip
    }

    try {
      trip.requestBody = JSON.parse(rawStr)
      return trip
    } catch (e) {
      //
    }

    trip.requestBody = rawStr

    return trip
  })()

  chrome.storage.local
    .get(["recordingName"])
    .then((result) =>
      chrome.storage.local.get([result.recordingName, "recordingName"])
    )
    .then((result) => {
      let recording
      const recordingName = result.recordingName
      delete result.recordingName

      const entries = Object.entries(result)

      if (entries.length === 0) {
        recording = {requests: []}
      } else {
        ;[, recording] = entries[0]
      }

      recording.requests.push(trip)

      return chrome.storage.local.set({
        [recordingName]: recording,
      })
    })
}
