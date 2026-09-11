const REPO_OWNER = 'Hello-world-mk';
const REPO_NAME = 'SmileShinbun';
const API_BASE = 'https://api.github.com';
let currentPath = '';
let loadingIndicator = null;

function formatSize(bytes) {
    if (bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

async function navigateTo(path) {
    currentPath = path;
    updateBreadcrumb();
    await loadFiles();
}

async function loadFiles() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const listEl = document.getElementById('file-list');
    
    loadingEl.style.display = 'block';
    errorEl.innerHTML = '';
    listEl.innerHTML = '';
    loadingIndicator = true;

    try {
        const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${currentPath}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        let items = await response.json();
        
        if (!Array.isArray(items)) {
            errorEl.innerHTML = 'This path is a file, not a directory.';
            loadingEl.style.display = 'none';
            loadingIndicator = null;
            return;
        }

        items.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        if (items.length === 0) {
            listEl.innerHTML = '<li class="file-item">Empty directory</li>';
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'file-item';
                
                if (item.type === 'dir') {
                    li.innerHTML = `<span class="directory">${item.name}</span>`;
                    li.onclick = () => navigateTo(item.path);
                } else {
                    li.innerHTML = `<a href="${item.html_url}" target="_blank" class="file-link">${item.name}</a><span class="file-size">${formatSize(item.size)}</span>`;
                }
                
                listEl.appendChild(li);
            });
        }

        loadingEl.style.display = 'none';
        loadingIndicator = null;

    } catch (error) {
        console.error('Error:', error);
        errorEl.innerHTML = `Error: ${error.message}`;
        loadingEl.style.display = 'none';
        loadingIndicator = null;
    }
}

window.addEventListener('load', loadFiles);
