;(async () => {
  // Initializations
  const recordingKeyPattern = /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/

  const btnStart = document.querySelector("#start-recording")
  const btnStop = document.querySelector("#stop-recording")
  const btnShowStorageLocal = document.querySelector("#show-storage-local")
  const textareaUrlPatterns = document.querySelector("#url-patterns")
  const storageLocalPre = document.querySelector("#storage-local-view")
  const recordingsTable = document.querySelector("#recordings-table")

  // Dom manipulation
  const newRecordingsTableRow = (dateTime, requestCount) => {
    const tr = document.createElement("tr")
    const dateTimeTd = document.createElement("td")
    const requestsTd = document.createElement("td")
    const actionsTd = document.createElement("td")
    const curlBtn = document.createElement("button")
    const deleteBtn = document.createElement("button")

    tr.appendChild(dateTimeTd)
    tr.appendChild(requestsTd)
    tr.appendChild(actionsTd)
    actionsTd.appendChild(curlBtn)
    actionsTd.appendChild(deleteBtn)

    requestsTd.classList.add("requests")
    actionsTd.classList.add("actions")
    curlBtn.classList.add("curl")
    deleteBtn.classList.add("delete")

    tr.dataset.key = dateTime
    curlBtn.dataset.key = dateTime
    deleteBtn.dataset.key = dateTime

    dateTimeTd.textContent = dateTime
    requestsTd.textContent = requestCount

    curlBtn.addEventListener("click", async (event) => {
      const {[curlBtn.dataset.key]: recording} = await chrome.storage.local.get(curlBtn.dataset.key)
      console.log(recording)

      const curlRequests = []
      for (const req of recording.requests) {
        const curl = [`curl -vsL -X${req.method}`]
        for (const header of req.requestHeaders) {
          curl.push(`-H '${header.name}: ${header.value}'`)
        }
        if (req.requestBody) {
          curl.push(`-d '${JSON.stringify(req.requestBody)}'`)
        }
        curl.push(`'${req.url}'`)

        curlRequests.push(curl.join(" \\\n"))
      }

      navigator.clipboard.writeText(curlRequests.join("\n\n"))
    })

    deleteBtn.addEventListener("click", (event) => {
      if (confirm("Are you sure?")) {
        const btn = event.target
        chrome.storage.local.remove(btn.dataset.key)
      }
    })

    return tr
  }

  // Event handling
  btnStart.addEventListener("click", (event) => {
    btnStart.classList.add("loading")

    chrome.runtime.sendMessage({
      netdet: {request: "start_recording"},
    })
  })

  btnStop.addEventListener("click", (event) => {
    btnStop.classList.add("loading")

    chrome.runtime.sendMessage({
      netdet: {request: "stop_recording"},
    })
  })

  btnShowStorageLocal.addEventListener("click", async (event) => {
    btnShowStorageLocal.classList.add("loading")

    if (storageLocalPre.style.display !== "block") {
      const allContent = await chrome.storage.local.get()
      const jsonStr = JSON.stringify(allContent, null, 2)

      storageLocalPre.textContent = jsonStr
      storageLocalPre.style.display = "block"
    } else {
      storageLocalPre.style.display = "none"
    }

    btnShowStorageLocal.classList.remove("loading")
  })

  textareaUrlPatterns.addEventListener("blur", (event) => {
    chrome.storage.local.set({
      urlPatterns: textareaUrlPatterns.value.split("\n").map(x => x.trim()).filter(x => !!x),
    })
  })

  const handleRecordingChange = (isRecording) => {
    btnStart.classList.remove("loading")
    btnStop.classList.remove("loading")

    btnStart.style.display = isRecording ? "none" : "inline-block"
    btnStop.style.display = isRecording ? "inline-block" : "none"
  }

  const handleRecordingEntryChange = (key, oldValue, newValue) => {
    if (!newValue) {
      document.querySelector(`tr[data-key='${key}']`).remove()
      return
    }

    if (!oldValue) {
      recordingsTable.tBodies[0].appendChild(
        newRecordingsTableRow(key, newValue.requests.length)
      )
      return
    }

    document.querySelector(`tr[data-key='${key}'] td.requests`).textContent =
      newValue.requests.length
  }

  chrome.storage.onChanged.addListener((changes) => {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
      if (key === "recording") {
        handleRecordingChange(newValue)
        continue
      }

      // a recording entry
      if (recordingKeyPattern.test(key)) {
        handleRecordingEntryChange(key, oldValue, newValue)
      }
    }
  })

  // Run on popup render
  const allContent = await chrome.storage.local.get(null)
  const {recording} = allContent

  if (typeof recording === "boolean") {
    handleRecordingChange(recording)
  } else {
    await chrome.storage.local.set({recording: false})
  }

  Object.entries(allContent).forEach(([key, val]) => {
    if (typeof val === "object" && val && val.requests instanceof Array) {
      handleRecordingEntryChange(key, null, val)
    }
  })

  textareaUrlPatterns.value = allContent.urlPatterns.join("\n")
})()
