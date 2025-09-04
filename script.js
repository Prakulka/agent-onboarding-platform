'use strict';

/**
 * Agent Onboarding Platform JavaScript
 * Handles navigation, demo data, and interactive features
 */

// Mock data for demonstration
const mockAgents = [
    {
        id: 1,
        name: 'Sales Assistant Pro',
        product: 'CRM Suite',
        host: 'agent-01.platform.com',
        owner: 'sarah.johnson@company.com',
        created: '2024-08-15',
        status: 'approved',
        successRate: 96.5,
        latency: 0.8,
        usage: 3247
    },
    {
        id: 2,
        name: 'Research Analyzer',
        product: 'Data Analytics',
        host: 'agent-02.platform.com',
        owner: 'mike.chen@company.com',
        created: '2024-08-20',
        status: 'pending',
        successRate: 91.2,
        latency: 1.4,
        usage: 1852
    },
    {
        id: 3,
        name: 'Ops Monitor',
        product: 'Infrastructure',
        host: 'agent-03.platform.com',
        owner: 'lisa.wong@company.com',
        created: '2024-08-25',
        status: 'approved',
        successRate: 98.1,
        latency: 0.6,
        usage: 4123
    },
    {
        id: 4,
        name: 'Customer Support Bot',
        product: 'Support Portal',
        host: 'agent-04.platform.com',
        owner: 'alex.rodriguez@company.com',
        created: '2024-08-28',
        status: 'rejected',
        successRate: 87.3,
        latency: 2.1,
        usage: 987
    }
];

// Application state
let appState = {
    hasAgents: false,
    currentSection: 'agents'
};

/**
 * Initialize the application
 */
function initializeApp() {
    try {
        setupEventListeners();
        loadAppState();
        updateUI();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

/**
 * Setup event listeners for navigation and interactions
 */
function setupEventListeners() {
    try {
        // Sidebar navigation
        const sidebarLinks = document.querySelectorAll('.sidebar__link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });

        // Demo toggle button
        const demoToggle = document.getElementById('demo-toggle');
        if (demoToggle) {
            demoToggle.addEventListener('click', toggleDemoData);
        }

        // Create agent button
        const createAgentBtn = document.getElementById('create-agent-btn');
        if (createAgentBtn) {
            createAgentBtn.addEventListener('click', () => {
                navigateToSection('create');
            });
        }

        // Template buttons
        const templateButtons = document.querySelectorAll('.template-card__button');
        templateButtons.forEach(button => {
            button.addEventListener('click', handleTemplateSelection);
        });

        // Model switch buttons
        const modelButtons = document.querySelectorAll('.model-card .btn--primary');
        modelButtons.forEach(button => {
            button.addEventListener('click', handleModelSwitch);
        });

        // Optimization buttons
        const optimizeButtons = document.querySelectorAll('.optimization-card .btn');
        optimizeButtons.forEach(button => {
            button.addEventListener('click', handleOptimizationAction);
        });

        // Test buttons
        const testButtons = document.querySelectorAll('.scenario-item .btn');
        testButtons.forEach(button => {
            button.addEventListener('click', handleTestScenario);
        });

        // Agent form
        const agentForm = document.getElementById('agent-form');
        if (agentForm) {
            agentForm.addEventListener('submit', handleFormSubmit);
            
            // Set default date to today
            const createdDateInput = document.getElementById('created-date');
            if (createdDateInput) {
                const today = new Date().toISOString().split('T')[0];
                createdDateInput.value = today;
            }
        }

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Handle sidebar navigation
 * @param {Event} event - Click event
 */
function handleNavigation(event) {
    event.preventDefault();
    
    try {
        const sectionName = event.target.dataset.section;
        if (sectionName) {
            navigateToSection(sectionName);
        }
    } catch (error) {
        console.error('Error handling navigation:', error);
    }
}

/**
 * Navigate to a specific section
 * @param {string} sectionName - Name of the section to navigate to
 */
function navigateToSection(sectionName) {
    try {
        // Update active sidebar item
        const sidebarItems = document.querySelectorAll('.sidebar__item');
        sidebarItems.forEach(item => {
            item.classList.remove('sidebar__item--active');
        });

        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('sidebar__item--active');
        }

        // Update content sections
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(section => {
            section.classList.remove('content-section--active');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('content-section--active');
        }

        // Update app state
        appState.currentSection = sectionName;
        saveAppState();

    } catch (error) {
        console.error('Error navigating to section:', error);
    }
}

/**
 * Toggle demo data state
 */
function toggleDemoData() {
    try {
        appState.hasAgents = !appState.hasAgents;
        updateUI();
        saveAppState();
        
        const action = appState.hasAgents ? 'enabled' : 'disabled';
        console.log(`Demo data ${action}`);
    } catch (error) {
        console.error('Error toggling demo data:', error);
    }
}

/**
 * Update UI based on current state
 */
function updateUI() {
    try {
        const noAgentsState = document.getElementById('no-agents-state');
        const agentsListState = document.getElementById('agents-list-state');
        
        if (appState.hasAgents) {
            // Show agents list
            if (noAgentsState) noAgentsState.style.display = 'none';
            if (agentsListState) agentsListState.style.display = 'block';
            populateAgentsTable();
        } else {
            // Show no agents state
            if (noAgentsState) noAgentsState.style.display = 'block';
            if (agentsListState) agentsListState.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

/**
 * Populate the agents table with mock data
 */
function populateAgentsTable() {
    try {
        const tableBody = document.getElementById('agents-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        mockAgents.forEach(agent => {
            const row = createAgentTableRow(agent);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error populating agents table:', error);
    }
}

/**
 * Create a table row for an agent
 * @param {Object} agent - Agent data object
 * @returns {HTMLElement} Table row element
 */
function createAgentTableRow(agent) {
    const row = document.createElement('tr');
    
    const statusClass = `status-badge status-badge--${agent.status}`;
    const statusText = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
    
    row.innerHTML = `
        <td><strong>${agent.name}</strong></td>
        <td>${agent.product}</td>
        <td>${agent.host}</td>
        <td>${agent.owner}</td>
        <td>${formatDate(agent.created)}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>
            <div class="action-buttons">
                <button class="btn btn--secondary btn--small" onclick="editAgent(${agent.id})">Edit</button>
                <button class="btn btn--secondary btn--small" onclick="evaluateAgent(${agent.id})">Evaluate</button>
                <button class="btn btn--secondary btn--small" onclick="viewMetrics(${agent.id})">Metrics</button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Format date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

/**
 * Handle template selection
 * @param {Event} event - Click event
 */
function handleTemplateSelection(event) {
    try {
        const templateCard = event.target.closest('.template-card');
        const templateTitle = templateCard.querySelector('.template-card__title').textContent;
        
        // Navigate to create form and pre-populate template
        navigateToSection('create');
        
        // Pre-populate form based on template
        setTimeout(() => {
            populateTemplateForm(templateTitle);
        }, 100);
        
    } catch (error) {
        console.error('Error handling template selection:', error);
    }
}

/**
 * Populate form with template data
 * @param {string} templateTitle - Title of the selected template
 */
function populateTemplateForm(templateTitle) {
    try {
        const templateSelect = document.getElementById('template');
        const agentNameInput = document.getElementById('agent-name');
        const productSelect = document.getElementById('product');
        const descriptionTextarea = document.getElementById('description');
        
        if (templateTitle.includes('Sales')) {
            if (templateSelect) templateSelect.value = 'sales';
            if (agentNameInput) agentNameInput.value = 'Sales Assistant Pro';
            if (productSelect) productSelect.value = 'CRM Suite';
            if (descriptionTextarea) descriptionTextarea.value = 'Automate lead qualification, follow-ups, and customer engagement workflows to increase sales efficiency.';
        } else if (templateTitle.includes('Research')) {
            if (templateSelect) templateSelect.value = 'research';
            if (agentNameInput) agentNameInput.value = 'Research Analyzer';
            if (productSelect) productSelect.value = 'Data Analytics';
            if (descriptionTextarea) descriptionTextarea.value = 'Gather, analyze, and synthesize information from multiple sources to provide comprehensive research insights.';
        } else if (templateTitle.includes('OpsGenie')) {
            if (templateSelect) templateSelect.value = 'opsgenie';
            if (agentNameInput) agentNameInput.value = 'Ops Monitor';
            if (productSelect) productSelect.value = 'Infrastructure';
            if (descriptionTextarea) descriptionTextarea.value = 'Monitor systems, handle incidents, and manage operational workflows to ensure system reliability.';
        }
    } catch (error) {
        console.error('Error populating template form:', error);
    }
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const agentData = {
            name: document.getElementById('agent-name').value,
            product: document.getElementById('product').value,
            host: document.getElementById('host').value,
            owner: document.getElementById('owner').value,
            createdDate: document.getElementById('created-date').value,
            signoff: document.getElementById('signoff').value,
            description: document.getElementById('description').value,
            template: document.getElementById('template').value
        };
        
        // Validate required fields
        const requiredFields = ['name', 'product', 'host', 'owner', 'createdDate', 'signoff'];
        const missingFields = requiredFields.filter(field => !agentData[field]);
        
        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }
        
        // Simulate agent creation
        console.log('Creating agent with data:', agentData);
        alert(`Agent "${agentData.name}" created successfully!`);
        
        // Reset form
        event.target.reset();
        
        // Set default date again
        const createdDateInput = document.getElementById('created-date');
        if (createdDateInput) {
            const today = new Date().toISOString().split('T')[0];
            createdDateInput.value = today;
        }
        
        // Navigate to agents list if demo data is enabled
        if (appState.hasAgents) {
            navigateToSection('agents');
        }
        
    } catch (error) {
        console.error('Error handling form submission:', error);
        alert('Error creating agent. Please try again.');
    }
}

/**
 * Agent action handlers
 */

/**
 * Edit agent handler
 * @param {number} agentId - ID of the agent to edit
 */
function editAgent(agentId) {
    try {
        const agent = mockAgents.find(a => a.id === agentId);
        if (agent) {
            alert(`Editing agent: ${agent.name}`);
            // In a real application, this would open the edit form
        }
    } catch (error) {
        console.error('Error editing agent:', error);
    }
}

/**
 * Evaluate agent handler
 * @param {number} agentId - ID of the agent to evaluate
 */
function evaluateAgent(agentId) {
    try {
        const agent = mockAgents.find(a => a.id === agentId);
        if (agent) {
            alert(`Starting evaluation for: ${agent.name}`);
            // In a real application, this would start the evaluation process
        }
    } catch (error) {
        console.error('Error evaluating agent:', error);
    }
}

/**
 * View metrics handler
 * @param {number} agentId - ID of the agent to view metrics for
 */
function viewMetrics(agentId) {
    try {
        const agent = mockAgents.find(a => a.id === agentId);
        if (agent) {
            alert(`Viewing metrics for: ${agent.name}`);
            navigateToSection('metrics');
        }
    } catch (error) {
        console.error('Error viewing metrics:', error);
    }
}

/**
 * Save application state to localStorage
 */
function saveAppState() {
    try {
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('agentPlatformState', JSON.stringify(appState));
        }
    } catch (error) {
        console.error('Error saving app state:', error);
    }
}

/**
 * Load application state from localStorage
 */
function loadAppState() {
    try {
        if (typeof Storage !== 'undefined') {
            const savedState = localStorage.getItem('agentPlatformState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                appState = { ...appState, ...parsedState };
            }
        }
    } catch (error) {
        console.error('Error loading app state:', error);
        // Reset to default state if loading fails
        appState = {
            hasAgents: false,
            currentSection: 'agents'
        };
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make functions available globally for onclick handlers
window.editAgent = editAgent;
window.evaluateAgent = evaluateAgent;
window.viewMetrics = viewMetrics;
window.handleModelSwitch = handleModelSwitch;
window.handleOptimizationAction = handleOptimizationAction;
window.handleTestScenario = handleTestScenario;
