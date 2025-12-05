// Check authentication
if (!checkAuth()) {
    throw new Error('Not authenticated');
}

// Get tree ID from URL
const urlParams = new URLSearchParams(window.location.search);
const treeId = urlParams.get('id');

if (!treeId) {
    alert('No tree ID provided');
    window.location.href = 'dashboard.html';
}

let persons = [];
let relationships = [];
let marriages = [];
let treeData = null;
let svg, g, zoom;

// D3 Tree Configuration
const width = 1200;
const height = 600;
const nodeRadius = 30;
const levelHeight = 150;

// Load tree data
loadTreeData();

async function loadTreeData() {
    try {
        // Load tree info
        const treeResponse = await api.get(`/trees/${treeId}`);
        document.getElementById('treeName').textContent = treeResponse.data.tree_name;

        // Load persons
        const personsResponse = await api.get(`/trees/${treeId}/persons`);
        persons = personsResponse.data;

        // Load relationships
        const relationshipsResponse = await api.get(`/trees/${treeId}/relationships`);
        relationships = relationshipsResponse.data;

        // Load marriages
        const marriagesResponse = await api.get(`/trees/${treeId}/marriages`);
        marriages = marriagesResponse.data;

        // Build and render tree
        buildTreeStructure();
        renderTree();
        renderPersonsList();

        // Auto-center the tree after rendering
        setTimeout(() => {
            centerTree();
        }, 100);
    } catch (error) {
        console.error('Error loading tree data:', error);
        alert('Error loading tree data: ' + error.message);
    }
}

function buildTreeStructure() {
    if (persons.length === 0) {
        return null;
    }

    // 1. Identify all potential roots (people without parents)
    const childIds = new Set(relationships.map(r => r.child_id));
    const candidates = persons.filter(p => !childIds.has(p.person_id));

    // If no roots found (circular or empty), use the oldest person
    if (candidates.length === 0) {
        const oldest = persons.reduce((a, b) => {
            const dateA = a.date_of_birth ? new Date(a.date_of_birth) : new Date();
            const dateB = b.date_of_birth ? new Date(b.date_of_birth) : new Date();
            return dateA < dateB ? a : b;
        });
        candidates.push(oldest);
    }

    // 2. Filter candidates to find actual tree roots
    // A person is a root if:
    // - They have no parents (already checked)
    // - AND they are not married to someone who has parents (if so, they attach to that spouse)
    // - AND if married to another root candidate, they are the "primary" one (e.g. smaller ID)
    const roots = candidates.filter(p => {
        // Find spouse
        const marriage = marriages.find(m =>
            m.spouse1_id === p.person_id || m.spouse2_id === p.person_id
        );

        if (!marriage) return true; // Not married, definitely a root

        const spouseId = marriage.spouse1_id === p.person_id
            ? marriage.spouse2_id
            : marriage.spouse1_id;

        // Check if spouse has parents
        if (childIds.has(spouseId)) {
            return false; // Spouse has parents, so I attach to them. Not a root.
        }

        // Spouse also has no parents. Both are candidates.
        // Pick the one with smaller ID to be the root.
        return p.person_id < spouseId;
    });

    // Build tree from roots
    treeData = {
        name: document.getElementById('treeName').textContent || 'Family Tree',
        children: roots.map(root => buildPersonNode(root))
    };
}

function buildPersonNode(person) {
    const node = {
        id: person.person_id,
        name: person.first_name,  // Show only first name
        data: person,
        children: [],
        spouse: null
    };

    // Find spouse
    const marriage = marriages.find(m =>
        m.spouse1_id === person.person_id || m.spouse2_id === person.person_id
    );

    if (marriage) {
        const spouseId = marriage.spouse1_id === person.person_id
            ? marriage.spouse2_id
            : marriage.spouse1_id;
        const spouse = persons.find(p => p.person_id === spouseId);

        if (spouse) {
            node.spouse = {
                id: spouse.person_id,
                name: spouse.first_name,  // Show only first name for spouse too
                data: spouse
            };
        }
    }

    // Find children
    const childRelationships = relationships.filter(r => r.parent_id === person.person_id);
    const processedChildren = new Set();

    childRelationships.forEach(rel => {
        if (!processedChildren.has(rel.child_id)) {
            const child = persons.find(p => p.person_id === rel.child_id);
            if (child) {
                node.children.push(buildPersonNode(child));
                processedChildren.add(rel.child_id);
            }
        }
    });

    return node;
}

function renderTree() {
    const container = document.getElementById('treeVisualization');

    if (!treeData || persons.length === 0) {
        container.innerHTML = `
            <div class="tree-empty">
                <h3>No family members yet</h3>
                <p>Add your first family member to start building your tree!</p>
            </div>
        `;
        return;
    }

    // Clear previous SVG
    d3.select('#treeSvg').selectAll('*').remove();

    // Create SVG
    svg = d3.select('#treeSvg')
        .attr('width', '100%')
        .attr('height', height);

    // Add zoom behavior
    zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Create group for tree
    g = svg.append('g')
        .attr('transform', `translate(${width / 2}, 50)`);

    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 200, height - 100])
        .separation((a, b) => {
            return a.parent === b.parent ? 1.5 : 2;
        });

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    root.x0 = 0;
    root.y0 = 0;

    // Counter for node IDs
    let i = 0;

    // Don't collapse children initially - show all family members
    // root.children?.forEach(collapse);

    // function collapse(d) {
    //     if (d.children) {
    //         d._children = d.children;
    //         d._children.forEach(collapse);
    //         d.children = null;
    //     }
    // }

    update(root);

    function update(source) {
        // Compute the new tree layout
        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // Normalize for fixed-depth
        nodes.forEach(d => {
            d.y = d.depth * levelHeight;
        });

        // Update nodes
        const node = g.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        // Enter new nodes
        const nodeEnter = node.enter().append('g')
            .attr('class', d => {
                const gender = d.data.data?.gender?.toLowerCase() || '';
                const hasChildren = d.children || d._children ? 'has-children' : '';
                const collapsed = d._children ? 'collapsed' : '';
                return `node ${gender} ${hasChildren} ${collapsed}`.trim();
            })
            .attr('transform', d => `translate(${source.x0},${source.y0})`)
            .on('click', click);

        // Add circle for node background
        nodeEnter.append('circle')
            .attr('r', nodeRadius)
            .style('fill', d => d._children ? 'var(--secondary-color)' : 'var(--bg-secondary)')
            .style('stroke', d => {
                const gender = d.data.data?.gender;
                return gender === 'Male' ? '#3b82f6' : gender === 'Female' ? '#ec4899' : 'var(--primary-color)';
            })
            .style('stroke-width', '3px');

        // Add photo or placeholder
        nodeEnter.each(function (d) {
            const personData = d.data.data;
            if (!personData) return;

            const group = d3.select(this);

            if (personData.profile_photo) {
                // Add circular clip path for photo
                const clipId = `clip-${d.id || d.data.id}`;

                svg.append('defs')
                    .append('clipPath')
                    .attr('id', clipId)
                    .append('circle')
                    .attr('r', nodeRadius - 2);

                // Add image
                group.append('image')
                    .attr('xlink:href', `${window.APP_CONFIG?.BASE_URL || 'http://localhost:5000'}${personData.profile_photo}`)
                    .attr('crossorigin', 'anonymous')
                    .attr('preserveAspectRatio', 'xMidYMid slice')
                    .attr('image-rendering', 'optimizeQuality')
                    .attr('x', -nodeRadius + 2)
                    .attr('y', -nodeRadius + 2)
                    .attr('width', (nodeRadius - 2) * 2)
                    .attr('height', (nodeRadius - 2) * 2)
                    .attr('clip-path', `url(#${clipId})`)
                    .style('pointer-events', 'none');
            } else {
                // Add placeholder with initials
                const initials = personData.first_name.charAt(0) +
                    (personData.last_name ? personData.last_name.charAt(0) : '');

                group.append('text')
                    .attr('class', 'initials-text')
                    .attr('dy', '0.35em')
                    .style('font-size', '1.2em')
                    .style('font-weight', '600')
                    .style('fill', 'white')
                    .style('pointer-events', 'none')
                    .text(initials);
            }
        });

        // Add name text
        nodeEnter.append('text')
            .attr('class', 'name-text')
            .attr('dy', '-2.5em')
            .text(d => d.data.name);

        // Add dates text
        nodeEnter.append('text')
            .attr('class', 'dates-text')
            .attr('dy', '4.2em')
            .text(d => {
                if (!d.data.data) return '';
                const birth = d.data.data.date_of_birth
                    ? new Date(d.data.data.date_of_birth).getFullYear()
                    : '?';
                const death = d.data.data.is_alive
                    ? 'Present'
                    : (d.data.data.date_of_death ? new Date(d.data.data.date_of_death).getFullYear() : '?');
                return `${birth} - ${death}`;
            });

        // Add spouse if exists
        nodeEnter.each(function (d) {
            if (d.data.spouse) {
                const spouseGroup = d3.select(this).append('g')
                    .attr('class', 'spouse-group')
                    .attr('transform', 'translate(80, 0)');

                // Spouse circle
                spouseGroup.append('circle')
                    .attr('r', nodeRadius)
                    .attr('class', d.data.spouse.data.gender.toLowerCase())
                    .style('fill', 'var(--bg-secondary)')
                    .style('stroke', d.data.spouse.data.gender === 'Male' ? '#3b82f6' : '#ec4899')
                    .style('stroke-width', '3px');

                // Add spouse photo or placeholder
                const spouseData = d.data.spouse.data;
                if (spouseData.profile_photo) {
                    // Add circular clip path for spouse photo
                    const clipId = `clip-spouse-${d.id || d.data.spouse.id}`;

                    svg.append('defs')
                        .append('clipPath')
                        .attr('id', clipId)
                        .append('circle')
                        .attr('r', nodeRadius - 2);

                    // Add spouse image
                    spouseGroup.append('image')
                        .attr('xlink:href', `${window.APP_CONFIG?.BASE_URL || 'http://localhost:5000'}${spouseData.profile_photo}`)
                        .attr('crossorigin', 'anonymous')
                        .attr('preserveAspectRatio', 'xMidYMid slice')
                        .attr('image-rendering', 'optimizeQuality')
                        .attr('x', -nodeRadius + 2)
                        .attr('y', -nodeRadius + 2)
                        .attr('width', (nodeRadius - 2) * 2)
                        .attr('height', (nodeRadius - 2) * 2)
                        .attr('clip-path', `url(#${clipId})`)
                        .style('pointer-events', 'none');
                } else {
                    // Add spouse placeholder with initials
                    const initials = spouseData.first_name.charAt(0) +
                        (spouseData.last_name ? spouseData.last_name.charAt(0) : '');

                    spouseGroup.append('text')
                        .attr('class', 'initials-text')
                        .attr('dy', '0.35em')
                        .style('font-size', '1.2em')
                        .style('font-weight', '600')
                        .style('fill', 'white')
                        .style('pointer-events', 'none')
                        .text(initials);
                }

                // Spouse name
                spouseGroup.append('text')
                    .attr('class', 'name-text')
                    .attr('dy', '-2.5em')
                    .text(d.data.spouse.name);

                // Spouse dates
                spouseGroup.append('text')
                    .attr('class', 'dates-text')
                    .attr('dy', '4.2em')
                    .text(() => {
                        const spouseData = d.data.spouse.data;
                        const birth = spouseData.date_of_birth
                            ? new Date(spouseData.date_of_birth).getFullYear()
                            : '?';
                        const death = spouseData.is_alive
                            ? 'Present'
                            : (spouseData.date_of_death ? new Date(spouseData.date_of_death).getFullYear() : '?');
                        return `${birth} - ${death}`;
                    });

                // Marriage connector
                d3.select(this).append('line')
                    .attr('class', 'spouse-connector')
                    .attr('x1', nodeRadius)
                    .attr('y1', 0)
                    .attr('x2', 80 - nodeRadius)
                    .attr('y2', 0);
            }
        });

        // Add collapse/expand indicator
        nodeEnter.append('text')
            .attr('class', 'collapse-indicator')
            .attr('dy', '0.3em')
            .style('display', d => d.children || d._children ? 'block' : 'none')
            .text(d => d._children ? '+' : '-');

        // Transition nodes to their new position
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(750)
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodeUpdate.select('circle')
            .style('fill', d => d._children ? 'var(--secondary-color)' : 'var(--bg-secondary)');

        nodeUpdate.select('.collapse-indicator')
            .text(d => d._children ? '+' : '-');

        // Remove exiting nodes
        const nodeExit = node.exit().transition()
            .duration(750)
            .attr('transform', d => `translate(${source.x},${source.y})`)
            .remove();

        nodeExit.select('circle')
            .attr('r', 0);

        nodeExit.select('text')
            .style('fill-opacity', 0);

        // Update links
        const link = g.selectAll('path.link')
            .data(links, d => d.target.id);

        // Enter new links
        const linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            });

        // Transition links to their new position
        linkEnter.merge(link).transition()
            .duration(750)
            .attr('d', d => diagonal(d.source, d.target));

        // Remove exiting links
        link.exit().transition()
            .duration(750)
            .attr('d', d => {
                const o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        // Store old positions for transition
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click
    function click(event, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    // Creates a curved path from parent to child
    function diagonal(s, d) {
        return `M ${s.x} ${s.y}
                C ${s.x} ${(s.y + d.y) / 2},
                  ${d.x} ${(s.y + d.y) / 2},
                  ${d.x} ${d.y}`;
    }
}

function renderPersonsList() {
    const grid = document.getElementById('personsGrid');

    grid.innerHTML = persons.map(person => {
        const photoUrl = person.profile_photo
            ? `${window.APP_CONFIG?.BASE_URL || 'http://localhost:5000'}${person.profile_photo}`
            : null;
        const initials = person.first_name.charAt(0) + (person.last_name ? person.last_name.charAt(0) : '');

        return `
        <div class="person-card">
            ${photoUrl
                ? `<img src="${photoUrl}" alt="${person.first_name}" class="person-photo">`
                : `<div class="person-photo-placeholder">${initials}</div>`
            }
            <div class="person-info">
                <h4>${person.first_name} ${person.middle_name || ''} ${person.last_name || ''}</h4>
                <p><strong>Gender:</strong> ${person.gender}</p>
                <p><strong>Born:</strong> ${person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString() : 'Unknown'}</p>
                ${person.occupation ? `<p><strong>Occupation:</strong> ${person.occupation}</p>` : ''}
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="editPerson(${person.person_id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Edit</button>
                    <button class="btn btn-danger" onclick="deletePerson(${person.person_id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Expand all nodes
function expandAll() {
    if (!treeData) return;
    const root = d3.hierarchy(treeData);
    root.each(d => {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
    });
    renderTree();
}

// Collapse all nodes
function collapseAll() {
    if (!treeData) return;
    const root = d3.hierarchy(treeData);
    root.children?.forEach(collapse);

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    renderTree();
}

// Center tree
function centerTree() {
    if (!svg || !zoom) return;

    // Reset zoom to identity - the tree group is already centered by its transform
    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
}

// Modal functions
function showAddPersonModal() {
    document.getElementById('addPersonModal').classList.add('active');
}

function closeAddPersonModal() {
    document.getElementById('addPersonModal').classList.remove('active');
    document.getElementById('addPersonForm').reset();
}

function showAddRelationshipModal() {
    const parentSelect = document.getElementById('parentId');
    const childSelect = document.getElementById('childId');

    const options = persons.map(p =>
        `<option value="${p.person_id}">${p.first_name} ${p.last_name || ''}</option>`
    ).join('');

    parentSelect.innerHTML = '<option value="">Select parent...</option>' + options;
    childSelect.innerHTML = '<option value="">Select child...</option>' + options;

    document.getElementById('addRelationshipModal').classList.add('active');
}

function closeAddRelationshipModal() {
    document.getElementById('addRelationshipModal').classList.remove('active');
    document.getElementById('addRelationshipForm').reset();
}

function showAddMarriageModal() {
    const spouse1Select = document.getElementById('spouse1Id');
    const spouse2Select = document.getElementById('spouse2Id');

    const options = persons.map(p =>
        `<option value="${p.person_id}">${p.first_name} ${p.last_name || ''}</option>`
    ).join('');

    spouse1Select.innerHTML = '<option value="">Select spouse...</option>' + options;
    spouse2Select.innerHTML = '<option value="">Select spouse...</option>' + options;

    document.getElementById('addMarriageModal').classList.add('active');
}

function closeAddMarriageModal() {
    document.getElementById('addMarriageModal').classList.remove('active');
    document.getElementById('addMarriageForm').reset();
}

// Form handlers
document.getElementById('addPersonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('firstName').value,
        middleName: document.getElementById('middleName').value,
        lastName: document.getElementById('lastName').value,
        gender: document.getElementById('gender').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        isAlive: document.getElementById('isAlive').checked,
        occupation: document.getElementById('occupation').value,
        bio: document.getElementById('bio').value
    };

    try {
        // Create person first
        const response = await api.post(`/trees/${treeId}/persons`, formData);
        const personId = response.data.personId;

        // Upload photo if selected
        const photoInput = document.getElementById('profilePhoto');
        if (photoInput.files.length > 0) {
            await uploadPersonPhoto(personId, photoInput.files[0]);
        }

        closeAddPersonModal();
        clearPhotoPreview();
        loadTreeData();
    } catch (error) {
        alert('Error adding person: ' + error.message);
    }
});

document.getElementById('addRelationshipForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        treeId: parseInt(treeId),
        parentId: parseInt(document.getElementById('parentId').value),
        childId: parseInt(document.getElementById('childId').value),
        relationshipType: document.getElementById('relationshipType').value
    };

    try {
        await api.post('/relationships', formData);
        closeAddRelationshipModal();
        loadTreeData();
    } catch (error) {
        alert('Error adding relationship: ' + error.message);
    }
});

document.getElementById('addMarriageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        treeId: parseInt(treeId),
        spouse1Id: parseInt(document.getElementById('spouse1Id').value),
        spouse2Id: parseInt(document.getElementById('spouse2Id').value),
        marriageDate: document.getElementById('marriageDate').value,
        marriagePlace: document.getElementById('marriagePlace').value
    };

    try {
        await api.post('/marriages', formData);
        closeAddMarriageModal();
        loadTreeData();
    } catch (error) {
        alert('Error adding marriage: ' + error.message);
    }
});

async function deletePerson(personId) {
    if (!confirm('Are you sure you want to delete this person?')) {
        return;
    }

    try {
        await api.delete(`/persons/${personId}`);
        loadTreeData();
    } catch (error) {
        alert('Error deleting person: ' + error.message);
    }
}

function editPerson(personId) {
    // Find the person
    const person = persons.find(p => p.person_id === personId);
    if (!person) {
        alert('Person not found');
        return;
    }

    // Populate the edit form with current data
    document.getElementById('editPersonId').value = person.person_id;
    document.getElementById('editFirstName').value = person.first_name;
    document.getElementById('editMiddleName').value = person.middle_name || '';
    document.getElementById('editLastName').value = person.last_name || '';
    document.getElementById('editGender').value = person.gender;

    // Format date for HTML5 date input (YYYY-MM-DD)
    if (person.date_of_birth) {
        const dob = new Date(person.date_of_birth);
        const year = dob.getFullYear();
        const month = String(dob.getMonth() + 1).padStart(2, '0');
        const day = String(dob.getDate()).padStart(2, '0');
        document.getElementById('editDateOfBirth').value = `${year}-${month}-${day}`;
    } else {
        document.getElementById('editDateOfBirth').value = '';
    }

    document.getElementById('editIsAlive').checked = person.is_alive;
    document.getElementById('editOccupation').value = person.occupation || '';
    document.getElementById('editBio').value = person.bio || '';

    // Display current photo if exists
    const currentPhotoDisplay = document.getElementById('currentPhotoDisplay');
    const currentPhotoImage = document.getElementById('currentPhotoImage');
    if (person.profile_photo) {
        currentPhotoImage.src = `${window.APP_CONFIG?.BASE_URL || 'http://localhost:5000'}${person.profile_photo}`;
        currentPhotoDisplay.style.display = 'block';
    } else {
        currentPhotoDisplay.style.display = 'none';
    }

    // Clear previous photo preview
    clearEditPhotoPreview();

    // Show the edit modal
    document.getElementById('editPersonModal').classList.add('active');
}

function closeEditPersonModal() {
    document.getElementById('editPersonModal').classList.remove('active');
    document.getElementById('editPersonForm').reset();
    clearEditPhotoPreview();
    document.getElementById('currentPhotoDisplay').style.display = 'none';
}

// Edit person form handler
document.getElementById('editPersonForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const personId = document.getElementById('editPersonId').value;
    const formData = {
        firstName: document.getElementById('editFirstName').value,
        middleName: document.getElementById('editMiddleName').value,
        lastName: document.getElementById('editLastName').value,
        gender: document.getElementById('editGender').value,
        dateOfBirth: document.getElementById('editDateOfBirth').value,
        isAlive: document.getElementById('editIsAlive').checked,
        occupation: document.getElementById('editOccupation').value,
        bio: document.getElementById('editBio').value
    };

    try {
        await api.put(`/persons/${personId}`, formData);

        // Upload new photo if selected
        const photoInput = document.getElementById('editProfilePhoto');
        if (photoInput.files.length > 0) {
            await uploadPersonPhoto(personId, photoInput.files[0]);
        }

        closeEditPersonModal();
        loadTreeData();
    } catch (error) {
        alert('Error updating person: ' + error.message);
    }
});

// Close modals when clicking outside
window.onclick = function (event) {
    const modals = ['addPersonModal', 'addRelationshipModal', 'addMarriageModal', 'editPersonModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Photo Upload Functions
async function uploadPersonPhoto(personId, file) {
    const formData = new FormData();
    formData.append('photo', file);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.APP_CONFIG?.API_BASE_URL || 'http://localhost:5000/api'}/persons/${personId}/photo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload photo');
        }

        return await response.json();
    } catch (error) {
        console.error('Photo upload error:', error);
        throw error;
    }
}

async function deleteCurrentPhoto() {
    const personId = document.getElementById('editPersonId').value;

    if (!confirm('Are you sure you want to delete this photo?')) {
        return;
    }

    try {
        await api.delete(`/persons/${personId}/photo`);
        document.getElementById('currentPhotoDisplay').style.display = 'none';
        alert('Photo deleted successfully');
    } catch (error) {
        alert('Error deleting photo: ' + error.message);
    }
}

// Photo Preview Functions
document.getElementById('profilePhoto')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('photoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('editProfilePhoto')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('editPreviewImage').src = e.target.result;
            document.getElementById('editPhotoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function clearPhotoPreview() {
    document.getElementById('profilePhoto').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('previewImage').src = '';
}

function clearEditPhotoPreview() {
    document.getElementById('editPhotoPreview').style.display = 'none';
    document.getElementById('editPreviewImage').src = '';
}


// Export tree as HD JPG (2x scale)
async function exportAsHDJPG() {
    await exportAsJPG(2, 'HD');
}

// Export tree as 4K JPG (4x scale)
async function exportAs4KJPG() {
    await exportAsJPG(4, '4K');
}

// Common JPG export function
async function exportAsJPG(scale, quality) {
    if (!svg || !g) {
        alert('Please wait for the tree to load first');
        return;
    }

    try {
        const treeName = document.getElementById('treeName').textContent || 'family-tree';
        const svgElement = document.getElementById('treeSvg');
        const treeContainer = document.getElementById('treeVisualization');

        // Save original state
        const originalTransform = g.attr('transform');
        const originalWidth = svgElement.getAttribute('width');
        const originalHeight = svgElement.getAttribute('height');

        // Get full tree bounding box
        const bbox = g.node().getBBox();
        const padding = 100;
        const fullWidth = bbox.width + (padding * 2);
        const fullHeight = bbox.height + (padding * 2);

        // Temporarily adjust SVG to show full tree
        svgElement.setAttribute('width', fullWidth);
        svgElement.setAttribute('height', fullHeight);
        svgElement.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${fullWidth} ${fullHeight}`);
        g.attr('transform', null); // Remove zoom transform

        // Hide all images (keep only initials)
        const images = svgElement.querySelectorAll('image');
        images.forEach(img => img.style.display = 'none');

        // Small delay to let DOM update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capture with html2canvas at specified scale
        const canvas = await html2canvas(treeContainer, {
            backgroundColor: '#1a1a2e',
            scale: scale,
            logging: false,
            useCORS: true,      // Use CORS for images
            allowTaint: false   // Don't taint canvas
        });

        // Restore images
        images.forEach(img => img.style.display = '');

        // Restore original state
        svgElement.setAttribute('width', originalWidth || '100%');
        svgElement.setAttribute('height', originalHeight || '600');
        svgElement.removeAttribute('viewBox');
        if (originalTransform) {
            g.attr('transform', originalTransform);
        }

        // Download as JPG with high quality
        canvas.toBlob(function (blob) {
            const link = document.createElement('a');
            link.download = `${treeName.replace(/\s+/g, '-').toLowerCase()}-tree-${quality}.jpg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/jpeg', 0.95); // 95% quality JPG

    } catch (error) {
        console.error(`Error exporting ${quality} JPG:`, error);
        alert(`Error exporting ${quality} JPG: ` + error.message);
    }
}
