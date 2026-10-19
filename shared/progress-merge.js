(function (root) {
  const S = root.ProgressSchema;
  const copy = value => structuredClone(value);
  function empty(device, at = '1970-01-01T00:00:00.000Z') {
    return {version: 1, roadmap: {version: 2, pairs: {}}, history: {version: 1, pairs: {}},
      activity: {version: 1, days: {}, setting: {goal: 1, at, device}}};
  }
  function mergeRoadmap(a, b) {
    const out = copy(a);
    for (const [pair, topics] of S.entries(b.pairs)) {
      out.pairs[pair] ||= {};
      for (const [topic, tiers] of S.entries(topics)) {
        if (!out.pairs[pair][topic]) { out.pairs[pair][topic] = copy(tiers); continue; }
        tiers.forEach((tier, index) => {
          const old = out.pairs[pair][topic][index];
          old.best = Math.max(old.best, tier.best); old.passed ||= tier.passed;
          for (const id of ['words', 'sentences', 'mixed']) old.lessons[id] ||= tier.lessons[id];
        });
      }
    }
    return out;
  }
  function normalizeRow(row) { return {...copy(row), ...S.metrics(row)}; }
  function mergeRow(a, b) {
    const left = normalizeRow(a), right = normalizeRow(b);
    const newest = [left, right].sort((x, y) => x.lastPracticed.localeCompare(y.lastPracticed) || JSON.stringify(x).localeCompare(JSON.stringify(y))).at(-1);
    const row = {...newest, _baseline: {}, _devices: {}};
    for (const field of ['correct', 'mistakes']) row._baseline[field] = Math.max(left._baseline[field], right._baseline[field]);
    for (const id of new Set([...Object.keys(left._devices), ...Object.keys(right._devices)])) {
      row._devices[id] = {};
      for (const field of ['correct', 'mistakes']) row._devices[id][field] = Math.max(left._devices[id]?.[field] || 0, right._devices[id]?.[field] || 0);
    }
    for (const field of ['correct', 'mistakes']) {
      row[field] = row._baseline[field] + Object.values(row._devices).reduce((sum, device) => sum + device[field], 0);
      S.count(row[field]);
    }
    return row;
  }
  function mergeHistory(a, b) {
    const out = copy(a);
    for (const [pair, rows] of S.entries(out.pairs)) for (const [id, row] of S.entries(rows)) out.pairs[pair][id] = normalizeRow(row);
    for (const [pair, rows] of S.entries(b.pairs)) {
      out.pairs[pair] ||= {};
      for (const [id, row] of S.entries(rows)) out.pairs[pair][id] = out.pairs[pair][id] ? mergeRow(out.pairs[pair][id], row) : normalizeRow(row);
    }
    return out;
  }
  function mergeActivity(a, b) {
    const out = copy(a);
    for (const [day, value] of S.entries(b.days)) {
      const dest = out.days[day] ||= {visits: {}, sessions: {}};
      Object.assign(dest.visits, value.visits);
      for (const [id, event] of S.entries(value.sessions)) {
        // Immutable session IDs make retries and repeated result rendering harmless.
        const previous = dest.sessions[id];
        dest.sessions[id] = copy(previous && JSON.stringify(previous) < JSON.stringify(event) ? previous : event);
      }
    }
    const order = setting => setting.at + ':' + setting.device + ':' + setting.goal;
    out.setting = copy(order(a.setting) >= order(b.setting) ? a.setting : b.setting);
    return out;
  }
  function merge(a, b) {
    S.snapshot(a); S.snapshot(b);
    return S.snapshot({version: 1, roadmap: mergeRoadmap(a.roadmap, b.roadmap),
      history: mergeHistory(a.history, b.history), activity: mergeActivity(a.activity, b.activity)});
  }
  function increment(row, correct, device) {
    const meta = S.metrics(row), value = meta._devices[device] ||= {correct: 0, mistakes: 0};
    value[correct ? 'correct' : 'mistakes']++;
    return meta;
  }
  root.ProgressMerge = {empty, merge, mergeHistory, mergeActivity, increment};
  if (typeof module !== 'undefined') module.exports = root.ProgressMerge;
})(globalThis);
