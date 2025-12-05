// Check authentication
if (!checkAuth()) {
    throw new Error('Not authenticated');
}

// Load user data
const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('userFullName').textContent = user.fullName;

// Load trees on page load
loadTrees();

async function loadTrees() {
    try {
        const response = await api.get('/trees');
        const treesGrid = document.getElementById('treesGrid');

        if (response.data.length === 0) {
            treesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3 style="color: var(--text-secondary); margin-bottom: 1rem;">No family trees yet</h3>
                    <p style="color: var(--text-muted);">Create your first family tree to get started!</p>
                </div>
            `;
            return;
        }

        treesGrid.innerHTML = response.data.map(tree => `
            <div class="tree-card" onclick="viewTree(${tree.tree_id})">
                <h3>${tree.tree_name}</h3>
                <p>${tree.description || 'No description'}</p>
                <div class="tree-card-footer">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">
                        ${tree.is_public ? '🌍 Public' : '🔒 Private'}
                    </span>
                    <div class="tree-card-actions">
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); editTree(${tree.tree_id})" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Edit</button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteTree(${tree.tree_id})" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading trees:', error);
    }
}

function viewTree(treeId) {
    window.location.href = `tree-view.html?id=${treeId}`;
}

function showCreateTreeModal() {
    document.getElementById('createTreeModal').classList.add('active');
}

function closeCreateTreeModal() {
    document.getElementById('createTreeModal').classList.remove('active');
    document.getElementById('createTreeForm').reset();
}

// Create tree form handler
document.getElementById('createTreeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const treeName = document.getElementById('treeName').value;
    const description = document.getElementById('treeDescription').value;
    const isPublic = document.getElementById('isPublic').checked;

    try {
        const response = await api.post('/trees', {
            treeName,
            description,
            isPublic
        });

        if (response.success) {
            closeCreateTreeModal();
            loadTrees();
        }
    } catch (error) {
        alert('Error creating tree: ' + error.message);
    }
});

async function deleteTree(treeId) {
    if (!confirm('Are you sure you want to delete this family tree? This action cannot be undone.')) {
        return;
    }

    try {
        await api.delete(`/trees/${treeId}`);
        loadTrees();
    } catch (error) {
        alert('Error deleting tree: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('createTreeModal');
    if (event.target === modal) {
        closeCreateTreeModal();
    }
}
