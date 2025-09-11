'use strict';

/**
 * Application state and data management
 */
class AgentManager {
    constructor() {
        this.agents = this.loadAgents();
        this.currentView = 'dashboard';
        this.onboardingStep = 0;
        this.isFirstVisit = this.checkFirstVisit();
        this.helpMenuOpen = false;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.renderAgentsTable();
        this.checkAgentsState();
        this.initializeCharts();
        this.updatePreview();
        this.updateManifest(); // Initialize manifest
        this.updateConfigManifest(); // Initialize config manifest
        this.syncDashboardMetrics(); // Sync dashboard metrics with KPIs
        
        // Initialize Evaluate Agent tasks so they're available immediately
        this.populateEvaluateTasks();
        
        // Show onboarding for first-time users
        if (this.isFirstVisit) {
            setTimeout(() => this.showOnboarding(), 1000);
        }
    }

    /**
     * Load agents from localStorage with fallback to sample data
     */
    loadAgents() {
        try {
            const stored = localStorage.getItem('agents');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading agents from localStorage:', error);
        }

        // Sample data for demonstration
        return [
            {
                id: 1,
                name: 'BizChat',
                product: 'M365',
                host: 'BizChat',
                owner: 'System',
                status: 'Active',
                successRate: 96.5,
                responseTime: 1.1,
                lastActive: '2024-12-04',
                createdDate: '2024-11-15',
                interactions: 2847
            },
            {
                id: 2,
                name: 'LearningAgent',
                product: 'M365',
                host: 'Outlook',
                owner: 'AI Team',
                status: 'Active',
                successRate: 92.8,
                responseTime: 1.3,
                lastActive: '2024-12-04',
                createdDate: '2024-11-20',
                interactions: 1653
            },
            {
                id: 3,
                name: 'SampleAgent',
                product: 'M365',
                host: 'BizChat',
                owner: 'Dev Team',
                status: 'Testing',
                successRate: 89.2,
                responseTime: 1.5,
                lastActive: '2024-12-03',
                createdDate: '2024-11-25',
                interactions: 892
            },
            {
                id: 4,
                name: 'CustomerSupportBot',
                product: 'Teams',
                host: 'BizChat',
                owner: 'Support Team',
                status: 'Active',
                successRate: 94.7,
                responseTime: 0.9,
                lastActive: '2024-12-04',
                createdDate: '2024-10-30',
                interactions: 4156
            }
        ];
    }

    /**
     * Save agents to localStorage
     */
    saveAgents() {
        try {
            localStorage.setItem('agents', JSON.stringify(this.agents));
        } catch (error) {
            console.error('Error saving agents to localStorage:', error);
        }
    }

    /**
     * Setup event listeners for navigation and interactions
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Lifecycle steps
        document.querySelectorAll('.lifecycle-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepType = step.dataset.step;
                this.handleLifecycleStep(stepType);
            });
        });

        // Form inputs for live preview and manifest generation
        document.getElementById('short-name')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('full-name')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('agent-version')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('branch-name')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('agent-description')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('deployment-target-date')?.addEventListener('input', () => this.updateManifest());
        document.getElementById('plugin-features')?.addEventListener('change', () => this.updateManifest());
        document.getElementById('headless-agent')?.addEventListener('change', () => this.updateManifest());
        
        // Add event listeners for new form fields
        document.querySelectorAll('input[name="highest-ring"]').forEach(input => {
            input.addEventListener('change', () => this.updateManifest());
        });
        document.querySelectorAll('input[name="agent-type"]').forEach(input => {
            input.addEventListener('change', () => this.updateManifest());
        });
        
        // Configuration form event listeners
        document.getElementById('config-short-name')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-full-name')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-agent-version')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-branch-name')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-agent-description')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-deployment-target-date')?.addEventListener('input', () => this.updateConfigManifest());
        document.getElementById('config-plugin-features')?.addEventListener('change', () => this.updateConfigManifest());
        document.getElementById('config-headless-agent')?.addEventListener('change', () => this.updateConfigManifest());
        
        document.querySelectorAll('input[name="config-highest-ring"]').forEach(input => {
            input.addEventListener('change', () => this.updateConfigManifest());
        });
        document.querySelectorAll('input[name="config-agent-type"]').forEach(input => {
            input.addEventListener('change', () => this.updateConfigManifest());
        });
        
        // Legacy form inputs
        document.getElementById('agent-name')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('agent-description')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('product-select')?.addEventListener('change', () => this.updatePreview());
        document.getElementById('host-select')?.addEventListener('change', () => this.updatePreview());

        // Agent form submission
        document.querySelector('.agent-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAgent();
        });

        // Search functionality
        document.querySelector('.search-input')?.addEventListener('input', (e) => {
            this.filterAgents(e.target.value);
        });

        // Filter dropdown functionality
        document.querySelector('.filter-select')?.addEventListener('change', (e) => {
            this.filterAgentsByProduct(e.target.value);
        });
    }

    /**
     * Switch between different views
     */
    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // For configure view, don't highlight any nav link since it's not in the main nav
        if (view !== 'configure') {
            const navLink = document.querySelector(`[data-view="${view}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
        }

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Special handling for specific views
        if (view === 'tprompt') {
            // Initialize with tasks tab active and populate tasks immediately
            this.switchEvaluateTab('tasks');
            // Ensure tasks are populated even if Configure Agent hasn't been visited
            setTimeout(() => {
                this.populateEvaluateTasks();
            }, 100);
        } else if (view === 'configure') {
            // Keep existing configure logic
        }

        // Update page title
        const titles = {
            dashboard: 'Agent Dashboard',
            create: 'Create New Agent',
            configure: 'Configure Agent',
            metrics: 'Performance Metrics',
            tprompt: 'Evaluate Agent'
        };
        document.getElementById('page-title').textContent = titles[view] || 'Dashboard';

        this.currentView = view;

        // Initialize view-specific functionality
        if (view === 'metrics') {
            this.initializeCharts();
            this.renderMetricsTable();
        } else if (view === 'tprompt') {
            this.populateEvaluateTasks();
        }
    }

    /**
     * Switch between configure agent tabs
     */
    switchConfigureTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="agentManager.switchConfigureTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`configure-${tabName}-tab`).classList.add('active');

        // Populate tasks when tasks tab is selected
        if (tabName === 'tasks') {
            this.populateConfigureTasks();
        }
    }

    /**
     * Switch between evaluate agent tabs
     */
    switchEvaluateTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.evaluate-tabs .tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="agentManager.switchEvaluateTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('#tprompt-view .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`evaluate-${tabName}-tab`).classList.add('active');

        // Populate tasks when tasks tab is selected
        if (tabName === 'tasks') {
            this.populateEvaluateTasks();
        }
    }

    /**
     * Switch evaluation tabs in the evaluate models page
     */
    switchEvaluationTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.eval-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="agentManager.switchEvaluationTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.eval-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    /**
     * Switch T-Prompt tabs (Copilot Playground, T-Prompt, Quick Actions)
     */
    switchTPromptTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tprompt-nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="switchTPromptTab('${tabName}')"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tprompt-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tprompt-${tabName}-tab`).classList.add('active');
    }

    /**
     * Handle quick action clicks
     */
    quickAction(actionType, template = null) {
        console.log(`Quick action triggered: ${actionType}`, template ? `with template: ${template}` : '');
        
        switch(actionType) {
            case 'compareModels':
                this.showToast('Model comparison functionality will be available in external playground', 'info');
                break;
                
            case 'benchmarkModel':
                this.showToast('Model benchmarking functionality will be available in external playground', 'info');
                break;
                
            case 'modelHealth':
                this.showToast('Running model health check...', 'info');
                setTimeout(() => {
                    this.showToast('All models are healthy and operational', 'success');
                }, 2000);
                break;
                
            case 'loadTemplate':
                this.showToast('Template loading functionality will be available in external playground', 'info');
                break;
                
            case 'promptGenerator':
                this.showToast('Prompt generator functionality will be available in external playground', 'info');
                break;
                
            case 'batchEvaluation':
                this.showToast('Batch evaluation functionality will be available in external playground', 'info');
                break;
                
            case 'exportResults':
                this.exportEvaluationResults();
                break;
                
            default:
                this.showToast(`Action "${actionType}" not yet implemented`, 'warning');
        }
    }

    /**
     * Load evaluation template based on type
     */
    loadEvaluationTemplate(templateType) {
        const templates = {
            'customer-service': {
                name: 'Customer Service Evaluation',
                prompt: 'You are a customer service representative. Help customers with their inquiries professionally and efficiently.',
                toast: 'Customer service evaluation template loaded'
            },
            'code-generation': {
                name: 'Code Generation Evaluation',
                prompt: 'You are a programming assistant. Generate clean, efficient, and well-documented code.',
                toast: 'Code generation evaluation template loaded'
            },
            'data-analysis': {
                name: 'Data Analysis Evaluation',
                prompt: 'You are a data analyst. Analyze the provided data and generate meaningful insights.',
                toast: 'Data analysis evaluation template loaded'
            }
        };
        
        const template = templates[templateType];
        if (template) {
            this.showToast(template.toast, 'success');
            // Here you would actually populate the evaluation form with the template data
        }
    }

    /**
     * Export evaluation results
     */
    exportEvaluationResults() {
        const data = {
            timestamp: new Date().toISOString(),
            evaluations: [
                {
                    name: 'Email Assistant Test',
                    model: 'dev-gpt-4',
                    score: 8.5,
                    temperature: 0.3
                }
            ]
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluation-results-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Evaluation results exported successfully', 'success');
    }

    /**
     * Launch Playground with agent-specific config
     */
    launchPlayground() {
        this.showToast('Launching external Playground with agent-specific configuration...', 'info');
        
        // Simulate loading session
        setTimeout(() => {
            this.showToast('External Playground session launched successfully', 'success');
            // Here you would implement the actual external playground launch logic
            // For example, opening a new window to the external playground
            // window.open('https://playground.microsoft.com/', '_blank');
        }, 1500);
    }

    /**
     * Open Playground Session for GitHub Copilot agent
     */
    openPlaygroundSession() {
        this.showToast('Opening external Copilot Playground session...', 'info');
        
        // Simulate session loading
        setTimeout(() => {
            this.showToast('External Playground session opened with preloaded configuration', 'success');
            // Here you would implement logic to open external playground with config
            // window.open('https://playground.microsoft.com/copilot', '_blank');
        }, 1000);
    }

    /**
     * View Previous Evaluation Results
     */
    viewPreviousResults() {
        this.showToast('Loading previous evaluation results...', 'info');
        
        // Simulate loading results
        setTimeout(() => {
            // Create and show a modal with results
            this.showResultsModal();
        }, 800);
    }

    /**
     * Show Results Modal
     */
    showResultsModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('results-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'results-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Previous Evaluation Results</h3>
                        <button class="modal-close" onclick="this.closest('#results-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="result-summary">
                            <h4>Last Evaluation Run</h4>
                            <div class="result-metrics">
                                <div class="metric">
                                    <span class="metric-label">Latency:</span>
                                    <span class="metric-value">245ms</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Accuracy:</span>
                                    <span class="metric-value">94.2%</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Structured Output:</span>
                                    <span class="metric-value">Valid</span>
                                </div>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button class="btn-outline" onclick="window.open('#', '_blank')">View Full Logs</button>
                            <button class="btn-outline" onclick="window.open('#', '_blank')">Open Sydney Trace</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(modal);
        this.showToast('Previous evaluation results loaded', 'success');
    }

    /**
     * Open Learning Resources
     */
    openLearningResources() {
        this.showToast('Opening learning resources...', 'info');
        
        // Simulate opening resources
        setTimeout(() => {
            // Create and show resources modal
            this.showLearningResourcesModal();
        }, 500);
    }

    /**
     * Show Learning Resources Modal
     */
    showLearningResourcesModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('learning-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'learning-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Learning Resources</h3>
                        <button class="modal-close" onclick="this.closest('#learning-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="resource-list">
                            <div class="resource-item">
                                <h4>🎓 AI Academy</h4>
                                <p>Comprehensive courses on prompt engineering and AI agent development</p>
                                <button class="btn-primary" onclick="window.open('#', '_blank')">Access Academy</button>
                            </div>
                            <div class="resource-item">
                                <h4>🎪 Demo Fest</h4>
                                <p>Interactive demonstrations and hands-on workshops</p>
                                <button class="btn-primary" onclick="window.open('#', '_blank')">Join Demo Fest</button>
                            </div>
                            <div class="resource-item">
                                <h4>🏥 Prompt Clinic</h4>
                                <p>Get expert feedback on your prompts and agent configurations</p>
                                <button class="btn-primary" onclick="window.open('#', '_blank')">Visit Clinic</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(modal);
        this.showToast('Learning resources opened', 'success');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                toast.style.backgroundColor = '#4CAF50';
                break;
            case 'warning':
                toast.style.backgroundColor = '#FF9800';
                break;
            case 'error':
                toast.style.backgroundColor = '#F44336';
                break;
            default:
                toast.style.backgroundColor = '#2196F3';
        }
        
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Select a prompt in the evaluation interface
     */
    selectPrompt(promptId) {
        // Update selected row
        document.querySelectorAll('.prompt-row').forEach(row => {
            row.classList.remove('active');
        });
        
        // Find and activate the clicked row
        const clickedRow = event.target.closest('.prompt-row');
        if (clickedRow) {
            clickedRow.classList.add('active');
        }

        // Update prompt details panel (mock data for now)
        this.updatePromptDetails(promptId);
    }

    /**
     * Update prompt details panel with mock data
     */
    updatePromptDetails(promptId) {
        // This would normally fetch real data
        const mockPromptData = {
            1: {
                name: "Email Assistant Test",
                badge: "New Prompt",
                model: "dev-gpt-41-shortco-2025-04-14",
                temperature: 0.3,
                maxTokens: 200,
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0
            }
        };

        const data = mockPromptData[promptId] || mockPromptData[1];
        
        // Update UI elements
        document.querySelector('.prompt-info h3').textContent = `Prompt ${promptId}`;
        document.querySelector('.prompt-badge').textContent = data.badge;
        
        // Update model parameters
        const sliders = document.querySelectorAll('.parameter-slider');
        const values = document.querySelectorAll('.parameter-value');
        
        sliders[0].value = data.temperature;
        values[0].textContent = data.temperature;
        
        sliders[1].value = data.maxTokens;
        values[1].textContent = data.maxTokens;
        
        sliders[2].value = data.topP;
        values[2].textContent = data.topP;
        
        sliders[3].value = data.frequencyPenalty;
        values[3].textContent = data.frequencyPenalty;
        
        sliders[4].value = data.presencePenalty;
        values[4].textContent = data.presencePenalty;
    }

    /**
     * Initialize evaluation interface
     */
    initializeEvaluation() {
        // Initialize parameter sliders
        document.querySelectorAll('.parameter-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const valueDisplay = e.target.parentElement.querySelector('.parameter-value');
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
            });
        });

        // Initialize select all checkbox
        const selectAllCheckbox = document.querySelector('.select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.prompt-row input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }

        // Initialize default selection
        this.selectPrompt(1);
    }

    /**
     * Handle lifecycle step clicks with guidance
     */
    handleLifecycleStep(step) {
        // Update step indicators
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector(`[data-step="${step}"]`).classList.add('active');

        // Map steps to views
        const stepViewMap = {
            create: 'create',
            configure: 'configure',
            evaluate: 'playground',
            'evaluate-prompts': 'tprompt',
            deploy: 'dashboard',
            monitor: 'metrics'
        };

        if (stepViewMap[step]) {
            this.switchView(stepViewMap[step]);
            
            // Show guidance for new users
            if (this.isFirstVisit || !localStorage.getItem(`guidance_${step}_shown`)) {
                setTimeout(() => {
                    this.showStepGuidance(step);
                    localStorage.setItem(`guidance_${step}_shown`, 'true');
                }, 500);
            }
        }
    }

    /**
     * Check if agents exist and show appropriate state
     */
    checkAgentsState() {
        const noAgentsState = document.getElementById('no-agents-state');
        const agentsState = document.getElementById('agents-state');

        if (this.agents.length === 0) {
            noAgentsState.style.display = 'block';
            agentsState.style.display = 'none';
        } else {
            noAgentsState.style.display = 'none';
            agentsState.style.display = 'block';
        }
    }

    /**
     * Render the agents table with action buttons
     */
    renderAgentsTable() {
        const tbody = document.getElementById('agents-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.agents.map(agent => `
            <tr data-agent-id="${agent.id}">
                <td>
                    <div class="agent-name-cell">
                        <div class="agent-avatar">🤖</div>
                        <span class="agent-name">${agent.name}</span>
                    </div>
                </td>
                <td><span class="product-tag">${agent.product}</span></td>
                <td><span class="status-badge status-${agent.status.toLowerCase()}">${agent.status}</span></td>
                <td>
                    <div class="success-rate">
                        <span>${agent.successRate}%</span>
                        <div class="rate-bar">
                            <div class="rate-fill" style="width: ${agent.successRate}%"></div>
                        </div>
                    </div>
                </td>
                <td>${this.formatDate(agent.lastActive)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="agentManager.editAgent(${agent.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="agentManager.evaluateAgent(${agent.id})" title="Evaluate">🧪</button>
                        <button class="btn-icon" onclick="agentManager.viewMetrics(${agent.id})" title="Metrics">📊</button>
                        <button class="btn-icon" onclick="agentManager.deployAgent(${agent.id})" title="Deploy">🚀</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Update the dynamic manifest based on form inputs
     */
    updateManifest() {
        const shortName = document.getElementById('short-name')?.value || 'EAgent';
        const fullName = document.getElementById('full-name')?.value || 'EmailAgent';
        const agentVersion = document.getElementById('agent-version')?.value || '1.0.0';
        const branchName = document.getElementById('branch-name')?.value || 'main';
        const description = document.getElementById('agent-description')?.value || '';
        const deploymentDate = document.getElementById('deployment-target-date')?.value || '';
        
        // Get selected highest ring
        const selectedRing = document.querySelector('input[name="highest-ring"]:checked')?.value || 'DEV';
        
        // Get agent type
        const agentType = document.querySelector('input[name="agent-type"]:checked')?.value || '1P';
        
        const pluginSelect = document.getElementById('plugin-features');
        const selectedPlugins = pluginSelect ? Array.from(pluginSelect.selectedOptions).map(opt => opt.value) : ['canvas', 'code_interpreter', 'fetch_enterprise_chat', 'image_understanding'];
        
        // Generate plugins object
        const pluginsObject = {};
        selectedPlugins.forEach(plugin => {
            pluginsObject[plugin] = {};
        });
        
        // Update manifest JSON
        const manifest = {
            version: agentVersion,
            name: shortName,
            display_name: fullName,
            description: description,
            branch: branchName,
            deployment_target: deploymentDate,
            highest_allowed_ring: selectedRing,
            agent_type: agentType,
            parent_agent: {
                name: "BaseChatAgent"
            },
            patches: [
                {
                    op: "add",
                    path: "/chat/orchestration/plugins",
                    value: pluginsObject
                }
            ]
        };
        
        // Remove empty fields
        Object.keys(manifest).forEach(key => {
            if (manifest[key] === '' || manifest[key] === null) {
                delete manifest[key];
            }
        });
        
        const manifestCode = document.getElementById('manifest-code');
        if (manifestCode) {
            manifestCode.textContent = JSON.stringify(manifest, null, 2);
        }
        
        // Update line numbers
        this.updateLineNumbers();
        
        // Update plugin selection count
        const pluginCount = document.querySelector('.plugin-selection small');
        if (pluginCount) {
            pluginCount.textContent = `${selectedPlugins.length} Item(s) Selected`;
        }
    }
    
    /**
     * Update line numbers in manifest editor
     */
    updateLineNumbers() {
        const manifestCode = document.getElementById('manifest-code');
        const lineNumbers = document.getElementById('manifest-line-numbers');
        
        if (manifestCode && lineNumbers) {
            const lines = manifestCode.textContent.split('\n');
            lineNumbers.innerHTML = lines.map((_, index) => `<div>${index + 1}</div>`).join('');
        }
    }

    /**
     * Update configuration manifest editor
     */
    updateConfigManifest() {
        const shortName = document.getElementById('config-short-name')?.value || 'EmailAgent';
        const fullName = document.getElementById('config-full-name')?.value || 'Email Assistant';
        const agentVersion = document.getElementById('config-agent-version')?.value || '1.0.0';
        const branchName = document.getElementById('config-branch-name')?.value || 'main';
        const description = document.getElementById('config-agent-description')?.value || '';
        const deploymentDate = document.getElementById('config-deployment-target-date')?.value || '';
        
        // Get selected highest ring
        const selectedRing = document.querySelector('input[name="config-highest-ring"]:checked')?.value || 'DEV';
        
        // Get agent type
        const agentType = document.querySelector('input[name="config-agent-type"]:checked')?.value || '1P';
        
        const pluginSelect = document.getElementById('config-plugin-features');
        const selectedPlugins = pluginSelect ? Array.from(pluginSelect.selectedOptions).map(opt => opt.value) : ['canvas', 'code_interpreter', 'email_search'];
        
        // Generate plugins object
        const pluginsObject = {};
        selectedPlugins.forEach(plugin => {
            pluginsObject[plugin] = {};
        });
        
        // Update manifest JSON
        const manifest = {
            version: agentVersion,
            name: shortName,
            display_name: fullName,
            description: description,
            branch: branchName,
            deployment_target: deploymentDate,
            highest_allowed_ring: selectedRing,
            agent_type: agentType,
            parent_agent: {
                name: "BaseChatAgent"
            },
            patches: [
                {
                    op: "add",
                    path: "/chat/orchestration/plugins",
                    value: pluginsObject
                }
            ]
        };
        
        // Remove empty fields
        Object.keys(manifest).forEach(key => {
            if (manifest[key] === '' || manifest[key] === null) {
                delete manifest[key];
            }
        });
        
        const manifestCode = document.getElementById('config-manifest-code');
        if (manifestCode) {
            manifestCode.textContent = JSON.stringify(manifest, null, 2);
        }
        
        // Update line numbers for config manifest
        const configLineNumbers = document.getElementById('config-manifest-line-numbers');
        if (configLineNumbers && manifestCode) {
            const lines = manifestCode.textContent.split('\n');
            configLineNumbers.innerHTML = lines.map((_, index) => `<div>${index + 1}</div>`).join('');
        }
        
        // Update plugin selection count
        const pluginCount = document.querySelector('#config-plugin-features + small');
        if (pluginCount) {
            pluginCount.textContent = `${selectedPlugins.length} Item(s) Selected`;
        }
    }

    /**
     * Update agent configuration
     */
    updateAgentConfiguration() {
        const shortName = document.getElementById('config-short-name')?.value;
        const fullName = document.getElementById('config-full-name')?.value;
        const agentVersion = document.getElementById('config-agent-version')?.value;
        const branchName = document.getElementById('config-branch-name')?.value;
        const description = document.getElementById('config-agent-description')?.value;
        const deploymentDate = document.getElementById('config-deployment-target-date')?.value;
        
        if (!shortName || !fullName) {
            alert('Please fill in the required fields (Agent Name and Display Name)');
            return;
        }

        // Find the agent being configured and update it
        if (this.currentEditingAgent) {
            const agentIndex = this.agents.findIndex(agent => agent.id === this.currentEditingAgent.id);
            if (agentIndex !== -1) {
                // Update the agent with new configuration
                this.agents[agentIndex] = {
                    ...this.agents[agentIndex],
                    name: shortName,
                    fullName: fullName,
                    version: agentVersion || '1.0.0',
                    branch: branchName || 'main',
                    description: description,
                    deploymentDate: deploymentDate,
                    lastActive: new Date().toISOString().split('T')[0]
                };
                
                // Save to localStorage
                localStorage.setItem('agents', JSON.stringify(this.agents));
                
                // Update the display
                this.renderAgentsTable();
                
                // Show success message
                alert('Agent configuration updated successfully!');
                
                // Switch back to dashboard
                this.switchView('dashboard');
            }
        }
    }

    /**
     * Populate configuration form with agent data
     */
    populateConfigForm(agent) {
        this.currentEditingAgent = agent;
        
        // Populate form fields
        if (document.getElementById('config-short-name')) {
            document.getElementById('config-short-name').value = agent.name || '';
        }
        if (document.getElementById('config-full-name')) {
            document.getElementById('config-full-name').value = agent.fullName || '';
        }
        if (document.getElementById('config-agent-version')) {
            document.getElementById('config-agent-version').value = agent.version || '1.0.0';
        }
        if (document.getElementById('config-branch-name')) {
            document.getElementById('config-branch-name').value = agent.branch || 'main';
        }
        if (document.getElementById('config-agent-description')) {
            document.getElementById('config-agent-description').value = agent.description || '';
        }
        if (document.getElementById('config-deployment-target-date')) {
            document.getElementById('config-deployment-target-date').value = agent.deploymentDate || '';
        }
        
        // Update the manifest immediately
        this.updateConfigManifest();
    }

    /**
     * Create a new agent from enhanced form data
     */
    createAgent() {
        // Get enhanced form data
        const shortName = document.getElementById('short-name')?.value;
        const fullName = document.getElementById('full-name')?.value;
        const agentVersion = document.getElementById('agent-version')?.value;
        const branchName = document.getElementById('branch-name')?.value;
        const description = document.getElementById('agent-description')?.value;
        const deploymentDate = document.getElementById('deployment-target-date')?.value;
        const isHeadless = document.getElementById('headless-agent')?.checked;
        const agentId = document.getElementById('agent-id')?.value;
        const websiteUrl = document.getElementById('website-url')?.value;
        const privacyUrl = document.getElementById('privacy-url')?.value;
        const termsUrl = document.getElementById('terms-url')?.value;
        const appStoreDescription = document.getElementById('app-store-description')?.value;
        const applicationId = document.getElementById('application-id')?.value;
        const titleId = document.getElementById('title-id')?.value;
        const developer = document.getElementById('developer')?.value;
        
        // Get selected rings
        const selectedRings = Array.from(document.querySelectorAll('input[name="highest-ring"]:checked')).map(input => input.value);
        const highestRing = document.querySelector('input[name="highest-ring"]:checked')?.value;
        
        // Get agent type
        const agentType = document.querySelector('input[name="agent-type"]:checked')?.value;
        
        // Get selected plugins
        const pluginSelect = document.getElementById('plugin-features');
        const selectedPlugins = pluginSelect ? Array.from(pluginSelect.selectedOptions).map(opt => opt.value) : [];

        if (!shortName || !fullName) {
            alert('Please fill in the required fields (Short Name and Full Name)');
            return;
        }

        const newAgent = {
            id: Date.now(),
            name: shortName,
            fullName: fullName,
            version: agentVersion || '1.0.0',
            branch: branchName || 'main',
            description: description || appStoreDescription || 'No description provided',
            product: 'M365', // Default for new enhanced agents
            host: 'BizChat', // Default for new enhanced agents
            owner: 'Current User',
            status: 'Testing',
            successRate: 0,
            responseTime: 0,
            lastActive: new Date().toISOString().split('T')[0],
            createdDate: new Date().toISOString().split('T')[0],
            interactions: 0,
            // Enhanced fields
            deploymentDate,
            isHeadless,
            agentId,
            websiteUrl,
            privacyUrl,
            termsUrl,
            highestRing,
            agentType,
            selectedRings,
            applicationId,
            titleId,
            developer,
            plugins: selectedPlugins
        };

        this.agents.push(newAgent);
        this.saveAgents();
        this.renderAgentsTable();
        this.checkAgentsState();
        
        // Show success message and redirect
        alert('Agent created successfully!');
        this.switchView('dashboard');
        
        // Reset form
        document.querySelector('.agent-form').reset();
        this.updateManifest();
    }

    /**
     * Update the agent preview in create view
     */
    updatePreview() {
        const name = document.getElementById('agent-name')?.value || 'Your Agent';
        const description = document.getElementById('agent-description')?.value || 'Agent description will appear here...';
        const product = document.getElementById('product-select')?.value || 'Product';
        const host = document.getElementById('host-select')?.value || 'Host';

        const previewName = document.getElementById('preview-name');
        const previewDescription = document.getElementById('preview-description');
        const previewProduct = document.getElementById('preview-product');
        const previewHost = document.getElementById('preview-host');

        if (previewName) previewName.textContent = name;
        if (previewDescription) previewDescription.textContent = description;
        if (previewProduct) previewProduct.textContent = product;
        if (previewHost) previewHost.textContent = host;
    }

    /**
     * Filter agents based on search query
     */
    filterAgents(query) {
        const productFilter = document.querySelector('.filter-select')?.value || '';
        let filteredAgents = this.agents;

        // Apply search filter
        if (query.trim()) {
            filteredAgents = filteredAgents.filter(agent => 
                agent.name.toLowerCase().includes(query.toLowerCase()) ||
                agent.product.toLowerCase().includes(query.toLowerCase()) ||
                agent.owner.toLowerCase().includes(query.toLowerCase()) ||
                agent.status.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Apply product filter
        if (productFilter) {
            filteredAgents = filteredAgents.filter(agent => 
                agent.product === productFilter
            );
        }

        this.renderFilteredAgents(filteredAgents);
    }

    /**
     * Filter agents by product
     */
    filterAgentsByProduct(product) {
        const searchQuery = document.querySelector('.search-input')?.value || '';
        let filteredAgents = this.agents;

        // Apply product filter
        if (product) {
            filteredAgents = filteredAgents.filter(agent => 
                agent.product === product
            );
        }

        // Apply search filter
        if (searchQuery.trim()) {
            filteredAgents = filteredAgents.filter(agent => 
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.status.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        this.renderFilteredAgents(filteredAgents);
    }

    /**
     * Clear all filters and show all agents
     */
    clearFilters() {
        document.querySelector('.search-input').value = '';
        document.querySelector('.filter-select').value = '';
        this.renderAgentsTable();
    }

    /**
     * Render filtered agents
     */
    renderFilteredAgents(agents) {
        const tbody = document.getElementById('agents-table-body');
        if (!tbody) return;

        if (agents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-results">
                        <div class="no-results-content">
                            <div class="no-results-icon">🔍</div>
                            <h4>No agents found</h4>
                            <p>Try adjusting your search or filter criteria</p>
                            <button class="btn-primary" onclick="agentManager.clearFilters()">Clear Filters</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = agents.map(agent => `
            <tr data-agent-id="${agent.id}">
                <td>
                    <div class="agent-name-cell">
                        <div class="agent-avatar">🤖</div>
                        <span class="agent-name">${agent.name}</span>
                    </div>
                </td>
                <td><span class="product-tag">${agent.product}</span></td>
                <td><span class="status-badge status-${agent.status.toLowerCase()}">${agent.status}</span></td>
                <td>
                    <div class="success-rate">
                        <span>${agent.successRate}%</span>
                        <div class="rate-bar">
                            <div class="rate-fill" style="width: ${agent.successRate}%"></div>
                        </div>
                    </div>
                </td>
                <td>${this.formatDate(agent.lastActive)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="agentManager.editAgent(${agent.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="agentManager.evaluateAgent(${agent.id})" title="Evaluate">🧪</button>
                        <button class="btn-icon" onclick="agentManager.viewMetrics(${agent.id})" title="Metrics">📊</button>
                        <button class="btn-icon" onclick="agentManager.deployAgent(${agent.id})" title="Deploy">🚀</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Initialize charts for metrics view
     */
    initializeCharts() {
        // Initialize all metrics charts with comprehensive data
        
        // 1. Engagement Chart (Line trend)
        const engagementCtx = document.getElementById('engagementChart');
        if (engagementCtx && !engagementCtx.chart) {
            engagementCtx.chart = new Chart(engagementCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'Avg Actions per User',
                        data: [2.1, 2.3, 2.2, 2.4, 2.6, 2.5, 2.4, 2.4],
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 3 }
                    }
                }
            });
        }

        // 2. Quality Chart (Stacked bar + line)
        const qualityCtx = document.getElementById('qualityChart');
        if (qualityCtx && !qualityCtx.chart) {
            qualityCtx.chart = new Chart(qualityCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Task Success',
                            data: [85, 87, 89, 88],
                            backgroundColor: '#4CAF50',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Groundedness',
                            data: [92, 91, 93, 94],
                            backgroundColor: '#2196F3',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Low Toxicity',
                            data: [98, 97, 98, 99],
                            backgroundColor: '#FF9800',
                            stack: 'Stack 0'
                        },
                        {
                            label: 'Overall Quality',
                            data: [87, 88, 90, 87],
                            type: 'line',
                            borderColor: '#9C27B0',
                            backgroundColor: 'transparent',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 100, position: 'left' },
                        y1: { type: 'linear', display: true, position: 'right', max: 100 }
                    }
                }
            });
        }

        // 3. Active User Trend (Multi-series line)
        const activeUserCtx = document.getElementById('activeUserChart');
        if (activeUserCtx && !activeUserCtx.chart) {
            activeUserCtx.chart = new Chart(activeUserCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'DAU',
                            data: [12500, 13200, 12800, 13500],
                            borderColor: '#4CAF50',
                            backgroundColor: 'transparent'
                        },
                        {
                            label: 'WAU',
                            data: [45000, 47500, 46200, 48000],
                            borderColor: '#2196F3',
                            backgroundColor: 'transparent'
                        },
                        {
                            label: 'MAU',
                            data: [125000, 128000, 132000, 135000],
                            borderColor: '#FF9800',
                            backgroundColor: 'transparent'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // 4. Citation Rate Trend (Line)
        const citationCtx = document.getElementById('citationChart');
        if (citationCtx && !citationCtx.chart) {
            citationCtx.chart = new Chart(citationCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'Citation Rate %',
                        data: [78, 82, 85, 83, 87, 89, 86, 88],
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: false, min: 70, max: 100 }
                    }
                }
            });
        }

        // 5. Queries Trend (Column with moving average)
        const queriesCtx = document.getElementById('queriesChart');
        if (queriesCtx && !queriesCtx.chart) {
            queriesCtx.chart = new Chart(queriesCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Total Queries',
                            data: [125000, 142000, 138000, 151000],
                            backgroundColor: '#2196F3'
                        },
                        {
                            label: 'Moving Average',
                            data: [125000, 133500, 135000, 139000],
                            type: 'line',
                            borderColor: '#FF5722',
                            backgroundColor: 'transparent',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true },
                        y1: { type: 'linear', display: false, position: 'right' }
                    }
                }
            });
        }

        // 6. Queries Per UU Trend (Line)
        const queriesPerUUCtx = document.getElementById('queriesPerUUChart');
        if (queriesPerUUCtx && !queriesPerUUCtx.chart) {
            queriesPerUUCtx.chart = new Chart(queriesPerUUCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'Queries per Unique User',
                        data: [8.2, 8.7, 8.4, 9.1, 9.3, 8.9, 9.2, 9.5],
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 12 }
                    }
                }
            });
        }

        // 7. Availability Trend (Line with SLO threshold)
        const availabilityCtx = document.getElementById('availabilityChart');
        if (availabilityCtx && !availabilityCtx.chart) {
            availabilityCtx.chart = new Chart(availabilityCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [
                        {
                            label: 'Availability %',
                            data: [99.95, 99.87, 99.92, 99.89, 99.97, 99.94, 99.91, 99.98],
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'SLO Threshold (99.9%)',
                            data: [99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9],
                            borderColor: '#FF5722',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: false, min: 99.8, max: 100 }
                    }
                }
            });
        }

        // 8. SAT Rate Trend (Line)
        const satRateCtx = document.getElementById('satRateChart');
        if (satRateCtx && !satRateCtx.chart) {
            satRateCtx.chart = new Chart(satRateCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'SAT Rate %',
                        data: [84, 86, 88, 85, 89, 91, 87, 90],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: false, min: 80, max: 95 }
                    }
                }
            });
        }

        // 9. Thumbs Up Per 100K Queries (Column)
        const thumbsUpCtx = document.getElementById('thumbsUpChart');
        if (thumbsUpCtx && !thumbsUpCtx.chart) {
            thumbsUpCtx.chart = new Chart(thumbsUpCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Thumbs Up per 100K',
                        data: [2340, 2580, 2720, 2650],
                        backgroundColor: '#4CAF50'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // 10. Thumbs Down Per 100K Queries (Column)
        const thumbsDownCtx = document.getElementById('thumbsDownChart');
        if (thumbsDownCtx && !thumbsDownCtx.chart) {
            thumbsDownCtx.chart = new Chart(thumbsDownCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Thumbs Down per 100K',
                        data: [420, 380, 350, 390],
                        backgroundColor: '#F44336'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // 11. Feedback Chart (Stacked bar)
        const feedbackCtx = document.getElementById('feedbackChart');
        if (feedbackCtx && !feedbackCtx.chart) {
            feedbackCtx.chart = new Chart(feedbackCtx, {
                type: 'bar',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Positive',
                            data: [1200, 1350, 1420, 1380],
                            backgroundColor: '#4CAF50'
                        },
                        {
                            label: 'Neutral',
                            data: [450, 420, 400, 430],
                            backgroundColor: '#FF9800'
                        },
                        {
                            label: 'Negative',
                            data: [180, 150, 140, 160],
                            backgroundColor: '#F44336'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                    }
                }
            });
        }

        // 12. Retention Ratio Chart (Line for WAU/MAU ratio)
        const retentionRatioCtx = document.getElementById('retentionRatioChart');
        if (retentionRatioCtx && !retentionRatioCtx.chart) {
            retentionRatioCtx.chart = new Chart(retentionRatioCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'WAU/MAU Ratio',
                        data: [0.36, 0.37, 0.35, 0.38, 0.39, 0.36, 0.38, 0.37],
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: false, min: 0.3, max: 0.5 }
                    }
                }
            });
        }

        // Initialize interactive controls
        this.initializeMetricsControls();
    }

    /**
     * Initialize metrics interactive controls
     */
    initializeMetricsControls() {
        // Feedback view toggle
        document.querySelectorAll('.feedback-controls .btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                document.querySelectorAll('.feedback-controls .btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.feedback-view').forEach(v => v.classList.remove('active'));
                document.getElementById(`feedback${view.charAt(0).toUpperCase() + view.slice(1)}`).classList.add('active');
            });
        });

        // Retention view toggle
        document.querySelectorAll('.retention-controls .btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                document.querySelectorAll('.retention-controls .btn-toggle').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.retention-view').forEach(v => v.classList.remove('active'));
                if (view === 'heatmap') {
                    document.getElementById('retentionHeatmap').classList.add('active');
                } else {
                    document.getElementById('retentionRatioChart').classList.add('active');
                }
            });
        });

        // Filter controls
        document.getElementById('time-filter')?.addEventListener('change', () => this.refreshMetrics());
        document.getElementById('agent-filter')?.addEventListener('change', () => this.refreshMetrics());
        document.getElementById('ring-filter')?.addEventListener('change', () => this.refreshMetrics());
    }

    /**
     * Refresh metrics data
     */
    refreshMetrics() {
        // Update KPI values with new data
        document.getElementById('kpi-engagement').textContent = (Math.random() * 2 + 1.5).toFixed(1);
        document.getElementById('kpi-quality').textContent = (Math.random() * 10 + 85).toFixed(1);
        document.getElementById('kpi-dau').textContent = (Math.random() * 5 + 10).toFixed(1) + 'K';
        document.getElementById('kpi-availability').textContent = (99.5 + Math.random() * 0.5).toFixed(1) + '%';
        
        // Update dashboard metrics to match
        document.getElementById('dashboard-engagement').textContent = document.getElementById('kpi-engagement').textContent;
        document.getElementById('dashboard-quality').textContent = document.getElementById('kpi-quality').textContent;
        document.getElementById('dashboard-dau').textContent = document.getElementById('kpi-dau').textContent;
        document.getElementById('dashboard-availability').textContent = document.getElementById('kpi-availability').textContent;
        
        // Note: In a real application, this would fetch new data and update all charts
        console.log('Metrics refreshed with current filter settings');
    }

    /**
     * Sync dashboard metrics with KPI values
     */
    syncDashboardMetrics() {
        // Ensure dashboard metrics match KPI values
        const engagement = document.getElementById('kpi-engagement')?.textContent || '2.4';
        const quality = document.getElementById('kpi-quality')?.textContent || '87.2';
        const dau = document.getElementById('kpi-dau')?.textContent || '12.5K';
        const availability = document.getElementById('kpi-availability')?.textContent || '99.8%';
        
        if (document.getElementById('dashboard-engagement')) {
            document.getElementById('dashboard-engagement').textContent = engagement;
        }
        if (document.getElementById('dashboard-quality')) {
            document.getElementById('dashboard-quality').textContent = quality;
        }
        if (document.getElementById('dashboard-dau')) {
            document.getElementById('dashboard-dau').textContent = dau;
        }
        if (document.getElementById('dashboard-availability')) {
            document.getElementById('dashboard-availability').textContent = availability;
        }
    }

    /**
     * Navigate to metrics page with focus on specific metric
     */
    navigateToMetrics(metricType) {
        // Switch to metrics view
        this.switchView('metrics');
        
        // Update lifecycle step to highlight "Agent Metrics"
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector('[data-step="monitor"]').classList.add('active');
        
        // Optional: Scroll to or highlight the specific metric chart
        setTimeout(() => {
            let targetChart = null;
            switch(metricType) {
                case 'engagement':
                    targetChart = document.getElementById('engagementChart');
                    break;
                case 'quality':
                    targetChart = document.getElementById('qualityChart');
                    break;
                case 'dau':
                    targetChart = document.getElementById('activeUserChart');
                    break;
                case 'availability':
                    targetChart = document.getElementById('availabilityChart');
                    break;
            }
            
            if (targetChart) {
                targetChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add temporary highlight effect
                const container = targetChart.closest('.chart-container');
                if (container) {
                    container.style.border = '2px solid var(--primary-color)';
                    container.style.borderRadius = '8px';
                    setTimeout(() => {
                        container.style.border = '';
                    }, 2000);
                }
            }
        }, 100);
    }

    /**
     * Render detailed metrics table
     */
    renderMetricsTable() {
        const tbody = document.getElementById('metrics-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.agents.map(agent => `
            <tr>
                <td>${agent.name}</td>
                <td>${agent.successRate}%</td>
                <td>${this.generateRandomScore(85, 95)}</td>
                <td>${(Math.random() * 2 + 1.5).toFixed(1)}</td>
                <td>${(Math.random() * 5 + 10).toFixed(1)}K</td>
                <td>${this.generateRandomScore(75, 90)}%</td>
                <td>${(99.5 + Math.random() * 0.5).toFixed(2)}%</td>
                <td>${this.generateRandomScore(80, 95)}%</td>
            </tr>
        `).join('');
    }

    /**
     * Populate tasks from Configure Agent section into Evaluate Agent Tasks section
     */
    populateEvaluateTasks() {
        const evaluateTasksBody = document.getElementById('evaluate-tasks-tbody');
        if (!evaluateTasksBody) return;

        // Define the evaluation step tasks
        const tasks = [
            {
                title: 'Step 1: Onboard Agent to Nexus',
                description: 'Create Agent Manifest and test using DevUI',
                badges: [
                    { text: 'Evaluation Step', class: 'evaluation' },
                    { text: 'Nexus Platform', class: 'nexus' }
                ],
                icon: '🤖',
                status: { name: 'completed', label: 'COMPLETED', color: '#d1fae5', textColor: '#065f46', progress: 100 },
                subtasks: [
                    { icon: '📋', text: 'Create Agent Manifest configuration' },
                    { icon: '🧪', text: 'Test manifest using DevUI' },
                    { icon: '✅', text: 'Validate agent configuration' }
                ],
                actions: [
                    { text: 'View Manifest', class: 'btn-outline btn-sm', onclick: 'viewManifest()' },
                    { text: 'Launch DevUI', class: 'btn-outline btn-sm', onclick: 'launchDevUI()' }
                ]
            },
            {
                title: 'Step 2: Generate Evaluation Dataset',
                description: 'Create comprehensive test scenarios and evaluation data',
                badges: [
                    { text: 'Evaluation Step', class: 'evaluation' },
                    { text: 'DataGen', class: 'datagen' }
                ],
                icon: '📊',
                status: { name: 'in-progress', label: 'IN PROGRESS', color: '#fef3c7', textColor: '#92400e', progress: 65 },
                subtasks: [
                    { icon: '🎯', text: 'Define test scenarios based on agent capabilities' },
                    { icon: '⚠️', text: 'Generate edge cases and failure scenarios' },
                    { icon: '📈', text: 'Validate dataset quality and coverage' }
                ],
                actions: [
                    { text: 'Generate Dataset', class: 'btn-primary btn-sm', onclick: 'generateDataset()' },
                    { text: 'View Samples', class: 'btn-outline btn-sm', onclick: 'viewDatasetSamples()' }
                ]
            },
            {
                title: 'Step 3: Generate Evaluation Metrics',
                description: 'Define custom quality metrics using CoMet platform',
                badges: [
                    { text: 'Evaluation Step', class: 'evaluation' },
                    { text: 'CoMet', class: 'comet' }
                ],
                icon: '�',
                status: { name: 'pending', label: 'PENDING', color: '#f3f4f6', textColor: '#374151', progress: 0 },
                subtasks: [
                    { icon: '🎯', text: 'Define business-specific metrics' },
                    { icon: '📊', text: 'Set quality thresholds and success criteria' },
                    { icon: '📋', text: 'Create custom evaluation scorecards' }
                ],
                actions: [
                    { text: 'Launch CoMet', class: 'btn-outline btn-sm', onclick: 'launchCoMet()' },
                    { text: 'View Templates', class: 'btn-outline btn-sm', onclick: 'viewMetricTemplates()' }
                ]
            },
            {
                title: 'Step 4: Test Model Performance',
                description: 'Validate agent performance using Playground and T-Prompt',
                badges: [
                    { text: 'Evaluation Step', class: 'evaluation' },
                    { text: 'Playground', class: 'playground' },
                    { text: 'T-Prompt', class: 'tprompt' }
                ],
                icon: '🧪',
                status: { name: 'pending', label: 'PENDING', color: '#f3f4f6', textColor: '#374151', progress: 0 },
                subtasks: [
                    { icon: '🎮', text: 'Test agent in Copilot Playground' },
                    { icon: '⚡', text: 'Optimize prompts using T-Prompt tools' },
                    { icon: '📊', text: 'Measure and analyze performance metrics' }
                ],
                actions: [
                    { text: 'Launch Playground', class: 'btn-outline btn-sm', onclick: 'launchPlayground()' },
                    { text: 'Run T-Prompt', class: 'btn-outline btn-sm', onclick: 'runTPrompt()' }
                ]
            },
            {
                title: 'Step 5: Run SEVAL Evaluation',
                description: 'Final comprehensive evaluation before production',
                badges: [
                    { text: 'Evaluation Step', class: 'evaluation' },
                    { text: 'SEVAL', class: 'seval' }
                ],
                icon: '🚀',
                status: { name: 'pending', label: 'PENDING', color: '#f3f4f6', textColor: '#374151', progress: 0 },
                subtasks: [
                    { icon: '🛡️', text: 'Run comprehensive safety assessment' },
                    { icon: '📊', text: 'Execute performance benchmarking' },
                    { icon: '✅', text: 'Validate production readiness' }
                ],
                actions: [
                    { text: 'Run SEVAL', class: 'btn-outline btn-sm', onclick: 'runSEVAL()' },
                    { text: 'View Report', class: 'btn-outline btn-sm', onclick: 'viewReadinessReport()' }
                ]
            }
        ];

        // Generate task rows using the enhanced task structure
        const taskRows = tasks.map(task => this.generateEnhancedTaskRow(task));
        evaluateTasksBody.innerHTML = taskRows.join('');
    }

    /**
     * Generate individual task row HTML
     */
    generateTaskRow(taskTitle, badges, status, icon, isMainTask) {
        // Generate actions based on task type and status
        let actions = this.generateTaskActions(taskTitle, status);

        // Only include original badges (like "Root Task", "User Story"), not status badges
        const badgesHtml = badges ? `<div class="task-badges">${badges}</div>` : '';

        const taskClass = isMainTask ? 'main-task' : 'subtask';
        const taskItemHtml = `
            <div class="task-item ${taskClass}">
                <span class="task-icon">${icon}</span>
                <div class="task-details">
                    <div class="task-title">${taskTitle}</div>
                    ${badgesHtml}
                </div>
            </div>
        `;

        return `
            <tr>
                <td>${taskItemHtml}</td>
                <td class="status-cell">
                    <div class="status-indicator">
                        <span class="status-badge ${status.name}" style="background-color: ${status.color}; color: ${status.textColor};">
                            ${status.label}
                        </span>
                        <div class="status-details">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${status.progress}%;"></div>
                            </div>
                            <span class="progress-text">${status.progress}% complete</span>
                        </div>
                    </div>
                </td>
                <td class="actions-cell">
                    <div class="task-actions">
                        ${actions}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Generate task-specific actions
     */
    generateTaskActions(taskTitle, status) {
        const taskType = this.getTaskType(taskTitle);
        
        if (status.name === 'pending') {
            return this.getPendingActions(taskType);
        } else if (status.name === 'in-progress') {
            return this.getInProgressActions(taskType);
        } else if (status.name === 'completed') {
            return this.getCompletedActions(taskType);
        } else if (status.name === 'blocked') {
            return this.getBlockedActions(taskType);
        }
        
        return '';
    }

    /**
     * Determine task type from title
     */
    getTaskType(taskTitle) {
        if (taskTitle.includes('TCS Assessment')) return 'tcs';
        if (taskTitle.includes('LLM Capacity')) return 'llm';
        if (taskTitle.includes('DevUI E2E')) return 'testing';
        if (taskTitle.includes('Monitors')) return 'monitoring';
        if (taskTitle.includes('registration request')) return 'registration';
        return 'general';
    }

    /**
     * Get actions for pending tasks
     */
    getPendingActions(taskType) {
        const actions = {
            'tcs': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">🛡️</span>
                    Start TCS
                </a>`,
            'llm': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">🔧</span>
                    Configure
                </a>`,
            'testing': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('playground'); return false;">
                    <span class="action-icon">🧪</span>
                    Start Testing
                </a>`,
            'monitoring': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('metrics'); return false;">
                    <span class="action-icon">📊</span>
                    Setup
                </a>`,
            'registration': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">📝</span>
                    Start
                </a>`,
            'general': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">🚀</span>
                    Start
                </a>`
        };
        
        return actions[taskType] || actions['general'];
    }

    /**
     * Get actions for in-progress tasks
     */
    getInProgressActions(taskType) {
        const actions = {
            'tcs': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">⚙️</span>
                    Continue
                </a>
                <a href="#" class="action-link secondary" onclick="agentManager.showToast('Checking TCS status...', 'info'); return false;">
                    <span class="action-icon">🔍</span>
                    Status
                </a>`,
            'llm': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">⚙️</span>
                    Update
                </a>
                <a href="#" class="action-link secondary" onclick="agentManager.switchView('metrics'); return false;">
                    <span class="action-icon">📊</span>
                    Monitor
                </a>`,
            'testing': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('playground'); return false;">
                    <span class="action-icon">🧪</span>
                    Continue
                </a>
                <a href="#" class="action-link secondary" onclick="agentManager.showToast('Opening test results...', 'info'); return false;">
                    <span class="action-icon">📋</span>
                    Results
                </a>`,
            'monitoring': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('metrics'); return false;">
                    <span class="action-icon">📊</span>
                    Update
                </a>
                <a href="#" class="action-link secondary" onclick="agentManager.showToast('Opening dashboard...', 'info'); return false;">
                    <span class="action-icon">📈</span>
                    Dashboard
                </a>`,
            'general': `
                <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                    <span class="action-icon">⚙️</span>
                    Continue
                </a>`
        };
        
        return actions[taskType] || actions['general'];
    }

    /**
     * Get actions for completed tasks
     */
    getCompletedActions(taskType) {
        return `
            <a href="#" class="action-link success" onclick="agentManager.switchView('metrics'); return false;">
                <span class="action-icon">📊</span>
                View Results
            </a>
            <a href="#" class="action-link secondary" onclick="agentManager.switchView('configure'); return false;">
                <span class="action-icon">🔄</span>
                Update
            </a>
        `;
    }

    /**
     * Get actions for blocked tasks
     */
    getBlockedActions(taskType) {
        return `
            <a href="#" class="action-link primary" onclick="agentManager.switchView('configure'); return false;">
                <span class="action-icon">🔧</span>
                Resolve
            </a>
            <a href="#" class="action-link secondary" onclick="agentManager.showToast('Support ticket created', 'info'); return false;">
                <span class="action-icon">🆘</span>
                Help
            </a>
        `;
    }

    /**
     * Generate enhanced task row HTML for evaluation tasks with full details
     */
    generateEnhancedTaskRow(task) {
        // Generate badges HTML
        const badgesHtml = task.badges ? task.badges.map(badge => 
            `<span class="task-badge ${badge.class}">${badge.text}</span>`
        ).join('') : '';

        // Generate subtasks HTML
        const subtasksHtml = task.subtasks ? task.subtasks.map(subtask =>
            `<div class="subtask-item">
                <span class="subtask-icon">${subtask.icon}</span>
                <span class="subtask-text">${subtask.text}</span>
            </div>`
        ).join('') : '';

        // Generate actions HTML
        const actionsHtml = task.actions ? task.actions.map(action =>
            `<button class="btn ${action.class}" onclick="${action.onclick}">${action.text}</button>`
        ).join('') : '';

        const taskItemHtml = `
            <div class="task-item main-task">
                <span class="task-icon">${task.icon}</span>
                <div class="task-details">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-badges">${badgesHtml}</div>
                    <div class="task-subtasks">${subtasksHtml}</div>
                </div>
            </div>
        `;

        return `
            <tr>
                <td>${taskItemHtml}</td>
                <td class="status-cell">
                    <div class="status-indicator">
                        <span class="status-badge ${task.status.name}" style="background-color: ${task.status.color}; color: ${task.status.textColor};">
                            ${task.status.label}
                        </span>
                        <div class="status-details">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${task.status.progress}%;"></div>
                            </div>
                            <span class="progress-text">${task.status.progress}% complete</span>
                        </div>
                    </div>
                </td>
                <td class="actions-cell">
                    <div class="task-actions">
                        ${actionsHtml}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Populate Configure Agent tasks table with individual task rows
     */
    populateConfigureTasks() {
        const configureTasksBody = document.getElementById('configure-tasks-tbody');
        if (!configureTasksBody) return;

        // Define the same tasks that appear in the child task structure
        const tasks = [
            {
                title: 'Enable TCS Assessment',
                icon: '📝',
                status: { name: 'completed', label: 'COMPLETED', color: '#d1fae5', textColor: '#065f46', progress: 100 }
            },
            {
                title: 'LLM Capacity Sign off',
                icon: '📝',
                status: { name: 'completed', label: 'COMPLETED', color: '#d1fae5', textColor: '#065f46', progress: 100 }
            },
            {
                title: 'DevUI E2E Testing',
                icon: '🧪',
                status: { name: 'in-progress', label: 'IN PROGRESS', color: '#fef3c7', textColor: '#92400e', progress: 67 }
            },
            {
                title: 'Monitors & Dashboards',
                icon: '📊',
                status: { name: 'pending', label: 'PENDING', color: '#f3f4f6', textColor: '#374151', progress: 0 }
            }
        ];

        // Generate task rows
        const taskRows = tasks.map(task => this.generateTaskRow(task.title, '', task.status, task.icon, false));
        configureTasksBody.innerHTML = taskRows.join('');
    }

    /**
     * Agent action handlers
     */
    editAgent(id) {
        this.switchView('configure');
        
        // Update lifecycle step to highlight "Configure Agent"
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector('[data-step="configure"]').classList.add('active');
        
        const agent = this.agents.find(a => a.id === id);
        if (agent) {
            // Populate configure form with agent data using the new comprehensive form
            this.populateConfigForm(agent);
        }
    }

    evaluateAgent(id) {
        this.switchView('playground');
        
        // Update lifecycle step to highlight "Evaluate Models"
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector('[data-step="evaluate"]').classList.add('active');
        
        document.getElementById('test-agent').value = this.agents.find(a => a.id === id)?.name.toLowerCase();
    }

    viewMetrics(id) {
        this.switchView('metrics');
        
        // Update lifecycle step to highlight "Monitor"
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector('[data-step="monitor"]').classList.add('active');
    }

    deployAgent(id) {
        // Update lifecycle step to highlight "Deploy"
        document.querySelectorAll('.lifecycle-step').forEach(s => {
            s.classList.remove('active');
        });
        document.querySelector('[data-step="deploy"]').classList.add('active');
        
        const agent = this.agents.find(a => a.id === id);
        if (agent) {
            agent.status = 'Active';
            this.saveAgents();
            this.renderAgentsTable();
            alert(`${agent.name} deployed successfully!`);
        }
    }

    /**
     * Utility functions
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    generateRandomScore(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

/**
 * Global utility functions
 */
function showCreateView() {
    agentManager.switchView('create');
}

function showDashboard() {
    agentManager.switchView('dashboard');
}

function addSuggestion(text) {
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        promptInput.value = text;
    }
}

function runPlaygroundTest() {
    const agent = document.getElementById('test-agent').value;
    const prompt = document.getElementById('test-prompt').value;
    const model = document.getElementById('model-selection').value;

    if (!agent || !prompt) {
        alert('Please select an agent and enter a test prompt');
        return;
    }

    // Simulate test execution
    const testOutput = document.getElementById('test-output');
    const responseTime = document.getElementById('test-response-time');
    const tokens = document.getElementById('test-tokens');
    const confidence = document.getElementById('test-confidence');

    testOutput.innerHTML = `
        <div class="test-result">
            <h4>Test Response:</h4>
            <p>Based on your prompt "${prompt}", the ${agent} agent would respond with comprehensive assistance. This is a simulated response demonstrating the agent's capabilities.</p>
            <div class="response-metadata">
                <span class="timestamp">Generated at: ${new Date().toLocaleTimeString()}</span>
                <span class="model-used">Model: ${model}</span>
            </div>
        </div>
    `;

    responseTime.textContent = `${(Math.random() * 2 + 0.5).toFixed(2)}s`;
    tokens.textContent = `${Math.floor(Math.random() * 150 + 50)}`;
    confidence.textContent = `${(Math.random() * 20 + 80).toFixed(1)}%`;
}

function saveAgentConfiguration() {
    const name = document.getElementById('compliant-agent-name').value;
    const version = document.getElementById('version-number').value;
    const branch = document.getElementById('branch-name').value;
    
    if (!name || !version) {
        alert('Please fill in all required fields');
        return;
    }
    
    alert('Agent configuration saved successfully!');
    agentManager.switchView('dashboard');
}

/**
 * Onboarding and Help System
 */

// Check if this is the user's first visit
AgentManager.prototype.checkFirstVisit = function() {
    return !localStorage.getItem('hasVisited');
};

// Show onboarding overlay
AgentManager.prototype.showOnboarding = function() {
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.add('active');
    this.onboardingStep = 0;
    this.updateOnboardingStep();
};

// Close onboarding overlay
AgentManager.prototype.closeOnboarding = function() {
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.remove('active');
    localStorage.setItem('hasVisited', 'true');
};

// Navigate onboarding steps
AgentManager.prototype.nextOnboardingStep = function() {
    const totalSteps = document.querySelectorAll('.onboarding-step').length;
    if (this.onboardingStep < totalSteps - 1) {
        this.onboardingStep++;
        this.updateOnboardingStep();
    } else {
        this.closeOnboarding();
    }
};

AgentManager.prototype.previousOnboardingStep = function() {
    if (this.onboardingStep > 0) {
        this.onboardingStep--;
        this.updateOnboardingStep();
    }
};

// Update onboarding step display
AgentManager.prototype.updateOnboardingStep = function() {
    // Update step content
    document.querySelectorAll('.onboarding-step').forEach((step, index) => {
        step.classList.toggle('active', index === this.onboardingStep);
    });
    
    // Update dots
    document.querySelectorAll('.onboarding-dots .dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === this.onboardingStep);
    });
    
    // Update navigation buttons
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    prevBtn.disabled = this.onboardingStep === 0;
    nextBtn.textContent = this.onboardingStep === document.querySelectorAll('.onboarding-step').length - 1 ? 'Get Started' : 'Next';
};

// Go to specific onboarding step
AgentManager.prototype.goToOnboardingStep = function(stepIndex) {
    const totalSteps = document.querySelectorAll('.onboarding-step').length;
    if (stepIndex >= 0 && stepIndex < totalSteps) {
        this.onboardingStep = stepIndex;
        this.updateOnboardingStep();
    }
};

// Interactive onboarding actions
AgentManager.prototype.onboardingPreviewAction = function(feature) {
    // Add visual feedback
    this.showOnboardingFeedback(`Exploring ${feature.charAt(0).toUpperCase() + feature.slice(1)} features...`);
    
    setTimeout(() => {
        switch(feature) {
            case 'create':
                this.closeOnboarding();
                this.switchView('create');
                this.showStepTooltip(
                    'Create Agent View',
                    'Here you can build your AI agent from scratch or use our templates. Try filling out the form or selecting a template!',
                    'Got it',
                    () => this.hideStepTooltip()
                );
                break;
            case 'configure':
                this.closeOnboarding();
                this.switchView('configure');
                this.showStepTooltip(
                    'Configure Agent View',
                    'This is where you fine-tune your agent\'s settings, manage plugins, and review deployment configurations.',
                    'Explore Tabs',
                    () => {
                        this.hideStepTooltip();
                        this.switchConfigureTab('features');
                    }
                );
                break;
            case 'monitor':
                this.closeOnboarding();
                this.switchView('metrics');
                this.showStepTooltip(
                    'Performance Metrics',
                    'Monitor your agent\'s performance with detailed analytics, user feedback, and operational insights.',
                    'View Charts',
                    () => this.hideStepTooltip()
                );
                break;
        }
    }, 600);
};

AgentManager.prototype.onboardingLifecycleAction = function(step) {
    this.showOnboardingFeedback(`Learning about ${step} step...`);
    
    setTimeout(() => {
        switch(step) {
            case 'create':
                this.closeOnboarding();
                this.switchView('create');
                this.showStepTooltip(
                    'Step 1: Create Agent',
                    'Start by defining your agent\'s basic information. Choose a template or build from scratch!',
                    'Try Templates',
                    () => {
                        this.hideStepTooltip();
                        // Scroll to templates
                        document.querySelector('.templates-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                );
                break;
            case 'configure':
                this.closeOnboarding();
                this.switchView('configure');
                this.showStepTooltip(
                    'Step 2: Configure Agent',
                    'Set up your agent\'s plugins, permissions, and deployment settings. Each tab contains important configuration options.',
                    'Explore Tabs',
                    () => {
                        this.hideStepTooltip();
                        this.switchConfigureTab('ado');
                    }
                );
                break;
            case 'evaluate':
                this.closeOnboarding();
                this.switchView('playground');
                this.showStepTooltip(
                    'Step 3: Evaluate & Test',
                    'Test your agent\'s responses and experiment with different inputs to ensure it works as expected.',
                    'Start Testing',
                    () => this.hideStepTooltip()
                );
                break;
            case 'deploy':
                this.closeOnboarding();
                this.switchView('dashboard');
                this.showStepTooltip(
                    'Step 4: Deploy',
                    'Once your agent is ready, you can deploy it to your target environment and monitor the rollout.',
                    'View Dashboard',
                    () => this.hideStepTooltip()
                );
                break;
            case 'monitor':
                this.closeOnboarding();
                this.switchView('metrics');
                this.showStepTooltip(
                    'Step 5: Monitor',
                    'Track your agent\'s performance with comprehensive metrics and analytics to ensure optimal operation.',
                    'Explore Metrics',
                    () => this.hideStepTooltip()
                );
                break;
        }
    }, 600);
};

AgentManager.prototype.onboardingTemplateAction = function(templateType) {
    this.showOnboardingFeedback(`Loading ${templateType} template...`);
    
    setTimeout(() => {
        this.closeOnboarding();
        this.selectTemplate(templateType);
        // Additional guidance will be shown by selectTemplate method
    }, 600);
};

// Agent interaction
AgentManager.prototype.interactWithAgent = function(context) {
    const tips = {
        welcome: [
            "💡 Tip: You can always return to this tour by clicking the help widget!",
            "🚀 Pro tip: Start with a template to see best practices in action!",
            "🎯 Did you know? Each lifecycle step has contextual guidance to help you!"
        ],
        lifecycle: [
            "📝 Each step builds on the previous one - don't skip ahead too quickly!",
            "🔄 You can iterate between steps as you refine your agent.",
            "⚡ The Deploy step includes automated testing and validation!"
        ],
        templates: [
            "🎨 Templates are fully customizable - use them as starting points!",
            "📊 Each template comes with pre-configured metrics and monitoring.",
            "🔧 You can mix and match features from different templates!"
        ]
    };
    
    const contextTips = tips[context] || ["💡 Click around to explore more features!"];
    const randomTip = contextTips[Math.floor(Math.random() * contextTips.length)];
    
    // Show tip in a toast-like notification
    this.showAgentTip(randomTip);
};

// Show agent tip
AgentManager.prototype.showAgentTip = function(tip) {
    // Create or update tip element
    let tipElement = document.querySelector('.agent-tip');
    if (!tipElement) {
        tipElement = document.createElement('div');
        tipElement.className = 'agent-tip';
        document.body.appendChild(tipElement);
    }
    
    tipElement.innerHTML = `
        <div class="agent-tip-content">
            <span class="agent-tip-avatar">🤖</span>
            <span class="agent-tip-text">${tip}</span>
            <button class="agent-tip-close" onclick="this.parentElement.parentElement.classList.remove('active')">×</button>
        </div>
    `;
    
    tipElement.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        tipElement.classList.remove('active');
    }, 5000);
};

// Show onboarding feedback
AgentManager.prototype.showOnboardingFeedback = function(message) {
    // Create or update feedback element
    let feedback = document.querySelector('.onboarding-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'onboarding-feedback';
        document.querySelector('.onboarding-modal').appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.classList.add('active');
    
    setTimeout(() => {
        feedback.classList.remove('active');
    }, 2000);
};

// Step-specific guidance system
AgentManager.prototype.showStepGuidance = function(step) {
    const guidance = {
        create: {
            title: "Create Your First Agent",
            message: "Start by giving your agent a name and selecting its capabilities. I'll help you choose the right plugins and settings!",
            action: "Start Creating",
            actionFn: () => this.switchView('create')
        },
        configure: {
            title: "Configure Agent Settings",
            message: "Fine-tune your agent's permissions, deployment settings, and advanced configurations. Make sure to review all tabs!",
            action: "Configure Now",
            actionFn: () => this.switchView('configure')
        },
        evaluate: {
            title: "Test Your Agent",
            message: "Before deploying, test your agent's responses and optimize its prompts. This ensures the best user experience!",
            action: "Test Agent",
            actionFn: () => this.switchView('playground')
        },
        deploy: {
            title: "Deploy Your Agent",
            message: "Ready to go live? Review your deployment checklist and launch your agent to users!",
            action: "Deploy",
            actionFn: () => this.deployAgent()
        },
        monitor: {
            title: "Monitor Performance",
            message: "Track how your agent is performing with detailed analytics and user feedback. Continuous improvement is key!",
            action: "View Metrics",
            actionFn: () => this.switchView('metrics')
        }
    };
    
    const stepGuidance = guidance[step];
    if (!stepGuidance) return;
    
    this.showStepTooltip(stepGuidance.title, stepGuidance.message, stepGuidance.action, stepGuidance.actionFn);
};

// Show step tooltip
AgentManager.prototype.showStepTooltip = function(title, message, actionText, actionFn) {
    const tooltip = document.getElementById('step-tooltip');
    const titleEl = tooltip.querySelector('.tooltip-title');
    const messageEl = tooltip.querySelector('.tooltip-message');
    const actionBtn = tooltip.querySelector('.tooltip-action-btn');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    actionBtn.textContent = actionText;
    actionBtn.onclick = () => {
        actionFn();
        this.hideStepTooltip();
    };
    
    tooltip.classList.add('active');
};

// Hide step tooltip
AgentManager.prototype.hideStepTooltip = function() {
    document.getElementById('step-tooltip').classList.remove('active');
};

// Help widget functionality
AgentManager.prototype.toggleHelp = function() {
    const helpMenu = document.querySelector('.help-menu');
    this.helpMenuOpen = !this.helpMenuOpen;
    helpMenu.classList.toggle('active', this.helpMenuOpen);
};

AgentManager.prototype.showStepGuide = function() {
    this.toggleHelp();
    // Show contextual guidance based on current view
    if (this.currentView === 'dashboard') {
        this.showStepGuidance('create');
    } else {
        this.showStepGuidance(this.currentView);
    }
};

AgentManager.prototype.showVideoTutorials = function() {
    this.toggleHelp();
    alert('Video tutorials will be available soon! For now, try the interactive tour.');
};

AgentManager.prototype.showDocumentation = function() {
    this.toggleHelp();
    alert('Opening documentation... (This would typically open a help portal)');
};

AgentManager.prototype.contactSupport = function() {
    this.toggleHelp();
    alert('Support ticket system would open here. For now, try the onboarding tour for help!');
};

// Template selection with onboarding integration
AgentManager.prototype.selectTemplate = function(templateType) {
    const templates = {
        sales: {
            name: 'SalesAgent',
            displayName: 'Sales Assistant',
            description: 'AI agent specialized in lead qualification, customer outreach, and sales process automation.',
            plugins: ['crm_integration', 'email_automation', 'lead_scoring'],
            prompt: 'You are a sales assistant AI that helps qualify leads and automate customer outreach...'
        },
        research: {
            name: 'ResearchAgent',
            displayName: 'Research Assistant',
            description: 'AI agent that excels at information gathering, data analysis, and research compilation.',
            plugins: ['web_search', 'data_analysis', 'document_processing'],
            prompt: 'You are a research assistant AI that helps gather and analyze information...'
        },
        opsgenie: {
            name: 'OpsGenieAgent',
            displayName: 'Operations Assistant',
            description: 'AI agent for incident management, operational workflows, and system monitoring.',
            plugins: ['incident_management', 'monitoring', 'alerting'],
            prompt: 'You are an operations assistant AI that helps manage incidents and operational workflows...'
        },
        support: {
            name: 'SupportAgent',
            displayName: 'Customer Support Assistant',
            description: 'AI agent for customer support, ticket resolution, and user assistance.',
            plugins: ['ticket_management', 'knowledge_base', 'chat_support'],
            prompt: 'You are a customer support assistant AI that helps resolve user issues...'
        }
    };
    
    const template = templates[templateType];
    if (!template) return;
    
    // Switch to create view
    this.switchView('create');
    
    // Pre-fill form with template data
    setTimeout(() => {
        document.getElementById('compliant-agent-name').value = template.name;
        document.getElementById('full-name').value = template.displayName;
        document.getElementById('agent-description').value = template.description;
        document.getElementById('system-prompt').value = template.prompt;
        
        // Show template guidance
        this.showStepTooltip(
            `${template.displayName} Template Selected`,
            `Great choice! I've pre-filled the form with ${template.displayName} settings. Review and customize the fields as needed, then proceed to configure your agent.`,
            'Continue Setup',
            () => this.hideStepTooltip()
        );
        
        // Update manifest
        this.updateManifest();
    }, 100);
};

// Enhanced lifecycle step handling with guidance
AgentManager.prototype.handleLifecycleStepWithGuidance = function(step) {
    this.handleLifecycleStep(step);
    
    // Show guidance for new users
    if (this.isFirstVisit || !localStorage.getItem(`guidance_${step}_shown`)) {
        setTimeout(() => {
            this.showStepGuidance(step);
            localStorage.setItem(`guidance_${step}_shown`, 'true');
        }, 500);
    }
};

// Initialize the application
let agentManager;
document.addEventListener('DOMContentLoaded', () => {
    agentManager = new AgentManager();
});

// Global function for T-Prompt tab switching
function switchTPromptTab(tabName) {
    if (agentManager) {
        agentManager.switchTPromptTab(tabName);
    }
}

// T-Prompt Quick Action Functions
function runTMigrate() {
    agentManager.showToast('Running T-Migrate benchmark...', 'info');
    
    setTimeout(() => {
        showTMigrateModal();
    }, 2000);
}

function createManifestPR() {
    agentManager.showToast('Creating manifest PR via T-Prompt...', 'info');
    
    setTimeout(() => {
        agentManager.showToast('Manifest PR created successfully', 'success');
        showManifestPRModal();
    }, 1500);
}

function viewTPromptHistory() {
    agentManager.showToast('Loading T-Prompt run history...', 'info');
    
    setTimeout(() => {
        showTPromptHistoryModal();
    }, 800);
}

function openMetricsDashboard() {
    agentManager.showToast('Opening Comet metrics dashboard...', 'info');
    
    setTimeout(() => {
        agentManager.showToast('Metrics dashboard opened', 'success');
        // In a real app, this would open the actual Comet dashboard
        window.open('#', '_blank');
    }, 500);
}

function checkLiveSiteReadiness() {
    agentManager.showToast('Checking live site readiness...', 'info');
    
    setTimeout(() => {
        showLiveSiteReadinessModal();
    }, 1000);
}

function integrateLiquidFiles() {
    agentManager.showToast('Generating ADO tasks with liquid templates...', 'info');
    
    setTimeout(() => {
        agentManager.showToast('ADO tasks generated successfully', 'success');
        showLiquidIntegrationModal();
    }, 1500);
}

function openManifestEditor() {
    agentManager.showToast('Opening manifest editor...', 'info');
    
    setTimeout(() => {
        showManifestEditorModal();
    }, 500);
}

function viewPromptRecommendations() {
    agentManager.showToast('Loading prompt recommendations...', 'info');
    
    setTimeout(() => {
        showPromptRecommendationsModal();
    }, 800);
}

function viewAgentHealthInsights() {
    agentManager.showToast('Loading agent health insights...', 'info');
    
    setTimeout(() => {
        showAgentHealthInsightsModal();
    }, 1000);
}

// Modal Functions for T-Prompt Quick Actions
function showTMigrateModal() {
    const modal = createModal('tmigrate-modal', 'T-Migrate Results', `
        <div class="tmigrate-results">
            <div class="migration-summary">
                <h4>Migration Summary</h4>
                <div class="summary-metrics">
                    <div class="metric">
                        <span class="metric-label">Migration Status:</span>
                        <span class="metric-value success">✅ Completed</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Performance Score:</span>
                        <span class="metric-value">92/100</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Compatibility:</span>
                        <span class="metric-value success">✅ Compatible</span>
                    </div>
                </div>
            </div>
            <div class="migration-actions">
                <button class="btn-outline" onclick="window.open('#', '_blank')">View Full Report</button>
                <button class="btn-primary" onclick="window.open('#', '_blank')">Open PR</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('T-Migrate completed successfully', 'success');
}

function showManifestPRModal() {
    const modal = createModal('manifest-pr-modal', 'Manifest PR Created', `
        <div class="pr-details">
            <div class="pr-info">
                <h4>Pull Request #1234</h4>
                <p>Manifest updates for GitHub Copilot agent</p>
                <div class="pr-meta">
                    <span class="pr-status">🟡 Pending Review</span>
                    <span class="pr-branch">feature/manifest-update</span>
                </div>
            </div>
            <div class="pr-actions">
                <button class="btn-outline" onclick="window.open('#', '_blank')">View PR</button>
                <button class="btn-primary" onclick="window.open('#', '_blank')">Open in GitHub</button>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function showTPromptHistoryModal() {
    const modal = createModal('tprompt-history-modal', 'T-Prompt Run History', `
        <div class="history-table-container">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Run Type</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Benchmark</td>
                        <td>2025-09-04 10:30</td>
                        <td><span class="status-success">✅ Success</span></td>
                        <td>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">PR</button>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">Report</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Migration</td>
                        <td>2025-09-03 14:15</td>
                        <td><span class="status-success">✅ Success</span></td>
                        <td>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">PR</button>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">Report</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Optimization</td>
                        <td>2025-09-02 09:45</td>
                        <td><span class="status-warning">⚠️ Warning</span></td>
                        <td>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">PR</button>
                            <button class="btn-outline-small" onclick="window.open('#', '_blank')">Report</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('T-Prompt history loaded', 'success');
}

function showLiveSiteReadinessModal() {
    const modal = createModal('readiness-modal', 'Live Site Readiness Check', `
        <div class="readiness-checklist">
            <div class="checklist-item">
                <span class="check-icon">✅</span>
                <div class="check-content">
                    <h5>ICM Ownership</h5>
                    <p>Agent ownership properly configured</p>
                </div>
            </div>
            <div class="checklist-item">
                <span class="check-icon">✅</span>
                <div class="check-content">
                    <h5>XAMP Probes</h5>
                    <p>Health monitoring probes active</p>
                </div>
            </div>
            <div class="checklist-item">
                <span class="check-icon">⚠️</span>
                <div class="check-content">
                    <h5>Validation Status</h5>
                    <p>1 validation pending review</p>
                </div>
            </div>
            <div class="checklist-item">
                <span class="check-icon">✅</span>
                <div class="check-content">
                    <h5>Performance Metrics</h5>
                    <p>All metrics within acceptable range</p>
                </div>
            </div>
        </div>
        <div class="readiness-actions">
            <button class="btn-outline">View Details</button>
            <button class="btn-primary">Deploy to Live</button>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('Live site readiness check completed', 'info');
}

function showLiquidIntegrationModal() {
    const modal = createModal('liquid-modal', 'Liquid File Integration', `
        <div class="liquid-results">
            <h4>ADO Tasks Generated</h4>
            <div class="task-list">
                <div class="task-item">
                    <span class="task-icon">📊</span>
                    <div class="task-content">
                        <h5>Metrics Collection Task</h5>
                        <p>Task ID: ADO-12345</p>
                    </div>
                    <button class="btn-outline-small">View</button>
                </div>
                <div class="task-item">
                    <span class="task-icon">🧪</span>
                    <div class="task-content">
                        <h5>Test Dataset Generation</h5>
                        <p>Task ID: ADO-12346</p>
                    </div>
                    <button class="btn-outline-small">View</button>
                </div>
                <div class="task-item">
                    <span class="task-icon">📝</span>
                    <div class="task-content">
                        <h5>Template Validation</h5>
                        <p>Task ID: ADO-12347</p>
                    </div>
                    <button class="btn-outline-small">View</button>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function showManifestEditorModal() {
    const modal = createModal('manifest-editor-modal', 'Manifest Editor', `
        <div class="manifest-editor-content">
            <div class="editor-toolbar">
                <button class="btn-outline-small">Validate</button>
                <button class="btn-outline-small">Format</button>
                <button class="btn-primary">Submit PR</button>
            </div>
            <textarea class="manifest-textarea" rows="15" placeholder="Edit your manifest here...">{
  "name": "github-copilot-agent",
  "version": "1.0.0",
  "description": "GitHub Copilot agent for code assistance",
  "capabilities": [
    "code-generation",
    "code-review",
    "debugging"
  ]
}</textarea>
            <div class="editor-status">
                <span class="status-valid">✅ Valid JSON</span>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('Manifest editor opened', 'success');
}

function showPromptRecommendationsModal() {
    const modal = createModal('recommendations-modal', 'Prompt Recommendations', `
        <div class="recommendations-list">
            <div class="recommendation-item">
                <div class="rec-header">
                    <h5>High-Performance Code Generation</h5>
                    <span class="rec-score">Score: 94/100</span>
                </div>
                <p class="rec-description">Optimized for generating clean, efficient code with proper error handling.</p>
                <div class="rec-actions">
                    <button class="btn-outline-small" onclick="copyToClipboard('code-gen-prompt')">Copy</button>
                    <button class="btn-outline-small">Copy to Playground</button>
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Eval</button>
                </div>
            </div>
            <div class="recommendation-item">
                <div class="rec-header">
                    <h5>Context-Aware Debugging</h5>
                    <span class="rec-score">Score: 91/100</span>
                </div>
                <p class="rec-description">Enhanced debugging capabilities with contextual code analysis.</p>
                <div class="rec-actions">
                    <button class="btn-outline-small" onclick="copyToClipboard('debug-prompt')">Copy</button>
                    <button class="btn-outline-small">Copy to Playground</button>
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Eval</button>
                </div>
            </div>
            <div class="recommendation-item">
                <div class="rec-header">
                    <h5>Code Review Assistant</h5>
                    <span class="rec-score">Score: 89/100</span>
                </div>
                <p class="rec-description">Comprehensive code review with security and performance insights.</p>
                <div class="rec-actions">
                    <button class="btn-outline-small" onclick="copyToClipboard('review-prompt')">Copy</button>
                    <button class="btn-outline-small">Copy to Playground</button>
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Eval</button>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('Prompt recommendations loaded', 'success');
}

function showAgentHealthInsightsModal() {
    const modal = createModal('health-insights-modal', 'Agent Health Insights', `
        <div class="health-alerts">
            <div class="alert-card warning">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <h5>Performance Degradation</h5>
                    <p>Response time increased by 15% in the last 24 hours</p>
                    <span class="alert-time">2 hours ago</span>
                </div>
                <div class="alert-actions">
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Logs</button>
                    <button class="btn-primary-small" onclick="suggestRerun()">Suggest Re-run</button>
                </div>
            </div>
            <div class="alert-card info">
                <div class="alert-icon">ℹ️</div>
                <div class="alert-content">
                    <h5>New Evaluation Available</h5>
                    <p>Latest benchmark shows improved accuracy metrics</p>
                    <span class="alert-time">6 hours ago</span>
                </div>
                <div class="alert-actions">
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Report</button>
                    <button class="btn-primary-small">Apply Changes</button>
                </div>
            </div>
            <div class="alert-card success">
                <div class="alert-icon">✅</div>
                <div class="alert-content">
                    <h5>Health Check Passed</h5>
                    <p>All systems operational, performance within normal range</p>
                    <span class="alert-time">1 day ago</span>
                </div>
                <div class="alert-actions">
                    <button class="btn-outline-small" onclick="window.open('#', '_blank')">View Details</button>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    agentManager.showToast('Agent health insights loaded', 'info');
}

// Helper function to create modals
function createModal(id, title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = id;
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('#${id}').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    return modal;
}

// Helper functions
function copyToClipboard(promptType) {
    agentManager.showToast(`${promptType} copied to clipboard`, 'success');
}

function suggestRerun() {
    agentManager.showToast('Re-run evaluation suggested', 'info');
}

// Platform Overview functionality
function initializePlatformOverview() {
    // Demo stage navigation
    const demoBtns = document.querySelectorAll('.demo-btn');
    const demoStages = document.querySelectorAll('.demo-stage');
    
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const stage = btn.dataset.stage;
            
            // Update active button
            demoBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active stage
            demoStages.forEach(s => s.classList.remove('active'));
            const targetStage = document.getElementById(`demo-${stage}`);
            if (targetStage) {
                targetStage.classList.add('active');
            }
        });
    });
    
    // Tool card interactions
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            showToolDetails(tool);
        });
    });
}

// Show tool details
function showToolDetails(tool) {
    const toolInfo = {
        gallery: {
            title: "Agent Gallery",
            description: "Browse 50+ pre-built agent templates with live demos and use case examples.",
            features: ["Live agent demonstrations", "Use case filtering", "Template customization", "Success metrics"]
        },
        playground: {
            title: "Copilot Playground",
            description: "Model selection, evaluation, and experimentation platform for optimal agent performance.",
            features: ["Model comparison", "Performance benchmarking", "Cost analysis", "Capability testing"]
        },
        wizard: {
            title: "Use Case Wizard",
            description: "Guided questionnaire that translates business needs into technical requirements.",
            features: ["Requirements capture", "Feasibility assessment", "Resource planning", "Timeline estimation"]
        },
        tprompt: {
            title: "T-Prompt Studio",
            description: "Advanced prompt engineering with testing and optimization capabilities.",
            features: ["Prompt optimization", "A/B testing", "Performance metrics", "Rewrite suggestions"]
        },
        datagen: {
            title: "DataGen Platform",
            description: "Automated test dataset generation and scenario creation for comprehensive testing.",
            features: ["Scenario generation", "Test data creation", "Quality validation", "Coverage analysis"]
        },
        seval: {
            title: "SEVAL Framework",
            description: "Comprehensive agent evaluation and quality assessment system.",
            features: ["Quality scoring", "Performance evaluation", "Compliance checking", "Bias detection"]
        },
        deployment: {
            title: "Deployment Engine",
            description: "Automated CI/CD and production deployment with safety checks.",
            features: ["One-click deployment", "Canary releases", "Rollback protection", "Health monitoring"]
        },
        comet: {
            title: "CoMet",
            description: "Custom quality metrics creation and tracking for business-specific outcomes.",
            features: ["Custom metrics", "Business alignment", "Performance tracking", "Optimization insights"]
        },
        analytics: {
            title: "Analytics Dashboard",
            description: "Real-time monitoring and performance insights across all platform tools.",
            features: ["Real-time metrics", "Cross-tool insights", "Predictive analytics", "Custom reporting"]
        }
    };
    
    const info = toolInfo[tool] || { title: "Tool", description: "Tool description", features: [] };
    
    agentManager.showModal(
        info.title,
        `<div style="text-align: left;">
            <p style="margin-bottom: 1rem; line-height: 1.6;">${info.description}</p>
            <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">Key Features:</h4>
            <ul style="margin: 0; padding-left: 1.5rem;">
                ${info.features.map(f => `<li style="margin-bottom: 0.25rem;">${f}</li>`).join('')}
            </ul>
        </div>`
    );
}

// Initialize Platform Overview when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
        initializePlatformOverview();
    }, 500);
});

// ====================== SEVAL Integration Functions ======================

/**
 * Launch SEVAL with pre-configured agent settings
 */
function launchSEVAL() {
    const agentId = 'github-copilot-chat-agent-v2';
    agentManager.showToast('Launching SEVAL with pre-configured agent settings...', 'info');
    
    // Simulate SEVAL launch
    setTimeout(() => {
        agentManager.showToast('SEVAL evaluation started successfully', 'success');
        // In real implementation, this would open SEVAL in a new window with the agent ID
        // window.open(`https://seval.microsoft.com/evaluate?agentId=${agentId}`, '_blank');
        
        // Add a new running entry to the table
        addSEVALRunToTable({
            date: new Date().toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            agentId: agentId,
            type: 'Production Eval',
            score: 'Running',
            status: 'In Progress',
            duration: '0m 00s',
            runId: `run-${Date.now()}`
        });
    }, 1500);
}

/**
 * Refresh SEVAL results table
 */
function refreshSEVALResults() {
    agentManager.showToast('Refreshing SEVAL results...', 'info');
    
    // Simulate refresh
    setTimeout(() => {
        agentManager.showToast('SEVAL results refreshed', 'success');
        // In real implementation, this would fetch latest data from SEVAL API
    }, 1000);
}

/**
 * Export SEVAL results
 */
function exportSEVALResults() {
    agentManager.showToast('Exporting SEVAL results...', 'info');
    
    // Simulate export
    setTimeout(() => {
        agentManager.showToast('SEVAL results exported successfully', 'success');
        // In real implementation, this would generate and download a CSV/Excel file
    }, 1500);
}

/**
 * View detailed SEVAL results for a specific run
 */
function viewSEVALDetails(runId) {
    agentManager.showToast(`Loading details for ${runId}...`, 'info');
    
    // Simulate loading details
    setTimeout(() => {
        showSEVALDetailsModal(runId);
    }, 1000);
}

/**
 * Download SEVAL report for a specific run
 */
function downloadSEVALReport(runId) {
    agentManager.showToast(`Downloading report for ${runId}...`, 'info');
    
    // Simulate download
    setTimeout(() => {
        agentManager.showToast('Report downloaded successfully', 'success');
        // In real implementation, this would download the actual report file
    }, 1500);
}

/**
 * View progress for a running SEVAL evaluation
 */
function viewSEVALProgress(runId) {
    agentManager.showToast(`Loading progress for ${runId}...`, 'info');
    
    // Simulate progress view
    setTimeout(() => {
        showSEVALProgressModal(runId);
    }, 1000);
}

/**
 * Cancel a running SEVAL evaluation
 */
function cancelSEVALRun(runId) {
    if (confirm('Are you sure you want to cancel this SEVAL run?')) {
        agentManager.showToast(`Cancelling ${runId}...`, 'info');
        
        // Simulate cancellation
        setTimeout(() => {
            agentManager.showToast('SEVAL run cancelled', 'success');
            // Update the table row to show cancelled status
            updateSEVALRunStatus(runId, 'Cancelled', '❌ Cancelled');
        }, 1000);
    }
}

/**
 * Add a new SEVAL run to the results table
 */
function addSEVALRunToTable(runData) {
    const tbody = document.getElementById('seval-results-tbody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.className = 'result-row';
    row.innerHTML = `
        <td>${runData.date}</td>
        <td>${runData.agentId}</td>
        <td>${runData.type}</td>
        <td><span class="score-badge running">⏳ ${runData.score}</span></td>
        <td><span class="status-badge running">🔄 ${runData.status}</span></td>
        <td>${runData.duration}</td>
        <td>
            <button class="btn-icon-small" title="View Progress" onclick="viewSEVALProgress('${runData.runId}')">👁️</button>
            <button class="btn-icon-small" title="Cancel Run" onclick="cancelSEVALRun('${runData.runId}')">❌</button>
        </td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
}

/**
 * Update SEVAL run status in the table
 */
function updateSEVALRunStatus(runId, score, status) {
    const rows = document.querySelectorAll('#seval-results-tbody tr');
    rows.forEach(row => {
        const buttons = row.querySelectorAll('button[onclick*="' + runId + '"]');
        if (buttons.length > 0) {
            const scoreCell = row.cells[3];
            const statusCell = row.cells[4];
            
            scoreCell.innerHTML = `<span class="score-badge error">${score}</span>`;
            statusCell.innerHTML = `<span class="status-badge warning">${status}</span>`;
            
            // Update action buttons
            const actionsCell = row.cells[6];
            actionsCell.innerHTML = `
                <button class="btn-icon-small" title="View Details" onclick="viewSEVALDetails('${runId}')">👁️</button>
                <button class="btn-icon-small" title="Download Report" onclick="downloadSEVALReport('${runId}')">📥</button>
            `;
        }
    });
}

/**
 * Show SEVAL details modal
 */
function showSEVALDetailsModal(runId) {
    // Create and show modal with detailed SEVAL results
    agentManager.showToast(`Showing detailed results for ${runId}`, 'info');
    // In real implementation, this would show a modal with comprehensive evaluation details
}

/**
 * Show SEVAL progress modal
 */
function showSEVALProgressModal(runId) {
    // Create and show modal with current progress
    agentManager.showToast(`Showing progress for ${runId}`, 'info');
    // In real implementation, this would show a modal with real-time progress information
}

// Copilot Playground Functions
/**
 * Create a new playground session
 */
function createNewPlaygroundSession() {
    agentManager.showToast('Creating new playground session...', 'info');
    // In real implementation, this would:
    // 1. Open a new window/tab to the Copilot Playground
    // 2. Pre-populate with current agent configuration
    // 3. Return the session ID for tracking
}

/**
 * Refresh playground sessions list
 */
function refreshPlaygroundSessions() {
    agentManager.showToast('Refreshing playground sessions...', 'info');
    // In real implementation, this would:
    // 1. Fetch latest sessions from API
    // 2. Update the table with new data
    // 3. Refresh the visualization chart
}

/**
 * View detailed results for a specific session
 */
function viewSessionDetails(sessionId) {
    agentManager.showToast(`Opening details for session ${sessionId}...`, 'info');
    // In real implementation, this would:
    // 1. Open a detailed view with session transcript
    // 2. Show evaluation criteria breakdown
    // 3. Display performance metrics and charts
}

/**
 * Duplicate/clone an existing session
 */
function duplicateSession(sessionId) {
    agentManager.showToast(`Cloning session ${sessionId}...`, 'info');
    // In real implementation, this would:
    // 1. Create a new session with same configuration
    // 2. Copy prompts and test scenarios
    // 3. Open the new session for editing
}

/**
 * T-Prompt functionality
 */
function runTPromptOptimization() {
    agentManager.showToast('Starting T-Prompt optimization...', 'info');
    // In real implementation, this would:
    // 1. Launch the T-Prompt optimization process
    // 2. Run prompt A/B testing and analysis
    // 3. Generate optimized prompt versions
    // 4. Update the last run output section
}

function openTMigrate() {
    agentManager.showToast('Opening T-Migrate...', 'info');
    window.open('https://nexus.microsoft.com/t-migrate?agent_id=agent-2024-09-11-001', '_blank');
}

function viewFullOutput() {
    agentManager.showToast('Opening full T-Prompt output...', 'info');
    // In real implementation, this would:
    // 1. Open a detailed view of the optimization run
    // 2. Show complete logs and analysis
    // 3. Display all tested prompt variations
}

function downloadResults() {
    agentManager.showToast('Downloading T-Prompt results...', 'info');
    // In real implementation, this would:
    // 1. Generate a comprehensive report
    // 2. Include optimization metrics and comparisons
    // 3. Download as PDF or JSON format
}

function showPromptDiff() {
    agentManager.showToast('Opening prompt diff viewer...', 'info');
    // In real implementation, this would:
    // 1. Open a side-by-side diff view
    // 2. Highlight changes between prompt versions
    // 3. Show impact of each change on performance
}

function trackTMigrateClick() {
    // Analytics tracking for T-Migrate usage
    console.log('T-Migrate link clicked');
    agentManager.showToast('Launching T-Migrate for agent deployment...', 'success');
}

function viewMigrationHistory() {
    agentManager.showToast('Opening migration history...', 'info');
    // In real implementation, this would:
    // 1. Show previous deployment attempts
    // 2. Display rollback options
    // 3. Show deployment status and logs
}
