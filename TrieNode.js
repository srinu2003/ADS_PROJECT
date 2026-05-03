/**
 * TrieNode.js
 * -----------
 * Represents a single node in the Trie data structure.
 *
 * M.Tech (CSE) R25 — Advanced Data Structures Lab
 * Project: Autocomplete System using Trie Data Structure
 */

class TrieNode {
  constructor() {
    /**
     * children: Map of character -> TrieNode
     * Each key is a single lowercase letter ('a' to 'z').
     */
    this.children = {};

    /**
     * isEnd: Boolean flag — true if this node marks the
     * end of a complete, inserted word.
     */
    this.isEnd = false;

    /**
     * freq: Frequency / priority weight of the word ending
     * at this node. Higher frequency = ranked higher in
     * autocomplete suggestions.
     */
    this.freq = 1;
  }
}

module.exports = TrieNode;
