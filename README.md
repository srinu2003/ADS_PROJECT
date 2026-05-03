# Autocomplete System using Trie Data Structure

**M.Tech (CSE) R25 — Advanced Data Structures Lab**  
Language: JavaScript (Node.js, ES6+)

---

## Project Structure

```
trie_project/
├── TrieNode.js       — Single Trie node (children, isEnd, freq)
├── Trie.js           — Full Trie class (insert, search, delete, etc.)
├── main.js           — Driver / demo script
├── trie.test.js      — Unit test suite (40+ tests, no external deps)
└── README.md         — This file
```

---

## How to Run

### Prerequisites
- Node.js v14 or later

### Run the Demo
```bash
node main.js
```

### Run the Tests
```bash
node trie.test.js
```

---

## API Reference

### `new Trie()`
Creates an empty Trie with a single root node.

### `trie.insert(word, freq = 1)` → `number`
Inserts a word with an optional frequency weight.  
Returns the number of new nodes created.

### `trie.search(prefix, topK = 10)` → `Array<{word, freq}>`
Returns up to `topK` autocomplete suggestions starting with `prefix`,  
ranked by frequency descending, then alphabetically.

### `trie.contains(word)` → `boolean`
Returns `true` if the exact word exists in the Trie.

### `trie.delete(word)` → `boolean`
Removes the word and prunes unused leaf nodes.  
Returns `true` if the word was found and deleted.

### `trie.allWords()` → `Array<{word, freq}>`
Returns every stored word sorted by frequency descending.

### `trie.stats()` → `{ wordCount, nodeCount, prefixCount }`
Returns current Trie statistics.

### `trie.clear()`
Resets the Trie to its initial empty state.

---

## Complexity Summary

| Operation       | Time        | Space              |
|-----------------|-------------|--------------------|
| `insert`        | O(m)        | O(m × Σ) worst     |
| `search`        | O(m + k)    | O(W)               |
| `contains`      | O(m)        | O(1)               |
| `delete`        | O(m)        | O(1) amortised     |
| `allWords` DFS  | O(n × m̄)   | O(n)               |

m = word/prefix length, k = chars in all matching words,  
W = matching word count, n = total words, Σ = 26 (alphabet size)
