// Password Generator - Main Script

// Character Sets
const CHARACTER_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similar: '0OIl1',
    ambiguous: '{}[]()/\\\'"`~,;:.<>'
};

// State Management
let passwordHistory = [];
let batchPasswords = [];
let isPasswordVisible = false;

// DOM Elements
const elements = {
    passwordOutput: document.getElementById('passwordOutput'),
    passwordLength: document.getElementById('passwordLength'),
    lengthValue: document.getElementById('lengthValue'),
    includeUppercase: document.getElementById('includeUppercase'),
    includeLowercase: document.getElementById('includeLowercase'),
    includeNumbers: document.getElementById('includeNumbers'),
    includeSymbols: document.getElementById('includeSymbols'),
    excludeSimilar: document.getElementById('excludeSimilar'),
    excludeAmbiguous: document.getElementById('excludeAmbiguous'),
    presetPattern: document.getElementById('presetPattern'),
    generatePassword: document.getElementById('generatePassword'),
    generateBatch: document.getElementById('generateBatch'),
    exportPasswords: document.getElementById('exportPasswords'),
    clearHistory: document.getElementById('clearHistory'),
    copyPassword: document.getElementById('copyPassword'),
    toggleVisibility: document.getElementById('toggleVisibility'),
    visibilityIcon: document.getElementById('visibilityIcon'),
    refreshPassword: document.getElementById('refreshPassword'),
    strengthText: document.getElementById('strengthText'),
    strengthBar: document.getElementById('strengthBar'),
    strengthScore: document.getElementById('strengthScore'),
    batchResults: document.getElementById('batchResults'),
    batchList: document.getElementById('batchList'),
    closeBatchResults: document.getElementById('closeBatchResults'),
    historyList: document.getElementById('historyList'),
    enableHistory: document.getElementById('enableHistory'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    setupEventListeners();
    generatePassword(); // Generate initial password
});

// Load Settings from LocalStorage
function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    const savedLength = localStorage.getItem('passwordLength');
    if (savedLength) {
        elements.passwordLength.value = savedLength;
        elements.lengthValue.textContent = savedLength;
    }
    
    const savedOptions = JSON.parse(localStorage.getItem('passwordOptions') || '{}');
    if (savedOptions.uppercase !== undefined) elements.includeUppercase.checked = savedOptions.uppercase;
    if (savedOptions.lowercase !== undefined) elements.includeLowercase.checked = savedOptions.lowercase;
    if (savedOptions.numbers !== undefined) elements.includeNumbers.checked = savedOptions.numbers;
    if (savedOptions.symbols !== undefined) elements.includeSymbols.checked = savedOptions.symbols;
    if (savedOptions.excludeSimilar !== undefined) elements.excludeSimilar.checked = savedOptions.excludeSimilar;
    if (savedOptions.excludeAmbiguous !== undefined) elements.excludeAmbiguous.checked = savedOptions.excludeAmbiguous;
    
    const savedHistoryEnabled = localStorage.getItem('historyEnabled');
    if (savedHistoryEnabled !== null) {
        elements.enableHistory.checked = savedHistoryEnabled === 'true';
    }
}

// Save Settings to LocalStorage
function saveSettings() {
    localStorage.setItem('passwordLength', elements.passwordLength.value);
    localStorage.setItem('passwordOptions', JSON.stringify({
        uppercase: elements.includeUppercase.checked,
        lowercase: elements.includeLowercase.checked,
        numbers: elements.includeNumbers.checked,
        symbols: elements.includeSymbols.checked,
        excludeSimilar: elements.excludeSimilar.checked,
        excludeAmbiguous: elements.excludeAmbiguous.checked
    }));
    localStorage.setItem('historyEnabled', elements.enableHistory.checked);
}

// Setup Event Listeners
function setupEventListeners() {
    // Password length slider
    elements.passwordLength.addEventListener('input', (e) => {
        elements.lengthValue.textContent = e.target.value;
        saveSettings();
        generatePassword();
    });

    // Character type checkboxes
    [elements.includeUppercase, elements.includeLowercase, elements.includeNumbers, elements.includeSymbols].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            validateCharacterTypes();
            saveSettings();
            generatePassword();
        });
    });

    // Advanced options
    elements.excludeSimilar.addEventListener('change', () => {
        saveSettings();
        generatePassword();
    });
    elements.excludeAmbiguous.addEventListener('change', () => {
        saveSettings();
        generatePassword();
    });

    // Preset patterns
    elements.presetPattern.addEventListener('change', (e) => {
        applyPresetPattern(e.target.value);
        generatePassword();
    });

    // Buttons
    elements.generatePassword.addEventListener('click', generatePassword);
    elements.generateBatch.addEventListener('click', generateBatchPasswords);
    elements.exportPasswords.addEventListener('click', exportPasswords);
    elements.clearHistory.addEventListener('click', clearHistory);
    elements.copyPassword.addEventListener('click', copyToClipboard);
    elements.toggleVisibility.addEventListener('click', togglePasswordVisibility);
    elements.refreshPassword.addEventListener('click', generatePassword);
    elements.enableHistory.addEventListener('change', saveSettings);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.closeBatchResults.addEventListener('click', closeBatchResults);
}

// Validate Character Types
function validateCharacterTypes() {
    const hasAnyType = elements.includeUppercase.checked ||
                      elements.includeLowercase.checked ||
                      elements.includeNumbers.checked ||
                      elements.includeSymbols.checked;
    
    if (!hasAnyType) {
        showToast('请至少选择一种字符类型！', 'error');
        // Re-enable at least one type
        elements.includeLowercase.checked = true;
    }
}

// Apply Preset Pattern
function applyPresetPattern(pattern) {
    switch (pattern) {
        case 'letters':
            elements.includeUppercase.checked = true;
            elements.includeLowercase.checked = true;
            elements.includeNumbers.checked = false;
            elements.includeSymbols.checked = false;
            break;
        case 'numbers':
            elements.includeUppercase.checked = false;
            elements.includeLowercase.checked = false;
            elements.includeNumbers.checked = true;
            elements.includeSymbols.checked = false;
            break;
        case 'alphanumeric':
            elements.includeUppercase.checked = true;
            elements.includeLowercase.checked = true;
            elements.includeNumbers.checked = true;
            elements.includeSymbols.checked = false;
            break;
        case 'all':
            elements.includeUppercase.checked = true;
            elements.includeLowercase.checked = true;
            elements.includeNumbers.checked = true;
            elements.includeSymbols.checked = true;
            break;
    }
    saveSettings();
}

// Generate Password using Web Crypto API
function generatePassword() {
    validateCharacterTypes();
    
    const length = parseInt(elements.passwordLength.value);
    let charset = '';
    
    // Build character set
    if (elements.includeUppercase.checked) {
        charset += CHARACTER_SETS.uppercase;
    }
    if (elements.includeLowercase.checked) {
        charset += CHARACTER_SETS.lowercase;
    }
    if (elements.includeNumbers.checked) {
        charset += CHARACTER_SETS.numbers;
    }
    if (elements.includeSymbols.checked) {
        charset += CHARACTER_SETS.symbols;
    }
    
    // Exclude similar characters
    if (elements.excludeSimilar.checked) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('');
    }
    
    // Exclude ambiguous characters
    if (elements.excludeAmbiguous.checked) {
        charset = charset.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('');
    }
    
    if (charset.length === 0) {
        showToast('无法生成密码：没有可用的字符！', 'error');
        return;
    }
    
    // Generate password using crypto.getRandomValues
    const password = generateSecurePassword(charset, length);
    
    // Update UI
    elements.passwordOutput.value = password;
    updatePasswordStrength(password);
    
    // Save to history
    if (elements.enableHistory.checked) {
        addToHistory(password);
    }
}

// Generate Secure Password using Web Crypto API
function generateSecurePassword(charset, length) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    
    return password;
}

// Calculate Password Strength
function calculatePasswordStrength(password) {
    let score = 0;
    const length = password.length;
    
    // Length score (max 40 points)
    if (length >= 4) score += 10;
    if (length >= 8) score += 10;
    if (length >= 12) score += 10;
    if (length >= 16) score += 10;
    
    // Character variety (max 40 points)
    let varietyScore = 0;
    if (/[a-z]/.test(password)) varietyScore += 10;
    if (/[A-Z]/.test(password)) varietyScore += 10;
    if (/[0-9]/.test(password)) varietyScore += 10;
    if (/[^a-zA-Z0-9]/.test(password)) varietyScore += 10;
    score += varietyScore;
    
    // Complexity (max 20 points)
    const uniqueChars = new Set(password).size;
    const complexityRatio = uniqueChars / length;
    score += Math.min(20, complexityRatio * 20);
    
    // Determine strength level
    let strength = 'weak';
    let strengthText = '弱';
    
    if (score >= 80) {
        strength = 'very-strong';
        strengthText = '极强';
    } else if (score >= 60) {
        strength = 'strong';
        strengthText = '强';
    } else if (score >= 40) {
        strength = 'medium';
        strengthText = '中';
    } else {
        strength = 'weak';
        strengthText = '弱';
    }
    
    return { score, strength, strengthText };
}

// Update Password Strength Display
function updatePasswordStrength(password) {
    const { score, strength, strengthText } = calculatePasswordStrength(password);
    
    elements.strengthText.textContent = strengthText;
    elements.strengthScore.textContent = score;
    
    // Update strength bar
    elements.strengthBar.className = 'strength-bar ' + strength;
}

// Copy to Clipboard
async function copyToClipboard() {
    const password = elements.passwordOutput.value;
    
    if (!password || password === '点击生成密码') {
        showToast('没有可复制的密码！', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(password);
        showToast('密码已复制到剪贴板！', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('密码已复制到剪贴板！', 'success');
        } catch (err) {
            showToast('复制失败，请手动复制！', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    isPasswordVisible = !isPasswordVisible;
    elements.passwordOutput.type = isPasswordVisible ? 'text' : 'password';
    elements.visibilityIcon.textContent = isPasswordVisible ? '🙈' : '👁️';
}

// Generate Batch Passwords
function generateBatchPasswords() {
    const count = prompt('请输入要生成的密码数量（1-50）：', '10');
    const num = parseInt(count);
    
    if (isNaN(num) || num < 1 || num > 50) {
        showToast('请输入1-50之间的数字！', 'error');
        return;
    }
    
    batchPasswords = [];
    for (let i = 0; i < num; i++) {
        const length = parseInt(elements.passwordLength.value);
        let charset = '';
        
        if (elements.includeUppercase.checked) charset += CHARACTER_SETS.uppercase;
        if (elements.includeLowercase.checked) charset += CHARACTER_SETS.lowercase;
        if (elements.includeNumbers.checked) charset += CHARACTER_SETS.numbers;
        if (elements.includeSymbols.checked) charset += CHARACTER_SETS.symbols;
        
        if (elements.excludeSimilar.checked) {
            charset = charset.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('');
        }
        if (elements.excludeAmbiguous.checked) {
            charset = charset.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('');
        }
        
        if (charset.length > 0) {
            batchPasswords.push(generateSecurePassword(charset, length));
        }
    }
    
    displayBatchResults();
    elements.exportPasswords.style.display = 'inline-flex';
}

// Display Batch Results
function displayBatchResults() {
    elements.batchResults.style.display = 'block';
    elements.batchList.innerHTML = '';
    
    batchPasswords.forEach((password, index) => {
        const item = document.createElement('div');
        item.className = 'batch-item';

        const text = document.createElement('span');
        text.className = 'batch-item-text';
        text.textContent = `${index + 1}. ${password}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'batch-item-copy';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', () => copyBatchPassword(password));

        item.appendChild(text);
        item.appendChild(copyBtn);
        elements.batchList.appendChild(item);
    });
}

// Close Batch Results
function closeBatchResults() {
    elements.batchResults.style.display = 'none';
    batchPasswords = [];
    elements.exportPasswords.style.display = 'none';
}

// Copy Batch Password
window.copyBatchPassword = function(password) {
    navigator.clipboard.writeText(password).then(() => {
        showToast('密码已复制！', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('密码已复制！', 'success');
    });
};

// Export Passwords
function exportPasswords() {
    if (batchPasswords.length === 0) {
        showToast('没有可导出的密码！', 'error');
        return;
    }
    
    const content = batchPasswords.map((pwd, i) => `${i + 1}. ${pwd}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('密码已导出！', 'success');
}

// Password History
function addToHistory(password) {
    const historyItem = {
        password: password,
        timestamp: new Date().toISOString()
    };
    
    passwordHistory.unshift(historyItem);
    
    // Limit history to 50 items
    if (passwordHistory.length > 50) {
        passwordHistory = passwordHistory.slice(0, 50);
    }
    
    saveHistory();
    displayHistory();
}

function displayHistory() {
    if (!elements.enableHistory.checked || passwordHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="empty-message">暂无历史记录</p>';
        return;
    }
    
    elements.historyList.innerHTML = '';
    passwordHistory.forEach((item) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const time = new Date(item.timestamp);
        const timeStr = time.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const text = document.createElement('span');
        text.className = 'history-item-text';
        text.textContent = item.password;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-item-time';
        timeSpan.textContent = timeStr;

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'history-item-copy';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', () => copyHistoryPassword(item.password));

        actions.appendChild(copyBtn);

        historyItem.appendChild(text);
        historyItem.appendChild(timeSpan);
        historyItem.appendChild(actions);
        elements.historyList.appendChild(historyItem);
    });
}

window.copyHistoryPassword = function(password) {
    navigator.clipboard.writeText(password).then(() => {
        showToast('密码已复制！', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('密码已复制！', 'success');
    });
};

function clearHistory() {
    if (confirm('确定要清除所有历史记录吗？')) {
        passwordHistory = [];
        saveHistory();
        displayHistory();
        showToast('历史记录已清除！', 'success');
    }
}

function saveHistory() {
    if (elements.enableHistory.checked) {
        localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
    } else {
        localStorage.removeItem('passwordHistory');
    }
}

function loadHistory() {
    const saved = localStorage.getItem('passwordHistory');
    if (saved) {
        passwordHistory = JSON.parse(saved);
    }
    displayHistory();
}

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    elements.themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

