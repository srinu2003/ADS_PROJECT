/**
 * TrieNode Class
 */
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.frequency = 0;
    }
}

/**
 * Trie Data Structure with Dynamic Updates
 */
class Trie {
    constructor() {
        this.root = new TrieNode();
        this.nodeCount = 1;
        this.totalWords = 0;
    }

    insert(word, freq = 1) {
        if (!word || word.trim() === "") return false;

        let current = this.root;
        let isNewWord = false;

        for (const char of word.toLowerCase()) {
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
                this.nodeCount++;
            }
            current = current.children[char];
        }

        if (!current.isEndOfWord) {
            current.isEndOfWord = true;
            this.totalWords++;
            isNewWord = true;
        }

        current.frequency = (current.frequency || 0) + freq;
        return isNewWord;
    }

    findPrefixNode(prefix) {
        let current = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!current.children[char]) return null;
            current = current.children[char];
        }
        return current;
    }

    collectAllWords(node, prefix, results) {
        if (node.isEndOfWord) {
            results.push({ word: prefix, weight: node.frequency });
        }

        for (const char in node.children) {
            this.collectAllWords(node.children[char], prefix + char, results);
        }
    }

    autocomplete(prefix) {
        if (!prefix) return [];

        const startNode = this.findPrefixNode(prefix);
        if (!startNode) return [];

        const matches = [];
        this.collectAllWords(startNode, prefix.toLowerCase(), matches);

        return matches.sort((a, b) => b.weight - a.weight);
    }

    exactSearch(word) {
        const node = this.findPrefixNode(word);
        return node && node.isEndOfWord;
    }
}

// Initialize
const trie = new Trie();
const initialTerms = [
    { t: "algorithm", w: 95 }, { t: "artificial intelligence", w: 99 }, { t: "array", w: 40 },
    { t: "binary search", w: 85 }, { t: "data structures", w: 100 }, { t: "machine learning", w: 110 },
    { t: "python", w: 105 }, { t: "trie", w: 120 }, { t: "recursion", w: 88 },
    { t: "cloud computing", w: 82 }, { t: "cybersecurity", w: 75 }, { t: "javascript", w: 90 }
];

initialTerms.forEach(item => trie.insert(item.t, item.w));

// DOM Elements
const nodeCountDisplay = document.getElementById('nodeCount');
const wordCountDisplay = document.getElementById('wordCountDisplay');
const toast = document.getElementById('toast');
const loadingStatus = document.getElementById('loadingStatus');
const loadingText = document.getElementById('loadingText');

function updateStats() {
    nodeCountDisplay.innerText = trie.nodeCount;
    wordCountDisplay.innerText = trie.totalWords;
}

function showToast(msg) {
    toast.innerText = msg;
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 2000);
}

function setLoading(isLoading, message) {
    if (message) {
        loadingText.innerText = message;
    }

    if (isLoading) {
        loadingStatus.classList.remove('is-hidden');
        return;
    }

    if (message) {
        loadingStatus.classList.remove('is-hidden');
        setTimeout(() => loadingStatus.classList.add('is-hidden'), 2000);
        return;
    }

    loadingStatus.classList.add('is-hidden');
}

// Dictionary Data Fetch 
async function fetchDictionaryData() {
    try {
        setLoading(true, 'Loading dictionary...');
        // Fetch top 1000 common English words
        const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt');
        const text = await response.text();
        const words = text.split('\n').filter(w => w.trim().length > 2).slice(0, 2000);

        words.forEach(word => {
            trie.insert(word.trim(), 1);
        });
        updateStats();
        setLoading(false, `Loaded ${words.length} words.`);
        showToast(`Loaded ${words.length} dictionary words!`);
    } catch (error) {
        console.error("Failed to fetch dictionary", error);
        setLoading(false, 'Dictionary load failed. Using built-in terms.');
        showToast('Dictionary load failed. Using built-in terms.');
    }
}

// Blog Writer Logic
const blogEditor = document.getElementById('blogEditor');
const editorSuggestions = document.getElementById('editorSuggestions');
let editorSuggestionItems = [];
let editorSelectedIndex = -1;

function isWordChar(char) {
    return /[A-Za-z0-9_]/.test(char);
}

function getWordAtCursor(textarea) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    let start = cursorPos - 1;
    while (start >= 0 && isWordChar(text[start])) start--;
    start++;

    return {
        word: text.substring(start, cursorPos),
        start: start,
        end: cursorPos
    };
}

function learnCompletedWord(textarea) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const previousChar = text[cursorPos - 1] || '';

    if (!previousChar || isWordChar(previousChar)) return;

    let end = cursorPos - 1;
    let start = end - 1;
    while (start >= 0 && isWordChar(text[start])) start--;
    start++;

    const word = text.substring(start, end).toLowerCase();
    if (word.length < 2) return;

    const isNew = trie.insert(word, 2);
    if (isNew) {
        updateStats();
    }
}

function applySuggestion(item, start, end) {
    const text = blogEditor.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    blogEditor.value = before + item.word + " " + after;
    const nextPos = before.length + item.word.length + 1;
    blogEditor.setSelectionRange(nextPos, nextPos);
    editorSuggestions.classList.add('hidden');
    blogEditor.focus();
    trie.insert(item.word, 3);
    updateStats();
}

function renderEditorSuggestions(word, start, end) {
    editorSuggestions.innerHTML = '';

    if (editorSuggestionItems.length === 0) {
        editorSuggestions.classList.add('hidden');
        return;
    }

    editorSuggestions.classList.remove('hidden');

    editorSuggestionItems.forEach((item, index) => {
        const div = document.createElement('div');
        const isSelected = index === editorSelectedIndex;
        div.className = `suggestion-item${isSelected ? ' is-selected' : ''}`;
        const wordFormatted = item.word.replace(new RegExp(`^(${word})`, 'i'), '<span class="suggestion-match">$1</span>');
        div.innerHTML = wordFormatted;

        div.onclick = () => applySuggestion(item, start, end);
        editorSuggestions.appendChild(div);
    });
}

blogEditor.addEventListener('input', () => {
    learnCompletedWord(blogEditor);
    const { word, start, end } = getWordAtCursor(blogEditor);

    if (word.length >= 2) {
        editorSuggestionItems = trie.autocomplete(word).slice(0, 6);
        editorSelectedIndex = editorSuggestionItems.length > 0 ? 0 : -1;
        renderEditorSuggestions(word, start, end);
    } else {
        editorSuggestionItems = [];
        editorSelectedIndex = -1;
        editorSuggestions.classList.add('hidden');
    }
});

blogEditor.addEventListener('keydown', (e) => {
    if (editorSuggestionItems.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        editorSelectedIndex = (editorSelectedIndex + 1) % editorSuggestionItems.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        editorSelectedIndex = (editorSelectedIndex - 1 + editorSuggestionItems.length) % editorSuggestionItems.length;
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const { word, start, end } = getWordAtCursor(blogEditor);
        const selected = editorSuggestionItems[editorSelectedIndex];
        if (selected) {
            applySuggestion(selected, start, end);
        }
        return;
    } else if (e.key === 'Escape') {
        editorSuggestions.classList.add('hidden');
        return;
    } else {
        return;
    }

    const { word, start, end } = getWordAtCursor(blogEditor);
    renderEditorSuggestions(word, start, end);
});

blogEditor.addEventListener('blur', () => {
    const { word } = getWordAtCursor(blogEditor);
    if (word.length >= 2) {
        const isNew = trie.insert(word.toLowerCase(), 2);
        if (isNew) {
            updateStats();
        }
    }
});

document.addEventListener('click', (e) => {
    if (!blogEditor.contains(e.target) && !editorSuggestions.contains(e.target)) {
        editorSuggestions.classList.add('hidden');
    }
});

// Initialize Fetch and Stats
fetchDictionaryData();
updateStats();
