// Used by both the browser and the storage service. No provider dependencies.
(function (root) {
  const badKeys = new Set(['__proto__', 'constructor', 'prototype']);
  const languages = new Set(['en', 'fr', 'frCA', 'pl', 'es', 'it', 'ar']);
  const topics = new Set(['work', 'healthcare', 'sports', 'travel', 'home', 'gym', 'phrases', 'slang']);
  const lessons = ['words', 'sentences', 'mixed'];
  const dict = value => value && typeof value === 'object' && !Array.isArray(value);
  function check(ok, message = 'Invalid learning progress.') { if (!ok) throw new Error(message); }
  function entries(value) {
    check(dict(value));
    const rows = Object.entries(value);
    check(rows.every(([key]) => key.length <= 240 && !badKeys.has(key)));
    return rows;
  }
  function count(n) { check(Number.isSafeInteger(n) && n >= 0 && n <= 1000000000); return n; }
  function stamp(s) { check(typeof s === 'string' && s.length <= 40 && Number.isFinite(Date.parse(s))); }
  function pair(key) {
    const codes = key.split(':'); check(codes.length === 2 && codes.every(code => languages.has(code)) && codes[0] !== codes[1]);
  }
  function date(key) {
    check(/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Date.parse(key)) && new Date(key).toISOString().slice(0, 10) === key);
  }
  function roadmap(data) {
    check(data?.version === 2);
    for (const [key, value] of entries(data.pairs)) {
      pair(key);
      for (const [category, tiers] of entries(value)) {
        check(topics.has(category) && Array.isArray(tiers) && tiers.length === 3);
        tiers.forEach((tier, index) => {
          check(dict(tier) && Number.isInteger(tier.best) && tier.best >= 0 && tier.best <= 20 && typeof tier.passed === 'boolean');
          check(!tier.passed || tier.best >= 15);
          check(dict(tier.lessons) && lessons.every(id => typeof tier.lessons[id] === 'boolean'));
          if (index && (tier.passed || lessons.some(id => tier.lessons[id]))) check(tiers[index - 1].passed);
          if (!tier.passed) {
            check(!tier.lessons.sentences || tier.lessons.words);
            check(!tier.lessons.mixed || tier.lessons.sentences);
          }
        });
      }
    }
    return data;
  }
  function metrics(row) {
    count(row.correct); count(row.mistakes);
    check(Boolean(row._baseline) === Boolean(row._devices), 'Incomplete word counters.');
    const base = row._baseline || {correct: row.correct, mistakes: row.mistakes};
    check(dict(base)); count(base.correct); count(base.mistakes);
    const devices = row._devices || {};
    let correct = base.correct, mistakes = base.mistakes;
    for (const [id, value] of entries(devices)) {
      check(/^[a-f0-9]{32}$/.test(id) && dict(value));
      correct += count(value.correct); mistakes += count(value.mistakes);
    }
    count(correct); count(mistakes);
    if (row._baseline) check(correct === row.correct && mistakes === row.mistakes, 'Word counters do not agree.');
    return {_baseline: {...base}, _devices: structuredClone(devices)};
  }
  function history(data) {
    check(data?.version === 1);
    for (const [key, value] of entries(data.pairs)) {
      pair(key);
      for (const [id, row] of entries(value)) {
        check(dict(row) && id.length > 0 && typeof row.text === 'string' && row.text.length <= 2000 &&
          typeof row.answer === 'string' && row.answer.length <= 2000);
        stamp(row.lastPracticed); metrics(row);
      }
    }
    return data;
  }
  function activity(data) {
    check(data?.version === 1);
    for (const [day, value] of entries(data.days)) {
      date(day); check(dict(value));
      for (const [id, visit] of entries(value.visits)) check(/^[a-f0-9]{32}$/.test(id) && visit === true);
      for (const [id, event] of entries(value.sessions)) {
        check(/^[a-f0-9-]{32,40}$/.test(id) && dict(event));
        check(['lesson', 'test', 'round', 'conversation'].includes(event.kind));
        check(count(event.answers) > 0 && count(event.correct) <= event.answers);
        check(event.goal >= 1 && event.goal <= 3 && Number.isInteger(event.goal));
        pair(event.pair); stamp(event.at);
      }
    }
    const setting = data.setting;
    check(dict(setting) && [1, 2, 3].includes(setting.goal)); stamp(setting.at);
    check(typeof setting.device === 'string' && /^[a-f0-9]{32}$/.test(setting.device));
    return data;
  }
  function snapshot(data) {
    check(data?.version === 1); roadmap(data.roadmap); history(data.history); activity(data.activity);
    return data;
  }
  root.ProgressSchema = {check, entries, count, stamp, pair, date, roadmap, history, activity, metrics, snapshot};
  if (typeof module !== 'undefined') module.exports = root.ProgressSchema;
})(globalThis);
