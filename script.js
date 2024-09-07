const checklist = {
    categories: ['tiered-uniques', 'sacred-uniques', 'sets', 'runes', 'charms-trophies'],
    subcategories: ['weapons', 'armor', 'misc'],
    items: []
};

const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const categoryButtons = document.querySelectorAll('.category-btn');
const subcategoryButtons = document.querySelectorAll('.subcategory-btn');
const toggleCompletedBtn = document.getElementById('toggle-completed');
const clearAllBtn = document.getElementById('clear-all-btn');
const checklistItems = document.getElementById('checklist-items');
const searchInput = document.getElementById('search-input');

let hideCompleted = false;

function saveHideCompletedState() {
    localStorage.setItem('hideCompleted', JSON.stringify(hideCompleted));
}

function loadHideCompletedState() {
    const savedState = localStorage.getItem('hideCompleted');
    if (savedState !== null) {
        hideCompleted = JSON.parse(savedState);
        toggleCompletedBtn.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
    }
}

function saveToLocalStorage() {
    localStorage.setItem('checklistItems', JSON.stringify(checklist.items));
}

function loadFromLocalStorage() {
    const savedItems = localStorage.getItem('checklistItems');
    if (savedItems) {
        checklist.items = JSON.parse(savedItems);
    }
}

async function loadItems() {
    loadFromLocalStorage();
    if (checklist.items.length === 0) {
        const loadPromises = checklist.categories.map(async (category) => {
            if (category === 'sets' || category === 'runes' || category === 'charms-trophies') {
                console.log(`Loading ${category}.json`);
                const response = await fetch(`${category}.json`);
                const items = await response.json();
                return items.map(name => ({
                    name,
                    category,
                    subcategory: 'misc',
                    completed: false
                }));
            } else {
                const categoryPromises = checklist.subcategories.map(async (subcategory) => {
                    console.log(`Loading ${category}-${subcategory}.json`);
                    const response = await fetch(`${category}-${subcategory}.json`);
                    const items = await response.json();
                    return items.map(name => ({
                        name,
                        category,
                        subcategory,
                        completed: false
                    }));
                });
                return (await Promise.all(categoryPromises)).flat();
            }
        });

        const loadedItems = await Promise.all(loadPromises);
        checklist.items = loadedItems.flat();
        console.log(`Total items loaded: ${checklist.items.length}`);
        saveToLocalStorage();
    }
    renderChecklist();
    updateProgress();
}

function renderChecklist() {
    checklistItems.innerHTML = '';
    const filteredItems = getFilteredItems();
    filteredItems.forEach((item) => {
        const button = document.createElement('button');
        button.textContent = item.name;
        button.classList.add('checklist-item');
        if (item.completed) {
            button.classList.add('completed');
        }
        button.dataset.category = item.category;
        button.dataset.subcategory = item.subcategory;
        button.addEventListener('click', () => toggleItemCompletion(item));
        checklistItems.appendChild(button);
    });
}

function toggleItemCompletion(item) {
    item.completed = !item.completed;
    saveToLocalStorage();
    updateProgress();
    renderChecklist();
}

function updateProgress() {
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    const activeSubcategory = document.querySelector('.subcategory-btn.active').dataset.subcategory;
    
    const relevantItems = checklist.items.filter(item => {
        const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
        let subcategoryMatch = activeSubcategory === 'all' || item.subcategory === activeSubcategory;
        
        if (item.category === 'sets' || item.category === 'runes' || item.category === 'charms-trophies') {
            subcategoryMatch = activeSubcategory === 'all' || activeSubcategory === 'misc';
        }
        
        return categoryMatch && subcategoryMatch;
    });

    const totalItems = relevantItems.length;
    const completedItems = relevantItems.filter(item => item.completed).length;
    
    const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${completedItems}/${totalItems} (${Math.round(percentage)}%) Complete`;
}

function getFilteredItems() {
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    const activeSubcategory = document.querySelector('.subcategory-btn.active').dataset.subcategory;
    const searchText = searchInput.value.toLowerCase();
    
    return checklist.items.filter(item => {
        const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
        let subcategoryMatch = activeSubcategory === 'all' || item.subcategory === activeSubcategory;
        
        if (item.category === 'sets' || item.category === 'runes' || item.category === 'charms-trophies') {
            subcategoryMatch = activeSubcategory === 'all' || activeSubcategory === 'misc';
        }
        
        const completedMatch = !hideCompleted || !item.completed;
        const searchMatch = item.name.toLowerCase().includes(searchText);
        return categoryMatch && subcategoryMatch && completedMatch && searchMatch;
    });
}

function filterItems() {
    renderChecklist();
    updateProgress();
}

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterItems();
    });
});

subcategoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        subcategoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterItems();
    });
});

toggleCompletedBtn.addEventListener('click', () => {
    hideCompleted = !hideCompleted;
    toggleCompletedBtn.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
    saveHideCompletedState();
    filterItems();
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data?')) {
        checklist.items.forEach(item => item.completed = false);
        saveToLocalStorage();
        filterItems();
    }
});

searchInput.addEventListener('input', filterItems);

function init() {
    document.querySelector('.category-btn[data-category="all"]').classList.add('active');
    document.querySelector('.subcategory-btn[data-subcategory="all"]').classList.add('active');
    loadHideCompletedState();
    loadItems().then(() => {
        filterItems();
    }).catch(error => {
        console.error('Error loading items:', error);
    });
}

init();
