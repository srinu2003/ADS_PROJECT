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
}

// Initialize
const trie = new Trie();

// DOM Elements
const nodeCountDisplay = document.getElementById('nodeCount');
const wordCountDisplay = document.getElementById('wordCountDisplay');
const trieGraph = document.getElementById('trieGraph');
const graphStatus = document.getElementById('graphStatus');
const toast = document.getElementById('toast');
const loadingText = document.getElementById('loadingText');
const blogEditor = document.getElementById('blogEditor');
const editorSuggestions = document.getElementById('editorSuggestions');

const GRAPH_MAX_NODES = 220;
const GRAPH_LEVEL_HEIGHT = 110;
const GRAPH_WIDTH = 1000;

function updateStats() {
    if (nodeCountDisplay) nodeCountDisplay.innerText = trie.nodeCount;
    if (wordCountDisplay) wordCountDisplay.innerText = trie.totalWords;
}

function showToast(msg) {
    if (toast) {
        toast.innerText = msg;
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 2000);
    }
}

function buildTrieGraphData(maxNodes) {
    const nodes = [];
    const edges = [];
    const visited = new Set();
    let nodeId = 0;

    function traverse(node, parent, parentId, char, depth) {
        if (nodes.length >= maxNodes) return;

        const id = nodeId++;
        const label = char || 'root';
        nodes.push({
            id,
            label,
            depth,
            isEnd: node.isEndOfWord
        });

        if (parent !== null && parentId !== null) {
            edges.push({ from: parentId, to: id });
        }

        for (const char in node.children) {
            traverse(node.children[char], node, id, char, depth + 1);
        }
    }

    traverse(trie.root, null, null, '', 0);
    return { nodes, edges, isTruncated: nodeId >= maxNodes };
}

function renderTrieGraph() {
    if (!trieGraph) return;

    const { nodes, edges, isTruncated } = buildTrieGraphData(GRAPH_MAX_NODES);
    const levels = new Map();

    nodes.forEach(node => {
        if (!levels.has(node.depth)) {
            levels.set(node.depth, []);
        }
        levels.get(node.depth).push(node);
    });

    const maxDepth = Math.max(0, ...nodes.map(node => node.depth));
    const height = Math.max(220, (maxDepth + 1) * GRAPH_LEVEL_HEIGHT);
    trieGraph.setAttribute('viewBox', `0 0 ${GRAPH_WIDTH} ${height}`);

    while (trieGraph.firstChild) {
        trieGraph.removeChild(trieGraph.firstChild);
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    const positions = new Map();

    levels.forEach((levelNodes, depth) => {
        const count = levelNodes.length;
        const spacing = GRAPH_WIDTH / (count + 1);
        levelNodes.forEach((node, index) => {
            const x = spacing * (index + 1);
            const y = 60 + depth * GRAPH_LEVEL_HEIGHT;
            positions.set(node.id, { x, y, node });
        });
    });

    edges.forEach(edge => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return;

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('class', 'trie-edge');
        trieGraph.appendChild(line);
    });

    positions.forEach((pos) => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', 16);
        circle.setAttribute('class', pos.node.isEnd ? 'trie-node trie-node-end' : 'trie-node');
        trieGraph.appendChild(circle);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y);
        text.setAttribute('class', pos.node.label === 'root' ? 'trie-label trie-root-label' : 'trie-label');
        text.textContent = pos.node.label;
        trieGraph.appendChild(text);
    });

    if (graphStatus) {
        const statusText = isTruncated
            ? `Graph capped at ${GRAPH_MAX_NODES} nodes for performance.`
            : `Showing ${nodes.length} nodes.`;
        graphStatus.textContent = statusText;
    }
}

function setLoading(isLoading, message) {
    const loadingStatus = document.getElementById('loadingStatus');
    if (message && loadingText) {
        loadingText.innerText = message;
    }
    if (loadingStatus) {
        if (isLoading) {
            loadingStatus.classList.add('visible');
        } else {
            loadingStatus.classList.remove('visible');
        }
    }
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
        renderTrieGraph();
    } catch (error) {
        console.error("Failed to fetch dictionary", error);
        setLoading(false, 'Dictionary load failed. Using built-in terms.');
        showToast('Dictionary load failed. Using built-in terms.');
        renderTrieGraph();
    }
}

// Blog Writer Logic Helper Functions
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

function applyCasing(word, typed) {
    if (!typed) return word;

    const isUpper = typed === typed.toUpperCase();
    const isCapitalized = typed[0] === typed[0].toUpperCase() && typed.slice(1) === typed.slice(1).toLowerCase();

    if (isUpper) return word.toUpperCase();
    if (isCapitalized) return word[0].toUpperCase() + word.slice(1);

    let result = '';
    for (let i = 0; i < word.length; i++) {
        const typedChar = typed[i];
        if (typedChar && typedChar === typedChar.toUpperCase() && typedChar !== typedChar.toLowerCase()) {
            result += word[i].toUpperCase();
        } else {
            result += word[i].toLowerCase();
        }
    }
    return result;
}

function applySuggestion(item, start, end, typedFragment) {
    const text = blogEditor.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const appliedWord = applyCasing(item.word, typedFragment);
    blogEditor.value = before + appliedWord + " " + after;
    const nextPos = before.length + appliedWord.length + 1;
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

        div.onclick = () => applySuggestion(item, start, end, word);
        editorSuggestions.appendChild(div);
    });
}

// Event Listeners
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

    renderTrieGraph();
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
            applySuggestion(selected, start, end, word);
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

// Initialize
updateStats();
renderTrieGraph();