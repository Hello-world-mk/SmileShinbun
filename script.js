const REPO_OWNER = 'Hello-world-mk';
const REPO_NAME = 'SmileShinbun';
const API_BASE = 'https://api.github.com';
let currentPath = '';

// ファイルアイコンを決定
function getIcon(item) {
    if (item.type === 'dir') return '📁';
    
    const ext = item.name.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'png': '🖼️',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'gif': '🖼️',
        'mp4': '🎬',
        'mp3': '🎵',
        'zip': '🗜️',
        'json': '⚙️',
        'js': '📜',
        'html': '🌐',
        'css': '🎨',
        'md': '📝',
    };
    return icons[ext] || '📎';
}

// ファイルサイズをフォーマット
function formatSize(bytes) {
    if (bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// パンくずリストを更新
function updateBreadcrumb() {
    const container = document.getElementById('breadcrumb-path');
    if (!currentPath) {
        container.innerHTML = '';
        return;
    }
    
    const parts = currentPath.split('/').filter(p => p);
    let html = '';
    let path = '';
    
    for (let i = 0; i < parts.length; i++) {
        path += (i === 0 ? '' : '/') + parts[i];
        html += ` / <a onclick="navigateTo('${path}')">${parts[i]}</a>`;
    }
    
    container.innerHTML = html;
}

// 指定されたパスへ移動
async function navigateTo(path) {
    currentPath = path;
    updateBreadcrumb();
    await loadFiles();
}

// ファイル一覧を読み込み
async function loadFiles() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-container');
    const listEl = document.getElementById('file-list');
    const statsEl = document.getElementById('stats');
    
    loadingEl.style.display = 'block';
    errorEl.innerHTML = '';
    listEl.innerHTML = '';
    statsEl.innerHTML = '';

    try {
        const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${currentPath}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        let items = await response.json();
        
        // 配列でない場合（ファイルが指定されている場合）
        if (!Array.isArray(items)) {
            errorEl.innerHTML = '<div class="error">❌ このパスはファイルです。ディレクトリを選択してください。</div>';
            loadingEl.style.display = 'none';
            return;
        }

        // ディレクトリ優先でソート
        items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        if (items.length === 0) {
            document.getElementById('file-container').innerHTML = 
                '<div class="empty-message">📭 このディレクトリは空です</div>';
        } else {
            // 統計情報を表示
            const dirs = items.filter(i => i.type === 'dir').length;
            const files = items.filter(i => i.type === 'file').length;
            const totalSize = items.reduce((sum, i) => sum + (i.size || 0), 0);
            
            statsEl.innerHTML = `
                <div class="stat-box">
                    <div class="stat-value">${dirs}</div>
                    <div class="stat-label">ディレクトリ</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${files}</div>
                    <div class="stat-label">ファイル</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${formatSize(totalSize)}</div>
                    <div class="stat-label">合計サイズ</div>
                </div>
            `;

            // ファイルリストを表示
            listEl.innerHTML = items.map(item => `
                <li class="file-item" ${item.type === 'dir' ? `onclick="navigateTo('${item.path}')"` : ''}>
                    <div class="file-icon">${getIcon(item)}</div>
                    <div class="file-info">
                        <div class="file-name">
                            ${item.type === 'dir' ? 
                                `<span class="directory">${item.name}</span>` : 
                                item.name
                            }
                        </div>
                        <div class="file-size">
                            ${item.type === 'dir' ? 'ディレクトリ' : formatSize(item.size)}
                        </div>
                    </div>
                    ${item.type === 'file' ? 
                        `<a href="${item.html_url}" target="_blank" class="file-link">View →</a>` : 
                        ''
                    }
                </li>
            `).join('');

            document.getElementById('file-container').innerHTML = '';
            document.getElementById('file-container').appendChild(listEl);
        }

        loadingEl.style.display = 'none';

    } catch (error) {
        console.error('エラー:', error);
        errorEl.innerHTML = `
            <div class="error">
                ❌ エラーが発生しました: ${error.message}
                <br><small>リポジトリ情報の取得に失敗しました。</small>
            </div>
        `;
        loadingEl.style.display = 'none';
    }
}

// 初期化
window.addEventListener('load', loadFiles);
