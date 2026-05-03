/**
 * main.js
 * -------
 * Driver / demo script for the Autocomplete System using Trie.
 * Run with:  node main.js
 *
 * Demonstrates:
 *   1. Inserting words with frequency weights
 *   2. Prefix-based autocomplete search
 *   3. Exact-match lookup (contains)
 *   4. Word deletion with node pruning
 *   5. Printing Trie statistics
 *
 * M.Tech (CSE) R25 — Advanced Data Structures Lab
 * Project: Autocomplete System using Trie Data Structure
 */

'use strict';

const Trie = require('./Trie');

// ─── Utility: pretty-print section headers ──────────────────────────────────
function section(title) {
  const line = '─'.repeat(55);
  console.log(`\n${line}`);
  console.log(` ${title}`);
  console.log(line);
}

function printSuggestions(prefix, suggestions) {
  if (suggestions.length === 0) {
    console.log(`  autocomplete("${prefix}") → (no matches)`);
    return;
  }
  const formatted = suggestions
    .map(({ word, freq }) => `${word}(${freq})`)
    .join(', ');
  console.log(`  autocomplete("${prefix}") → [ ${formatted} ]`);
}

// ─── 1. Initialise Trie ──────────────────────────────────────────────────────
const trie = new Trie();

// ─── 2. Insert words (word, frequency) ──────────────────────────────────────
section('STEP 1 — Insert Words');

const wordList = [
  ['search',       95],
  ['sort',         89],
  ['string',       97],
  ['stack',        84],
  ['struct',       62],
  ['structure',    58],
  ['algorithm',    78],
  ['array',        80],
  ['autocomplete', 55],
  ['binary',       70],
  ['breadth',      60],
  ['cache',        75],
  ['compiler',     65],
  ['data',         90],
  ['depth',        58],
  ['dynamic',      72],
  ['graph',        68],
  ['hash',         77],
  ['heap',         62],
  ['integer',      85],
  ['linked',       63],
  ['list',         88],
  ['network',      74],
  ['node',         91],
  ['pointer',      59],
  ['queue',        66],
  ['recursion',    71],
  ['tree',         87],
];

wordList.forEach(([word, freq]) => {
  const newNodes = trie.insert(word, freq);
  console.log(`  insert("${word}", freq=${freq}) → +${newNodes} new node(s)`);
});

// ─── 3. Trie Statistics ──────────────────────────────────────────────────────
section('STEP 2 — Trie Statistics After Insertion');
const s = trie.stats();
console.log(`  Words stored    : ${s.wordCount}`);
console.log(`  Total nodes     : ${s.nodeCount}`);
console.log(`  Shared prefixes : ${s.prefixCount}`);

// ─── 4. Autocomplete Search ──────────────────────────────────────────────────
section('STEP 3 — Autocomplete (Prefix Search)');

const prefixes = ['s', 'st', 'str', 'al', 'au', 'b', 'c', 'n', 'xy', ''];
prefixes.forEach(p => {
  const results = trie.search(p, 5);
  printSuggestions(p, results);
});

// ─── 5. Exact Match (contains) ───────────────────────────────────────────────
section('STEP 4 — Exact Match Lookup (contains)');

const lookups = ['stack', 'stac', 'sort', 'sorting', 'binary', 'graph', 'xyz'];
lookups.forEach(word => {
  console.log(`  contains("${word}") → ${trie.contains(word)}`);
});

// ─── 6. Delete with Node Pruning ────────────────────────────────────────────
section('STEP 5 — Delete with Node Pruning');

const toDelete = ['stack', 'struct', 'xyz'];
toDelete.forEach(word => {
  const before = trie.nodeCount;
  const result = trie.delete(word);
  const pruned = before - trie.nodeCount;
  console.log(
    `  delete("${word}") → ${result ? 'SUCCESS' : 'NOT FOUND'}`
    + (result ? ` (${pruned} node(s) pruned)` : '')
  );
});

// Verify deletion
section('STEP 6 — Verify State After Deletion');
console.log(`  contains("stack")  → ${trie.contains('stack')}  (expected: false)`);
console.log(`  contains("struct") → ${trie.contains('struct')} (expected: false)`);
console.log(`  contains("string") → ${trie.contains('string')} (expected: true — shared prefix preserved)`);

// Autocomplete after deletion
console.log('');
printSuggestions('st', trie.search('st', 5));
printSuggestions('str', trie.search('str', 5));

// Updated stats
const s2 = trie.stats();
console.log(`\n  Words remaining : ${s2.wordCount}`);
console.log(`  Nodes remaining : ${s2.nodeCount}`);

// ─── 7. All Words ────────────────────────────────────────────────────────────
section('STEP 7 — All Words (sorted by frequency)');
trie.allWords().forEach(({ word, freq }) => {
  const bar = '█'.repeat(Math.round(freq / 10));
  console.log(`  ${word.padEnd(15)} freq=${String(freq).padStart(3)}  ${bar}`);
});

// ─── 8. Clear ────────────────────────────────────────────────────────────────
section('STEP 8 — Clear Trie');
trie.clear();
console.log(`  After clear: wordCount=${trie.wordCount}, nodeCount=${trie.nodeCount}`);
console.log(`  contains("search") → ${trie.contains('search')}`);

console.log('\n✓ All operations completed successfully.\n');
