// AI Risk Assessment Tool - Main Application Logic
// Implements Kennedy & Campos Taxonomy for Educational AI Risk Assessment

class RiskAssessmentApp {
    constructor() {
        this.data = {
            toolQuestions: [],
            contextQuestions: [],
            riskCalculationRules: [],
            harmCategoriesReference: []
        };
        
        this.state = {
            currentSection: 'tool-selection',
            selectedTool: null,
            answers: {},
            toolAnswers: {},
            contextAnswers: {}
        };
        
        this.harmCategories = ['BA', 'MA', 'PS', 'MC', 'HI', 'OH'];
        this.interactionLayers = ['Output', 'Whole', 'Group', 'System'];
        this.severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        
        this.init();
    }
    
    async init() {
        this.showLoading();
        try {
            await this.loadCSVData();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to load assessment data. Please refresh the page.');
        }
    }
    
    async loadCSVData() {
        const csvFiles = [
            { file: 'data/tool_questions.csv', key: 'toolQuestions' },
            { file: 'data/context_questions.csv', key: 'contextQuestions' },
            { file: 'data/risk_calculation_rules.csv', key: 'riskCalculationRules' },
            { file: 'data/harm_categories_reference.csv', key: 'harmCategoriesReference' }
        ];
        
        const promises = csvFiles.map(({ file, key }) => 
            this.loadCSV(file).then(data => {
                this.data[key] = data;
                console.log(`Loaded ${key}:`, data.length, 'rows');
            })
        );
        
        await Promise.all(promises);
    }
    
    loadCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                download: true,
                header: true,
                skipEmptyLines: true,
                transformHeader: header => header.trim(),
                transform: value => value.trim(),
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn(`Warnings in ${file}:`, results.errors);
                    }
                    resolve(results.data);
                },
                error: (error) => {
                    console.error(`Error loading ${file}:`, error);
                    reject(error);
                }
            });
        });
    }
    
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const tool = card.dataset.tool;
                this.selectTool(tool);
            });
        });
        
        // Navigation buttons
        document.getElementById('usage-back').addEventListener('click', () => {
            this.showSection('tool-selection');
        });
        
        document.getElementById('usage-next').addEventListener('click', () => {
            if (this.validateUsageAnswers()) {
                this.saveUsageAnswers();
                this.loadContextQuestions();
                this.showSection('context-questions');
            }
        });
        
        document.getElementById('context-back').addEventListener('click', () => {
            this.showSection('usage-questions');
        });
        
        document.getElementById('context-next').addEventListener('click', () => {
            if (this.validateContextAnswers()) {
                this.saveContextAnswers();
                this.calculateAndShowResults();
            }
        });
        
        document.getElementById('new-assessment').addEventListener('click', () => {
            this.resetAssessment();
        });
    }
    
    selectTool(tool) {
        // Clear previous selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new tool
        document.querySelector(`[data-tool="${tool}"]`).classList.add('selected');
        this.state.selectedTool = tool;
        
        // Load questions for this tool and move to next section
        setTimeout(() => {
            const questionsLoaded = this.loadUsageQuestions(tool);
            if (questionsLoaded) {
                this.showSection('usage-questions');
            } else {
                this.showError(`No questions found for ${tool}. Please check the data files.`);
            }
        }, 300);
    }
    
    loadUsageQuestions(tool) {
        const toolQuestions = this.data.toolQuestions.filter(q => 
            q.Tool_Type && q.Tool_Type.toLowerCase() === tool.toLowerCase()
        );
        
        if (toolQuestions.length === 0) {
            console.warn(`No questions found for tool: ${tool}`);
            return false;
        }
        
        const form = document.getElementById('usage-form');
        form.innerHTML = '';
        
        toolQuestions.forEach((question, index) => {
            const questionDiv = this.createQuestionElement(question, `usage_${index}`);
            form.appendChild(questionDiv);
        });
        
        this.state.currentToolQuestions = toolQuestions;
        return true;
    }
    
    loadContextQuestions() {
        const form = document.getElementById('context-form');
        form.innerHTML = '';
        
        this.data.contextQuestions.forEach((question, index) => {
            const questionDiv = this.createQuestionElement(question, `context_${index}`);
            form.appendChild(questionDiv);
        });
    }
    
    createQuestionElement(question, questionId) {
        const div = document.createElement('div');
        div.className = 'question-group';
        
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = question.Question_Text;
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'question-options';
        
        // Parse options
        const options = this.parseOptions(question);
        const inputType = options.length > 2 || question.response_type === 'multiple' ? 'checkbox' : 'radio';
        
        options.forEach((option, index) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const input = document.createElement('input');
            input.type = inputType;
            input.name = questionId;
            input.value = option.value;
            input.id = `${questionId}_${index}`;
            
            const text = document.createElement('span');
            text.textContent = option.text;
            
            label.appendChild(input);
            label.appendChild(text);
            optionsDiv.appendChild(label);
        });
        
        div.appendChild(questionText);
        div.appendChild(optionsDiv);
        
        return div;
    }
    
    parseOptions(question) {
        // Handle different option formats from CSV
        const options = [];
        
        if (question.Answer_A) {
            options.push({ value: 'A', text: question.Answer_A });
        }
        if (question.Answer_B) {
            options.push({ value: 'B', text: question.Answer_B });
        }
        if (question.Answer_C) {
            options.push({ value: 'C', text: question.Answer_C });
        }
        if (question.Answer_D) {
            options.push({ value: 'D', text: question.Answer_D });
        }
        
        return options;
    }
    
    validateUsageAnswers() {
        const form = document.getElementById('usage-form');
        const questionGroups = form.querySelectorAll('.question-group');
        
        for (let group of questionGroups) {
            const inputs = group.querySelectorAll('input');
            const hasAnswer = Array.from(inputs).some(input => input.checked);
            
            if (!hasAnswer) {
                group.style.borderLeftColor = '#dc2626';
                group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.showError('Please answer all questions before proceeding.');
                return false;
            } else {
                group.style.borderLeftColor = '#2563eb';
            }
        }
        
        return true;
    }
    
    validateContextAnswers() {
        const form = document.getElementById('context-form');
        const questionGroups = form.querySelectorAll('.question-group');
        
        for (let group of questionGroups) {
            const inputs = group.querySelectorAll('input');
            const hasAnswer = Array.from(inputs).some(input => input.checked);
            
            if (!hasAnswer) {
                group.style.borderLeftColor = '#dc2626';
                group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.showError('Please answer all questions before proceeding.');
                return false;
            } else {
                group.style.borderLeftColor = '#2563eb';
            }
        }
        
        return true;
    }
    
    saveUsageAnswers() {
        const form = document.getElementById('usage-form');
        const inputs = form.querySelectorAll('input:checked');
        
        this.state.toolAnswers = {};
        
        inputs.forEach(input => {
            const name = input.name;
            const value = input.value;
            
            if (!this.state.toolAnswers[name]) {
                this.state.toolAnswers[name] = [];
            }
            this.state.toolAnswers[name].push(value);
        });
    }
    
    saveContextAnswers() {
        const form = document.getElementById('context-form');
        const inputs = form.querySelectorAll('input:checked');
        
        this.state.contextAnswers = {};
        
        inputs.forEach(input => {
            const name = input.name;
            const value = input.value;
            
            if (!this.state.contextAnswers[name]) {
                this.state.contextAnswers[name] = [];
            }
            this.state.contextAnswers[name].push(value);
        });
    }
    
    calculateAndShowResults() {
        this.showLoading();
        
        try {
            const riskProfile = this.calculateRiskProfile();
            this.displayResults(riskProfile);
            this.showSection('results');
        } catch (error) {
            console.error('Error calculating results:', error);
            this.showError('Error calculating risk assessment. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    calculateRiskProfile() {
        const profile = {
            harmCategories: {},
            interactionLayers: {},
            overallRisk: 'LOW',
            details: []
        };
        
        // Initialize harm categories
        this.harmCategories.forEach(category => {
            profile.harmCategories[category] = {
                severity: 'LOW',
                risks: [],
                layerManifestations: {}
            };
        });
        
        // Process tool-specific answers
        this.state.currentToolQuestions.forEach((question, index) => {
            const answers = this.state.toolAnswers[`usage_${index}`] || [];
            
            answers.forEach(answer => {
                this.processAnswerHarms(question, answer, profile);
            });
        });
        
        // Process context modifiers
        this.data.contextQuestions.forEach((question, index) => {
            const answers = this.state.contextAnswers[`context_${index}`] || [];
            
            answers.forEach(answer => {
                this.applyContextModifiers(question, answer, profile);
            });
        });
        
        // Apply compound risk rules
        this.applyCompoundRiskRules(profile);
        
        // Determine overall risk level
        profile.overallRisk = this.determineOverallRisk(profile);
        
        return profile;
    }
    
    processAnswerHarms(question, answer, profile) {
        // Check which harm categories this answer triggers
        this.harmCategories.forEach(category => {
            const answerColumn = `${answer}_${category}`;
            
            if (question[answerColumn] === 'TRUE' || question[answerColumn] === 'true' || question[answerColumn] === '1') {
                const severity = question[`${answer}_Severity`] || 'LOW';
                
                // Update severity if higher
                if (this.isSeverityHigher(severity, profile.harmCategories[category].severity)) {
                    profile.harmCategories[category].severity = severity;
                }
                
                // Add risk details
                profile.harmCategories[category].risks.push({
                    question: question.Question_Text,
                    answer: this.getAnswerText(question, answer),
                    severity: severity,
                    description: question.Notes || 'Potential risk identified'
                });
                
                // Check interaction layers
                this.interactionLayers.forEach(layer => {
                    const layerColumn = `${answer}_${layer}`;
                    
                    if (question[layerColumn] === 'TRUE' || question[layerColumn] === 'true' || question[layerColumn] === '1') {
                        if (!profile.harmCategories[category].layerManifestations[layer]) {
                            profile.harmCategories[category].layerManifestations[layer] = [];
                        }
                        
                        profile.harmCategories[category].layerManifestations[layer].push({
                            description: this.getLayerDescription(category, layer),
                            severity: severity
                        });
                    }
                });
            }
        });
    }
    
    applyContextModifiers(question, answer, profile) {
        // Apply context-based risk modifiers
        this.harmCategories.forEach(category => {
            const affectsColumn = `${answer}_Affects_${category}`;
            const modifierColumn = `${answer}_Age_Modifier`;
            
            // Check if this answer affects this category
            if (question[affectsColumn] === 'TRUE' || question[affectsColumn] === 'true') {
                const modifier = parseInt(question[modifierColumn]) || 0;
                
                if (modifier !== 0) {
                    const currentSeverity = profile.harmCategories[category].severity;
                    const newSeverity = this.applySeverityModifier(currentSeverity, modifier);
                    
                    if (this.isSeverityHigher(newSeverity, currentSeverity)) {
                        profile.harmCategories[category].severity = newSeverity;
                    }
                }
            }
        });
    }
    
    applyCompoundRiskRules(profile) {
        this.data.riskCalculationRules.forEach(rule => {
            if (this.ruleApplies(rule, profile)) {
                this.applyRule(rule, profile);
            }
        });
    }
    
    ruleApplies(rule, profile) {
        // Check if compound risk rule conditions are met
        // This would need to be implemented based on the specific rules in your CSV
        return false; // Placeholder
    }
    
    applyRule(rule, profile) {
        // Apply the compound risk rule
        // Implementation depends on rule structure
    }
    
    isSeverityHigher(newSeverity, currentSeverity) {
        const severityOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3 };
        return severityOrder[newSeverity] > severityOrder[currentSeverity];
    }
    
    applySeverityModifier(severity, modifier) {
        const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const currentIndex = severityOrder.indexOf(severity);
        const newIndex = Math.max(0, Math.min(3, currentIndex + modifier));
        return severityOrder[newIndex];
    }
    
    determineOverallRisk(profile) {
        let highestSeverity = 'LOW';
        
        Object.values(profile.harmCategories).forEach(category => {
            if (this.isSeverityHigher(category.severity, highestSeverity)) {
                highestSeverity = category.severity;
            }
        });
        
        return highestSeverity;
    }
    
    getAnswerText(question, answer) {
        return question[`Answer_${answer}`] || answer;
    }
    
    getLayerDescription(category, layer) {
        const descriptions = {
            'BA': {
                'Output': 'Individual AI responses may contain biased or inauthentic content',
                'Whole': 'Complete interactions reinforce bias patterns',
                'Group': 'Classroom dynamics affected by biased AI outputs',
                'System': 'Institutional bias embedded in AI systems'
            },
            'MA': {
                'Output': 'Individual responses may contain misinformation',
                'Whole': 'System-wide accuracy issues affect learning',
                'Group': 'Misinformation spreads through group interactions',
                'System': 'Institutional reliance on inaccurate AI systems'
            },
            'PS': {
                'Output': 'Individual privacy violations in AI responses',
                'Whole': 'Complete interaction data collection and storage',
                'Group': 'Group privacy and safety concerns',
                'System': 'Institutional data handling and safety protocols'
            },
            'MC': {
                'Output': 'Individual misuse of AI-generated content',
                'Whole': 'System enables cyberbullying or misuse',
                'Group': 'Group-level misuse and harassment',
                'System': 'Institutional failure to prevent misuse'
            },
            'HI': {
                'Output': 'Individual responses lack interpretability',
                'Whole': 'System reduces human flourishing',
                'Group': 'Group learning experiences diminished',
                'System': 'Institutional over-reliance on AI reduces human potential'
            },
            'OH': {
                'Output': 'Individual organizational impacts',
                'Whole': 'Complete system affects organizational function',
                'Group': 'Group-level organizational changes',
                'System': 'System-wide organizational transformation'
            }
        };
        
        return descriptions[category]?.[layer] || `${category} risk at ${layer} level`;
    }
    
    displayResults(riskProfile) {
        const container = document.getElementById('results-content');
        container.innerHTML = '';
        
        // Overall risk summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'results-summary';
        
        const overallDiv = document.createElement('div');
        overallDiv.className = `harm-category ${riskProfile.overallRisk.toLowerCase()}`;
        overallDiv.innerHTML = `
            <h4>Overall Risk Level</h4>
            <span class="risk-level ${riskProfile.overallRisk.toLowerCase()}">${riskProfile.overallRisk}</span>
        `;
        summaryDiv.appendChild(overallDiv);
        
        // Harm categories summary
        this.harmCategories.forEach(category => {
            const categoryData = riskProfile.harmCategories[category];
            if (categoryData.risks.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = `harm-category ${categoryData.severity.toLowerCase()}`;
                categoryDiv.innerHTML = `
                    <h4>${this.getHarmCategoryName(category)}</h4>
                    <span class="risk-level ${categoryData.severity.toLowerCase()}">${categoryData.severity}</span>
                    <p class="mt-1">${categoryData.risks.length} risk(s) identified</p>
                `;
                summaryDiv.appendChild(categoryDiv);
            }
        });
        
        container.appendChild(summaryDiv);
        
        // Interaction layers detail
        const layersDiv = document.createElement('div');
        layersDiv.className = 'interaction-layers';
        layersDiv.innerHTML = '<h3>Risk Manifestations Across Interaction Layers</h3>';
        
        this.interactionLayers.forEach(layer => {
            const layerSection = document.createElement('div');
            layerSection.className = 'layer-section';
            
            const header = document.createElement('div');
            header.className = 'layer-header';
            header.textContent = `${layer} Level`;
            
            const content = document.createElement('div');
            content.className = 'layer-content';
            
            let hasRisks = false;
            
            this.harmCategories.forEach(category => {
                const manifestations = riskProfile.harmCategories[category].layerManifestations[layer];
                
                if (manifestations && manifestations.length > 0) {
                    hasRisks = true;
                    
                    manifestations.forEach(manifestation => {
                        const riskItem = document.createElement('div');
                        riskItem.className = 'risk-item';
                        riskItem.innerHTML = `
                            <div class="risk-description">
                                <strong>${this.getHarmCategoryName(category)}:</strong>
                                ${manifestation.description}
                            </div>
                            <span class="risk-level ${manifestation.severity.toLowerCase()}">${manifestation.severity}</span>
                        `;
                        content.appendChild(riskItem);
                    });
                }
            });
            
            if (!hasRisks) {
                content.innerHTML = '<p style="color: #059669;">No significant risks identified at this level.</p>';
            }
            
            layerSection.appendChild(header);
            layerSection.appendChild(content);
            layersDiv.appendChild(layerSection);
        });
        
        container.appendChild(layersDiv);
    }
    
    getHarmCategoryName(code) {
        const names = {
            'BA': 'Bias & Authenticity',
            'MA': 'Misinformation & Accuracy',
            'PS': 'Privacy & Safety',
            'MC': 'Misuse & Cyberbullying',
            'HI': 'Human Flourishing & Interpretability',
            'OH': 'Organizational & Human Potential'
        };
        return names[code] || code;
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        this.state.currentSection = sectionId;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
    
    showError(message) {
        // Create a better error display instead of alert
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee2e2;
            border: 1px solid #dc2626;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        
        // Add to current section
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            activeSection.insertBefore(errorDiv, activeSection.firstChild.nextSibling);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        this.hideLoading();
    }
    
    resetAssessment() {
        this.state = {
            currentSection: 'tool-selection',
            selectedTool: null,
            answers: {},
            toolAnswers: {},
            contextAnswers: {}
        };
        
        // Clear tool selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Clear forms
        document.getElementById('usage-form').innerHTML = '';
        document.getElementById('context-form').innerHTML = '';
        document.getElementById('results-content').innerHTML = '';
        
        // Show first section
        this.showSection('tool-selection');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.riskAssessmentApp = new RiskAssessmentApp();
});