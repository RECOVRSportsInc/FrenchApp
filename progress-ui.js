// Display history for the selected learning and answer languages.
function renderWordProgress() {
  const container = document.getElementById("word-history-body");
  if (!container) return;

  const history = readWordHistory();

  const rows = getWordHistoryRows().sort(
    (a, b) =>
      Date.parse(b.lastPracticed) -
      Date.parse(a.lastPracticed)
  );

  const correct = rows.reduce(
    (total, row) => total + row.correct,
    0
  );

  const mistakes = rows.reduce(
    (total, row) => total + row.mistakes,
    0
  );

  document.getElementById("words-practised").textContent =
    rows.length;

  document.getElementById("word-correct-total").textContent =
    correct;

  document.getElementById("word-mistake-total").textContent =
    mistakes;

  document.getElementById("history-pair").textContent =
    `${languageCatalog[learningLanguage].name} → ` +
    languageCatalog[answerLanguage].name;

  document.getElementById("history-status").textContent =
    history.error ||
    "Word history is saved on this device. " +
    "Cloud sync currently covers XP only.";

  document.getElementById("history-empty").hidden =
    rows.length > 0;

  document.getElementById("word-history-table").hidden =
    rows.length === 0;

  container.replaceChildren();

  for (const row of rows) {
    const tr = document.createElement("tr");
    const word = document.createElement("td");
    const label = document.createElement("strong");

    label.textContent = row.text;
    label.lang = learningLanguage;
    label.dir = languageCatalog[learningLanguage].direction;

    const meaning = document.createElement("span");
    meaning.textContent = row.answer;
    meaning.lang = answerLanguage;
    meaning.dir = languageCatalog[answerLanguage].direction;

    word.append(label, meaning);
    tr.appendChild(word);

    for (const count of [row.correct, row.mistakes]) {
      const td = document.createElement("td");
      td.textContent = count;
      tr.appendChild(td);
    }

    const date = document.createElement("td");
    const time = document.createElement("time");

    time.dateTime = row.lastPracticed;

    time.textContent = new Date(
      row.lastPracticed
    ).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    time.title = new Date(
      row.lastPracticed
    ).toLocaleString();

    date.appendChild(time);
    tr.appendChild(date);
    container.appendChild(tr);
  }
}