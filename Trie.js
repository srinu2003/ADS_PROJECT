/**
 * Trie.js
 * -------
 * Trie (Prefix Tree) data structure with the following operations:
 *   - insert(word, freq)       : Insert a word with an optional frequency weight
 *   - search(prefix, topK)     : Return top-K autocomplete suggestions for a prefix
 *   - contains(word)           : Exact-match lookup (O(m))
 *   - delete(word)             : Remove a word and prune unused nodes
 *   - allWords()               : Return all stored words sorted by frequency
 *   - countPrefixes()          : Count all nodes that have at least one child
 *   - clear()                  : Reset the Trie
 *
 * Time Complexities:
 *   insert   → O(m)        m = word length
 *   search   → O(m + k)    k = chars in all matching words
 *   contains → O(m)
 *   delete   → O(m)
 *
 * Space Complexity: O(n × m̄ × Σ)  worst case (no shared prefixes)
 *   n = number of words, m̄ = average word length, Σ = alphabet size (26)
 *
 * M.Tech (CSE) R25 — Advanced Data Structures Lab
 * Project: Autocomplete System using Trie Data Structure
 */

const TrieNode = require('./TrieNode');

class Trie {
  constructor() {
    this.root      = new TrieNode(); // Sentinel root node (no character)
    this.wordCount = 0;              // Total number of complete words stored
    this.nodeCount = 1;              // Total nodes (root counts as 1)
  }

  // ─────────────────────────────────────────────────────────────────
  // INSERT
  // ─────────────────────────────────────────────────────────────────
  /**
   * Inserts a word into the Trie.
   * @param {string} word  - Word to insert (letters only, case-insensitive)
   * @param {number} freq  - Frequency / priority weight (default: 1)
   * @returns {number}       Number of new nodes created
   */
  insert(word, freq = 1) {
    word = word.toLowerCase();
    let node     = this.root;
    let newNodes = 0;

    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
        newNodes++;
      }
      node = node.children[ch];
    }

    if (!node.isEnd) {
      node.isEnd = true;
      this.wordCount++;
    }
    // Always update frequency (allows re-insertion with new weight)
    node.freq = freq;
    this.nodeCount += newNodes;

    return newNodes;
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH  (prefix-based autocomplete)
  // ─────────────────────────────────────────────────────────────────
  /**
   * Returns up to topK words that begin with the given prefix,
   * ranked by frequency (descending), then alphabetically.
   *
   * @param {string} prefix - The prefix string to search
   * @param {number} topK   - Maximum number of suggestions (default: 10)
   * @returns {Array<{word: string, freq: number}>}
   */
  search(prefix, topK = 10) {
    prefix = prefix.toLowerCase();
    let node = this.root;

    // Phase 1: Traverse to the end of the prefix
    for (const ch of prefix) {
      if (!node.children[ch]) return []; // prefix not found
      node = node.children[ch];
    }

    // Phase 2: DFS from the prefix node to collect all reachable words
    const results = [];

    const dfs = (currentNode, currentWord) => {
      if (results.length >= topK * 4) return; // cap DFS for very large tries
      if (currentNode.isEnd) {
        results.push({ word: currentWord, freq: currentNode.freq });
      }
      // Visit children in sorted order for consistent output
      for (const ch of Object.keys(currentNode.children).sort()) {
        dfs(currentNode.children[ch], currentWord + ch);
      }
    };

    dfs(node, prefix);

    // Phase 3: Sort by frequency desc, then alphabetically; slice to topK
    return results
      .sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word))
      .slice(0, topK);
  }

  // ─────────────────────────────────────────────────────────────────
  // CONTAINS  (exact match)
  // ─────────────────────────────────────────────────────────────────
  /**
   * Returns true if the exact word exists in the Trie.
   * @param {string} word
   * @returns {boolean}
   */
  contains(word) {
    word = word.toLowerCase();
    let node = this.root;

    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }

    return node.isEnd;
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE  (with node pruning)
  // ─────────────────────────────────────────────────────────────────
  /**
   * Removes a word from the Trie and prunes unused leaf nodes.
   *
   * Two cases handled:
   *   (a) Word is a prefix of another word → only isEnd flag is cleared.
   *   (b) Word has no descendant words     → nodes pruned bottom-up.
   *
   * @param {string} word
   * @returns {boolean} true if word was found and deleted, false otherwise
   */
  delete(word) {
    word = word.toLowerCase();

    // Record the traversal path: array of [parentNode, character]
    const path = [];
    let node   = this.root;

    for (const ch of word) {
      if (!node.children[ch]) return false; // word not in trie
      path.push([node, ch]);
      node = node.children[ch];
    }

    if (!node.isEnd) return false; // prefix exists but not a complete word

    // Unmark the word-end flag
    node.isEnd = false;
    this.wordCount--;

    // Backtrack and prune leaf nodes that are now unreachable
    for (let i = path.length - 1; i >= 0; i--) {
      const [parent, ch] = path[i];
      const child        = parent.children[ch];

      if (Object.keys(child.children).length === 0 && !child.isEnd) {
        delete parent.children[ch];
        this.nodeCount--;
      } else {
        break; // stop — this node still has children or ends another word
      }
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // ALL WORDS  (full DFS traversal)
  // ─────────────────────────────────────────────────────────────────
  /**
   * Returns every word stored in the Trie, sorted by frequency descending.
   * @returns {Array<{word: string, freq: number}>}
   */
  allWords() {
    const results = [];

    const dfs = (node, word) => {
      if (node.isEnd) results.push({ word, freq: node.freq });
      for (const ch in node.children) {
        dfs(node.children[ch], word + ch);
      }
    };

    dfs(this.root, '');
    return results.sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word));
  }

  // ─────────────────────────────────────────────────────────────────
  // COUNT PREFIXES
  // ─────────────────────────────────────────────────────────────────
  /**
   * Returns the number of internal (non-leaf) nodes — i.e., nodes
   * that are shared prefixes for two or more words.
   * @returns {number}
   */
  countPrefixes() {
    let count = 0;
    const dfs = (node) => {
      if (Object.keys(node.children).length > 0) count++;
      for (const ch in node.children) dfs(node.children[ch]);
    };
    dfs(this.root);
    return count;
  }

  // ─────────────────────────────────────────────────────────────────
  // CLEAR
  // ─────────────────────────────────────────────────────────────────
  /**
   * Resets the Trie to its initial empty state.
   */
  clear() {
    this.root      = new TrieNode();
    this.wordCount = 0;
    this.nodeCount = 1;
  }

  // ─────────────────────────────────────────────────────────────────
  // STATS  (helper)
  // ─────────────────────────────────────────────────────────────────
  /**
   * Returns a summary statistics object for the current Trie state.
   * @returns {{ wordCount: number, nodeCount: number, prefixCount: number }}
   */
  stats() {
    return {
      wordCount   : this.wordCount,
      nodeCount   : this.nodeCount,
      prefixCount : this.countPrefixes()
    };
  }
}

module.exports = Trie;
