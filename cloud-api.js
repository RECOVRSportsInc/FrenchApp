// Requests and response validation for the existing XP service.

async function requestCloud(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    const body = await response.text();
    let data;

    try {
      data = JSON.parse(body);
    } catch {
      const error = new Error(
        `HTTP ${response.status}: the server returned a non-JSON response.`
      );

      error.status = response.status;
      throw error;
    }

    if (!response.ok || data.error) {
      const error = new Error(
        `HTTP ${response.status}: ` +
        (data.error || data.message || "Cloud request failed.")
      );

      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The cloud service did not respond within 15 seconds."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseCloudXP(value) {
  if (
    value === undefined ||
    value === null ||
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    throw new Error(
      "The cloud service returned an invalid XP value."
    );
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(
      "The cloud service returned an invalid XP value."
    );
  }

  return number;
}

async function getCloudXP(code) {
  const key = encodeURIComponent(`${APP_PREFIX}_${code}`);
  const data = await requestCloud(`${API_BASE}/get/${key}`);

  return parseCloudXP(data.value);
}

async function saveToCloud(code, value) {
  const key = encodeURIComponent(`${APP_PREFIX}_${code}`);

  const data = await requestCloud(
    `${API_BASE}/set/${key}?value=${value}`
  );

  if (parseCloudXP(data.value) !== value) {
    throw new Error(
      "The server did not confirm the expected XP value."
    );
  }
}