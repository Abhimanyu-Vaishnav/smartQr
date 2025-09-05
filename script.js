// High-Quality QR Code Generator with Fallback
let activeTab = 'text';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Check for QRCode library with fallback
    setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
            console.log('CDN QRCode library loaded');
            initializeApp();
        } else if (typeof OfflineQR !== 'undefined') {
            console.log('Using offline QR generator');
            initializeAppOffline();
        } else {
            console.error('No QR library available');
            showNotification('QR library failed to load', 'error');
        }
    }, 500);
});

function initializeApp() {
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeDiv = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('downloadBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    setupTabs(tabBtns, tabContents);
    generateBtn.addEventListener('click', generateQR);
    setupEnterKey();

    function generateQR() {
        const qrData = getQRData();
        
        if (!qrData) {
            showNotification('Please enter some data', 'error');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        // Use QRCode.js library
        qrcodeDiv.innerHTML = '';
        const qr = new QRCode(qrcodeDiv, {
            text: qrData,
            width: 256,
            height: 256,
            colorDark: '#2d3748',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        setTimeout(() => {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate QR Code';
            
            const canvas = qrcodeDiv.querySelector('canvas');
            if (canvas) {
                downloadBtn.style.display = 'block';
                setupDownload(canvas);
                saveToHistory(qrData, activeTab);
                showNotification('QR Code generated successfully!', 'success');
            } else {
                showNotification('Failed to generate QR code', 'error');
            }
        }, 100);
    }
}

function initializeAppOffline() {
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeDiv = document.getElementById('qrcode');
    const downloadBtn = document.getElementById('downloadBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    setupTabs(tabBtns, tabContents);
    generateBtn.addEventListener('click', generateQROffline);
    setupEnterKey();

    function generateQROffline() {
        const qrData = getQRData();
        
        if (!qrData) {
            showNotification('Please enter some data', 'error');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const qrGenerator = new OfflineQR();
            const canvas = qrGenerator.generate(qrData);
            
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate QR Code';
            
            qrcodeDiv.innerHTML = '';
            qrcodeDiv.appendChild(canvas);
            downloadBtn.style.display = 'block';
            
            setupDownload(canvas);
            saveToHistory(qrData, activeTab);
            showNotification('QR Code generated successfully!', 'success');
            
        } catch (error) {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate QR Code';
            showNotification('Failed to generate QR code', 'error');
        }
    }
}

function setupTabs(tabBtns, tabContents) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            activeTab = targetTab;
            clearQR();
        });
    });
    
    setupHistory();
}

function setupHistory() {
    const historyToggle = document.getElementById('historyToggle');
    const historyPanel = document.getElementById('historyPanel');
    const clearHistory = document.getElementById('clearHistory');
    
    historyToggle.addEventListener('click', () => {
        historyPanel.classList.toggle('show');
        loadHistory();
    });
    
    clearHistory.addEventListener('click', clearAllHistory);
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('smartqr_history') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No QR codes generated yet</div>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-info">
                <div class="history-type">${item.type.toUpperCase()}</div>
                <div class="history-preview">${item.preview}</div>
                <div class="history-date">${new Date(item.timestamp).toLocaleDateString()}</div>
            </div>
            <div class="history-actions">
                <button class="history-regenerate" onclick="regenerateQR('${item.id}')" title="Regenerate">⚪</button>
                <button class="history-delete" onclick="deleteHistoryItem('${item.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function regenerateQR(id) {
    const history = JSON.parse(localStorage.getItem('smartqr_history') || '[]');
    const item = history.find(h => h.id == id);
    
    if (!item) return;
    
    activeTab = item.type;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${activeTab}-tab`);
    });
    
    fillFormData(item.data, item.type);
    document.getElementById('generateBtn').click();
    document.getElementById('historyPanel').classList.remove('show');
}

function fillFormData(data, type) {
    switch(type) {
        case 'text':
            document.getElementById('textInput').value = data;
            break;
        case 'url':
            document.getElementById('urlInput').value = data;
            break;
        case 'location':
            const coords = data.replace('geo:', '').split(',');
            document.getElementById('latInput').value = coords[0] || '';
            document.getElementById('lngInput').value = coords[1] || '';
            break;
        case 'wifi':
            const wifiMatch = data.match(/S:([^;]+);P:([^;]*);/);
            if (wifiMatch) {
                document.getElementById('ssidInput').value = wifiMatch[1];
                document.getElementById('passwordInput').value = wifiMatch[2];
            }
            break;
    }
}

function deleteHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('smartqr_history') || '[]');
    history = history.filter(item => item.id != id);
    localStorage.setItem('smartqr_history', JSON.stringify(history));
    loadHistory();
    showNotification('QR code deleted from history', 'success');
}

function clearAllHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        localStorage.removeItem('smartqr_history');
        loadHistory();
        showNotification('All history cleared!', 'success');
    }
}

function setupEnterKey() {
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && (e.target.matches('input') || e.target.matches('textarea'))) {
            document.getElementById('generateBtn').click();
        }
    });
}

function getQRData() {
    switch(activeTab) {
        case 'text':
            return document.getElementById('textInput').value.trim();
        
        case 'url':
            let url = document.getElementById('urlInput').value.trim();
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return url;
        
        case 'location':
            const lat = document.getElementById('latInput').value.trim();
            const lng = document.getElementById('lngInput').value.trim();
            return lat && lng ? `geo:${lat},${lng}` : '';
        
        case 'contact':
            const name = document.getElementById('nameInput').value.trim();
            const phone = document.getElementById('phoneInput').value.trim();
            const email = document.getElementById('emailInput').value.trim();
            
            if (!name && !phone && !email) return '';
            
            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            if (name) vcard += `FN:${name}\n`;
            if (phone) vcard += `TEL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            vcard += 'END:VCARD';
            return vcard;
        
        case 'wifi':
            const ssid = document.getElementById('ssidInput').value.trim();
            const password = document.getElementById('passwordInput').value.trim();
            const security = document.getElementById('securityInput').value;
            return ssid ? `WIFI:T:${security};S:${ssid};P:${password};;` : '';
        
        default:
            return '';
    }
}

function setupDownload(canvas) {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = function() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `smartqr-${activeTab}-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
}

function clearQR() {
    document.getElementById('qrcode').innerHTML = '';
    document.getElementById('downloadBtn').style.display = 'none';
}

function saveToHistory(data, type) {
    try {
        let history = JSON.parse(localStorage.getItem('smartqr_history') || '[]');
        const historyItem = {
            id: Date.now(),
            data: data,
            type: type,
            timestamp: new Date().toISOString(),
            preview: data.length > 50 ? data.substring(0, 50) + '...' : data
        };
        
        history.unshift(historyItem);
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('smartqr_history', JSON.stringify(history));
    } catch (e) {
        console.log('Could not save to history:', e);
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Make functions globally accessible
window.regenerateQR = regenerateQR;
window.deleteHistoryItem = deleteHistoryItem;
window.clearAllHistory = clearAllHistory;