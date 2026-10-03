// Word history is separate for each sync code and language pair.
const wordHistoryCache = new Map();

function wordHistoryKey(code = appState.syncCode) {
  return `${APP_PREFIX}_word_history_${code}`;
}

function readWordHistory(code = appState.syncCode) {
  if (wordHistoryCache.has(code)) {
    return wordHistoryCache.get(code);
  }

  const result = {
    data: { version: 1, pairs: {} },
    error: "",
    raw: null,
    blocked: false
  };

  try {
    result.raw = localStorage.getItem(wordHistoryKey(code));

    if (result.raw) {
      const data = JSON.parse(result.raw);

      if (
        data.version !== 1 ||
        !data.pairs ||
        typeof data.pairs !== "object" ||
        Array.isArray(data.pairs)
      ) {
        throw new Error("Invalid word history format.");
      }

      for (const pair of Object.values(data.pairs)) {
        if (
          !pair ||
          typeof pair !== "object" ||
          Array.isArray(pair)
        ) {
          throw new Error("Invalid word history.");
        }

        for (const row of Object.values(pair)) {
          if (
            !row ||
            typeof row.text !== "string" ||
            typeof row.answer !== "string" ||
            !Number.isSafeInteger(row.correct) ||
            row.correct < 0 ||
            !Number.isSafeInteger(row.mistakes) ||
            row.mistakes < 0 ||
            typeof row.lastPracticed !== "string" ||
            !Number.isFinite(Date.parse(row.lastPracticed))
          ) {
            throw new Error("Invalid word history entry.");
          }
        }
      }

      result.data = data;
    }
  } catch {
    result.blocked = Boolean(result.raw);
    result.error =
      "Word history could not be read. Download a backup " +
      "before making changes to browser storage.";
  }

  wordHistoryCache.set(code, result);
  return result;
}

function currentHistoryPair() {
  return `${learningLanguage}:${answerLanguage}`;
}

function getWordHistoryRows() {
  const history = readWordHistory();

  return Object.values(
    history.data.pairs[currentHistoryPair()] || {}
  );
}

function recordWordAnswer(word, correct) {
  const history = readWordHistory();
  if (history.blocked) return false;

  const key = currentHistoryPair();
  const pair =
    history.data.pairs[key] ||
    (history.data.pairs[key] = {});

  const old = Object.hasOwn(pair, word.id)
    ? pair[word.id]
    : null;

  const row = old || { correct: 0, mistakes: 0 };
  const field = correct ? "correct" : "mistakes";
  const count = row[field] + 1;

  if (!Number.isSafeInteger(count)) return false;

  pair[word.id] = {
    ...row,
    id: word.id,
    text: word.text,
    answer: word.answer,
    [field]: count,
    lastPracticed: new Date().toISOString()
  };

  try {
    localStorage.setItem(
      wordHistoryKey(),
      JSON.stringify(history.data)
    );

    history.error = "";
    return true;
  } catch {
    history.error =
      "New word history is only held in this open page. " +
      "Download a backup before closing it.";

    return false;
  }
}

function getWordProgressBackup() {
  const history = readWordHistory();

  return {
    scope: "this-device",
    code: appState.syncCode,
    ...history.data,
    storageError: history.error || null,
    unreadableOriginal: history.error ? history.raw : null
  };
}