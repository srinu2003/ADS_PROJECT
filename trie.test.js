/**
 * trie.test.js
 * ------------
 * Unit test suite for the Trie data structure.
 * Uses Node.js built-in assert module — no external dependencies needed.
 * Run with:  node trie.test.js
 *
 * Test coverage:
 *   ✓ Insert (new words, duplicates, frequency update)
 *   ✓ Contains (exact match, prefix-only, missing words)
 *   ✓ Search / Autocomplete (prefix match, frequency ranking, empty prefix, no match)
 *   ✓ Delete (leaf word, prefix word, non-existent word, node pruning)
 *   ✓ allWords (DFS traversal, sort order)
 *   ✓ Stats (wordCount, nodeCount, prefixCount)
 *   ✓ Clear
 *   ✓ Edge cases (single character, same word inserted twice, empty trie)
 *
 * M.Tech (CSE) R25 — Advanced Data Structures Lab
 * Project: Autocomplete System using Trie Data Structure
 */

'use strict';

const assert = require('assert');
const Trie   = require('./Trie');

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓  ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${description}`);
    console.error(`       → ${err.message}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 48 - title.length))}`);
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

section('INSERT');

test('Insert a single word increments wordCount to 1', () => {
  const t = new Trie();
  t.insert('hello');
  assert.strictEqual(t.wordCount, 1);
});

test('Insert a single word creates correct number of nodes (5 chars + root = 6)', () => {
  const t = new Trie();
  t.insert('hello');
  assert.strictEqual(t.nodeCount, 6);
});

test('Inserting two words sharing a prefix creates shared nodes', () => {
  const t = new Trie();
  t.insert('cat');   // root + c + a + t  = 4 nodes total
  t.insert('car');   // shares 'c','a' → adds only 'r' = 5 nodes total
  assert.strictEqual(t.nodeCount, 5);
  assert.strictEqual(t.wordCount, 2);
});

test('Re-inserting the same word does not increment wordCount', () => {
  const t = new Trie();
  t.insert('data');
  t.insert('data');
  assert.strictEqual(t.wordCount, 1);
});

test('Re-inserting the same word updates the frequency', () => {
  const t = new Trie();
  t.insert('sort', 10);
  t.insert('sort', 99);
  const results = t.search('sort', 1);
  assert.strictEqual(results[0].freq, 99);
});

test('insert() returns 0 new nodes when word already fully exists', () => {
  const t = new Trie();
  t.insert('graph');
  const n = t.insert('graph');
  assert.strictEqual(n, 0);
});

section('CONTAINS');

test('contains() returns true for an inserted word', () => {
  const t = new Trie();
  t.insert('search');
  assert.strictEqual(t.contains('search'), true);
});

test('contains() returns false for a prefix that is not a complete word', () => {
  const t = new Trie();
  t.insert('search');
  assert.strictEqual(t.contains('sear'), false);
});

test('contains() returns false for a word not in the trie', () => {
  const t = new Trie();
  t.insert('tree');
  assert.strictEqual(t.contains('trie'), false);
});

test('contains() is case-insensitive', () => {
  const t = new Trie();
  t.insert('Hash');
  assert.strictEqual(t.contains('hash'), true);
  assert.strictEqual(t.contains('HASH'), true);
});

test('contains() returns false on empty trie', () => {
  const t = new Trie();
  assert.strictEqual(t.contains('anything'), false);
});

section('SEARCH (Autocomplete)');

test('search() returns all words with the given prefix', () => {
  const t = new Trie();
  ['stack', 'string', 'struct', 'sort', 'array'].forEach(w => t.insert(w));
  const words = t.search('st').map(r => r.word);
  assert.ok(words.includes('stack'));
  assert.ok(words.includes('string'));
  assert.ok(words.includes('struct'));
  assert.ok(!words.includes('sort'));
  assert.ok(!words.includes('array'));
});

test('search() returns results ranked by frequency (highest first)', () => {
  const t = new Trie();
  t.insert('sort',   10);
  t.insert('string', 90);
  t.insert('stack',  50);
  const words = t.search('s').map(r => r.word);
  assert.strictEqual(words[0], 'string');
  assert.strictEqual(words[1], 'stack');
  assert.strictEqual(words[2], 'sort');
});

test('search() with empty prefix returns all words (up to topK)', () => {
  const t = new Trie();
  ['a', 'b', 'c'].forEach(w => t.insert(w));
  assert.strictEqual(t.search('', 10).length, 3);
});

test('search() returns empty array for prefix not in trie', () => {
  const t = new Trie();
  t.insert('hello');
  assert.deepStrictEqual(t.search('xyz'), []);
});

test('search() respects topK limit', () => {
  const t = new Trie();
  ['sa','sb','sc','sd','se','sf'].forEach(w => t.insert(w));
  assert.strictEqual(t.search('s', 3).length, 3);
});

test('search() returns exact word when prefix equals the word', () => {
  const t = new Trie();
  t.insert('node', 80);
  const results = t.search('node');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].word, 'node');
});

section('DELETE');

test('delete() returns true for an existing word', () => {
  const t = new Trie();
  t.insert('heap');
  assert.strictEqual(t.delete('heap'), true);
});

test('delete() returns false for a word not in the trie', () => {
  const t = new Trie();
  t.insert('heap');
  assert.strictEqual(t.delete('help'), false);
});

test('delete() returns false for a prefix that is not a complete word', () => {
  const t = new Trie();
  t.insert('string');
  assert.strictEqual(t.delete('str'), false);
});

test('delete() decrements wordCount', () => {
  const t = new Trie();
  t.insert('queue');
  t.delete('queue');
  assert.strictEqual(t.wordCount, 0);
});

test('delete() prunes leaf nodes (isolated word)', () => {
  const t = new Trie();
  t.insert('heap'); // 5 nodes (root + h + e + a + p)
  t.delete('heap');
  assert.strictEqual(t.nodeCount, 1); // only root remains
});

test('delete() does NOT prune shared prefix nodes', () => {
  const t = new Trie();
  t.insert('string', 1); // root,s,t,r,i,n,g
  t.insert('struct', 1); // shares root,s,t,r + adds u,c,t
  const nodesBefore = t.nodeCount; // 10 nodes
  t.delete('string');    // removes i,n,g (3 leaf nodes)
  assert.strictEqual(t.nodeCount, nodesBefore - 3);
});

test('After deleting a word, contains() returns false', () => {
  const t = new Trie();
  t.insert('cache');
  t.delete('cache');
  assert.strictEqual(t.contains('cache'), false);
});

test('After deleting a word that shares a prefix, other words are unaffected', () => {
  const t = new Trie();
  t.insert('sort');
  t.insert('sorting');
  t.delete('sort');
  assert.strictEqual(t.contains('sort'),    false);
  assert.strictEqual(t.contains('sorting'), true);
});

test('Deleting the longer of two prefix-related words leaves the shorter intact', () => {
  const t = new Trie();
  t.insert('sort');
  t.insert('sorting');
  t.delete('sorting');
  assert.strictEqual(t.contains('sort'),    true);
  assert.strictEqual(t.contains('sorting'), false);
});

section('ALL WORDS');

test('allWords() returns every inserted word', () => {
  const t = new Trie();
  const ws = ['data', 'node', 'graph'];
  ws.forEach(w => t.insert(w));
  const words = t.allWords().map(r => r.word).sort();
  assert.deepStrictEqual(words, ws.sort());
});

test('allWords() sorts by frequency descending', () => {
  const t = new Trie();
  t.insert('a', 10);
  t.insert('b', 50);
  t.insert('c', 30);
  const freqs = t.allWords().map(r => r.freq);
  assert.deepStrictEqual(freqs, [50, 30, 10]);
});

test('allWords() returns empty array for empty trie', () => {
  const t = new Trie();
  assert.deepStrictEqual(t.allWords(), []);
});

section('STATS');

test('stats() returns correct wordCount and nodeCount', () => {
  const t = new Trie();
  t.insert('list');  // root + l + i + s + t = 5 nodes
  t.insert('link');  // shares root,l,i → adds n,k = 7 nodes
  const s = t.stats();
  assert.strictEqual(s.wordCount, 2);
  assert.strictEqual(s.nodeCount, 7);
});

test('stats().prefixCount is positive after insertions', () => {
  const t = new Trie();
  t.insert('abc');
  assert.ok(t.stats().prefixCount > 0);
});

section('CLEAR');

test('clear() resets wordCount to 0', () => {
  const t = new Trie();
  t.insert('binary'); t.insert('tree');
  t.clear();
  assert.strictEqual(t.wordCount, 0);
});

test('clear() resets nodeCount to 1 (root only)', () => {
  const t = new Trie();
  t.insert('binary'); t.insert('tree');
  t.clear();
  assert.strictEqual(t.nodeCount, 1);
});

test('After clear(), contains() returns false for previously inserted words', () => {
  const t = new Trie();
  t.insert('recursion');
  t.clear();
  assert.strictEqual(t.contains('recursion'), false);
});

section('EDGE CASES');

test('Single-character word inserts and retrieves correctly', () => {
  const t = new Trie();
  t.insert('a');
  assert.strictEqual(t.contains('a'), true);
  assert.strictEqual(t.nodeCount, 2); // root + 'a'
});

test('Inserting the same single-character word twice does not duplicate nodes', () => {
  const t = new Trie();
  t.insert('z');
  t.insert('z');
  assert.strictEqual(t.nodeCount, 2);
  assert.strictEqual(t.wordCount, 1);
});

test('search() on empty trie returns empty array', () => {
  const t = new Trie();
  assert.deepStrictEqual(t.search('any'), []);
});

test('delete() on empty trie returns false', () => {
  const t = new Trie();
  assert.strictEqual(t.delete('word'), false);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(52));

if (failed > 0) process.exit(1);
