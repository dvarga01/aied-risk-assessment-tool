// AI Risk Assessment Tool - Updated Application Logic
// Implements Kennedy & Campos Taxonomy with 6 Harm Categories and 4 Interaction Layers

class RiskAssessmentApp {
    constructor() {
        this.data = {
            toolQuestions: [],
            contextQuestions: [],
            riskExplanations: [],
            compoundRiskRules: []
        };
        
        this.state = {
            currentSection: 'tool-selection',
            selectedTool: null,
            toolAnswers: {},
            contextAnswers: {}
        };
        
        // Updated Kennedy & Campos framework with 6 harm categories
        this.harmCategories = {
            'Bias': 'Bias & Authenticity',
            'Privacy': 'Privacy & Safety', 
            'Flourishing': 'Human Flourishing & Interpretability',
            'Organizational': 'Organizational & Human Potential',
            'Accuracy': 'Misinformation & Accuracy',
            'Misuse': 'Misuse & Cyberbullying'
        };
        
        // 4 interaction layers from Kennedy & Campos framework
        this.interactionLayers = {
            'Output': 'Individual AI responses and immediate outputs',
            'Whole': 'Complete interaction sessions and user experiences', 
            'Group': 'Classroom and learning group dynamics',
            'System': 'Institutional and systemic-level impacts'
        };
        
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
            { file: 'data/risk_explanations.csv', key: 'riskExplanations' },
            { file: 'data/compound_risk_rules.csv', key: 'compoundRiskRules' }
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
        
        // Navigation buttons - updated IDs to match new HTML
        document.getElementById('tool-back').addEventListener('click', () => {
            this.showSection('tool-selection');
        });
        
        document.getElementById('tool-next').addEventListener('click', () => {
            if (this.validateToolAnswers()) {
                this.saveToolAnswers();
                this.loadContextQuestions();
                this.showSection('context-questions');
            }
        });
        
        document.getElementById('context-back').addEventListener('click', () => {
            this.showSection('tool-questions');
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
        
        // Map tool selection to CSV tool types
        const toolTypeMap = {
            'plagiarism_detection': 'Plagiarism_Detection',
            'llm_tutors': 'LLM_Tutors'
        };
        
        // Load questions for this tool and move to next section
        setTimeout(() => {
            const questionsLoaded = this.loadToolQuestions(toolTypeMap[tool]);
            if (questionsLoaded) {
                this.showSection('tool-questions');
            } else {
                this.showError(`No questions found for ${tool}. Please check the data files.`);
            }
        }, 300);
    }
    
    loadToolQuestions(toolType) {
        const toolQuestions = this.data.toolQuestions.filter(q => 
            q.Tool_Type && q.Tool_Type === toolType
        );
        
        if (toolQuestions.length === 0) {
            console.warn(`No questions found for tool: ${toolType}`);
            return false;
        }
        
        const form = document.getElementById('tool-form');
        form.innerHTML = '';
        
        toolQuestions.forEach((question, index) => {
            const questionDiv = this.createQuestionElement(question, `tool_${index}`);
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
        
        // Parse options (A, B, C, D)
        const options = this.parseOptions(question);
        
        options.forEach((option, index) => {
            if (option.text) { // Only create option if text exists
                const label = document.createElement('label');
                label.className = 'option-label';
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = questionId;
                input.value = option.value;
                input.id = `${questionId}_${index}`;
                
                const text = document.createElement('span');
                text.textContent = option.text;
                
                label.appendChild(input);
                label.appendChild(text);
                optionsDiv.appendChild(label);
            }
        });
        
        div.appendChild(questionText);
        div.appendChild(optionsDiv);
        
        return div;
    }
    
    parseOptions(question) {
        const options = [];
        ['A', 'B', 'C', 'D'].forEach(letter => {
            if (question[`Answer_${letter}`]) {
                options.push({ 
                    value: letter, 
                    text: question[`Answer_${letter}`] 
                });
            }
        });
        return options;
    }
    
    validateToolAnswers() {
        const form = document.getElementById('tool-form');
        const questionGroups = form.querySelectorAll('.question-group');
        
        for (let group of questionGroups) {
            const inputs = group.querySelectorAll('input');
            const hasAnswer = Array.from(inputs).some(input => input.checked);
            
            if (!hasAnswer) {
                group.style.borderLeft = '4px solid #dc2626';
                group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.showError('Please answer all questions before proceeding.');
                return false;
            } else {
                group.style.borderLeft = '4px solid #2563eb';
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
                group.style.borderLeft = '4px solid #dc2626';
                group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.showError('Please answer all questions before proceeding.');
                return false;
            } else {
                group.style.borderLeft = '4px solid #2563eb';
            }
        }
        
        return true;
    }
    
    saveToolAnswers() {
        const form = document.getElementById('tool-form');
        const inputs = form.querySelectorAll('input:checked');
        
        this.state.toolAnswers = {};
        
        inputs.forEach(input => {
            this.state.toolAnswers[input.name] = input.value;
        });
    }
    
    saveContextAnswers() {
        const form = document.getElementById('context-form');
        const inputs = form.querySelectorAll('input:checked');
        
        this.state.contextAnswers = {};
        
        inputs.forEach(input => {
            this.state.contextAnswers[input.name] = input.value;
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
            toolType: this.state.selectedTool,
            harmCategories: {},
            overallRisk: 'LOW',
            activeRisks: []
        };
        
        // Initialize harm categories
        Object.keys(this.harmCategories).forEach(category => {
            profile.harmCategories[category] = {
                severity: 'LOW',
                hasRisk: false,
                explanation: null
            };
        });
        
        // Process tool-specific answers
        this.state.currentToolQuestions.forEach((question, index) => {
            const answerKey = `tool_${index}`;
            const answer = this.state.toolAnswers[answerKey];
            
            if (answer) {
                this.processAnswerRisks(question, answer, profile);
            }
        });
        
        // Apply context modifiers
        this.data.contextQuestions.forEach((question, index) => {
            const answerKey = `context_${index}`;
            const answer = this.state.contextAnswers[answerKey];
            
            if (answer) {
                this.applyContextModifiers(question, answer, profile);
            }
        });
        
        // Apply compound risk rules
        this.applyCompoundRiskRules(profile);
        
        // Get explanations for active risks
        this.addRiskExplanations(profile);
        
        // Determine overall risk level
        profile.overallRisk = this.determineOverallRisk(profile);
        
        return profile;
    }
    
    processAnswerRisks(question, answer, profile) {
        Object.keys(this.harmCategories).forEach(category => {
            const riskColumn = `${answer}_${category}`;
            const severityColumn = `${answer}_Severity`;
            
            if (question[riskColumn] === 'TRUE' || question[riskColumn] === 'true') {
                const severity = question[severityColumn] || 'LOW';
                
                // Update if higher severity
                if (this.isSeverityHigher(severity, profile.harmCategories[category].severity)) {
                    profile.harmCategories[category].severity = severity;
                }
                
                profile.harmCategories[category].hasRisk = true;
            }
        });
    }
    
    applyContextModifiers(question, answer, profile) {
        Object.keys(this.harmCategories).forEach(category => {
            const modifierColumn = `${answer}_${category}_Modifier`;
            const modifier = parseInt(question[modifierColumn]) || 0;
            
            if (modifier !== 0 && profile.harmCategories[category].hasRisk) {
                const currentSeverity = profile.harmCategories[category].severity;
                const newSeverity = this.applySeverityModifier(currentSeverity, modifier);
                profile.harmCategories[category].severity = newSeverity;
            }
        });
    }
    
    applyCompoundRiskRules(profile) {
        // Implementation of compound risk rules based on compound_risk_rules.csv
        this.data.compoundRiskRules.forEach(rule => {
            if (this.ruleApplies(rule, profile)) {
                this.applyRule(rule, profile);
            }
        });
    }
    
    ruleApplies(rule, profile) {
        const conditions = rule.Trigger_Conditions;
        const toolType = rule.Tool_Type;
        
        // Check if rule applies to current tool or both tools
        if (toolType !== 'Both_Tools' && !this.state.selectedTool.includes(toolType.toLowerCase().replace('_', '_'))) {
            return false;
        }
        
        // Parse and evaluate conditions
        try {
            // Handle different condition formats
            if (conditions.includes('Bias=HIGH') && profile.harmCategories['Bias'].severity === 'HIGH') {
                if (conditions.includes('Vulnerable_Population>=60%')) {
                    // Check context for vulnerable population percentage
                    return this.checkVulnerablePopulation(profile, 60);
                }
                return true;
            }
            
            if (conditions.includes('Bias=CRITICAL') && profile.harmCategories['Bias'].severity === 'CRITICAL') {
                if (conditions.includes('No_Appeals=TRUE')) {
                    return this.checkNoAppeals(profile);
                }
                return true;
            }
            
            if (conditions.includes('Integration=Automated')) {
                return this.checkAutomatedIntegration(profile);
            }
            
            if (conditions.includes('Count_CRITICAL_Risks>=2')) {
                const criticalCount = Object.values(profile.harmCategories)
                    .filter(cat => cat.hasRisk && cat.severity === 'CRITICAL').length;
                return criticalCount >= 2;
            }
            
            if (conditions.includes('Count_HIGH_Risks>=2')) {
                const highCount = Object.values(profile.harmCategories)
                    .filter(cat => cat.hasRisk && cat.severity === 'HIGH').length;
                return highCount >= 2;
            }
            
        } catch (error) {
            console.warn('Error evaluating rule condition:', conditions, error);
        }
        
        return false;
    }
    
    applyRule(rule, profile) {
        const effect = rule.Escalation_Effect;
        const warning = rule.Special_Warning;
        
        try {
            if (effect === 'Escalate_to_CRITICAL') {
                // Escalate specific category to CRITICAL
                const category = this.extractCategoryFromRule(rule);
                if (category && profile.harmCategories[category]) {
                    profile.harmCategories[category].severity = 'CRITICAL';
                    profile.harmCategories[category].hasRisk = true;
                }
            } else if (effect.includes('Escalate_') && effect.includes('_to_')) {
                // Handle specific escalations like "Escalate_Privacy_to_HIGH"
                const parts = effect.split('_to_');
                const categoryPart = parts[0].replace('Escalate_', '');
                const newSeverity = parts[1];
                
                if (profile.harmCategories[categoryPart]) {
                    profile.harmCategories[categoryPart].severity = newSeverity;
                    profile.harmCategories[categoryPart].hasRisk = true;
                }
            } else if (effect === 'Escalate_All_to_HIGH') {
                Object.keys(profile.harmCategories).forEach(category => {
                    if (profile.harmCategories[category].hasRisk) {
                        const currentSeverity = profile.harmCategories[category].severity;
                        if (this.isSeverityHigher('HIGH', currentSeverity)) {
                            profile.harmCategories[category].severity = 'HIGH';
                        }
                    }
                });
            }
            
            // Add special warning if provided
            if (warning) {
                if (!profile.compoundWarnings) {
                    profile.compoundWarnings = [];
                }
                profile.compoundWarnings.push({
                    ruleId: rule.Rule_ID,
                    warning: warning,
                    riskCombination: rule.Risk_Combination
                });
            }
            
        } catch (error) {
            console.warn('Error applying rule effect:', effect, error);
        }
    }
    
    checkVulnerablePopulation(profile, threshold) {
        // Check context answers for vulnerable population percentage
        const contextAnswers = Object.values(this.state.contextAnswers);
        // This would need to be implemented based on specific context question structure
        // For now, return a placeholder
        return contextAnswers.includes('D'); // Assuming D represents highest vulnerability
    }
    
    checkNoAppeals(profile) {
        // Check if "No formal appeals" was selected in tool questions
        const toolAnswers = Object.values(this.state.toolAnswers);
        return toolAnswers.includes('A'); // Assuming A represents no appeals
    }
    
    checkAutomatedIntegration(profile) {
        // Check if automated integration was selected
        const toolAnswers = Object.values(this.state.toolAnswers);
        return toolAnswers.includes('D'); // Assuming D represents automated integration
    }
    
    extractCategoryFromRule(rule) {
        // Extract category name from rule context
        const combination = rule.Risk_Combination;
        if (combination.includes('Bias')) return 'Bias';
        if (combination.includes('Privacy')) return 'Privacy';
        if (combination.includes('Flourishing')) return 'Flourishing';
        if (combination.includes('Organizational')) return 'Organizational';
        if (combination.includes('Accuracy')) return 'Accuracy';
        if (combination.includes('Misuse')) return 'Misuse';
        return null;
    }
    
    addRiskExplanations(profile) {
        const toolTypeMap = {
            'plagiarism_detection': 'Plagiarism_Detection',
            'llm_tutors': 'LLM_Tutors'
        };
        
        const csvToolType = toolTypeMap[this.state.selectedTool];
        
        Object.keys(profile.harmCategories).forEach(category => {
            const categoryData = profile.harmCategories[category];
            
            if (categoryData.hasRisk) {
                const explanation = this.data.riskExplanations.find(exp => 
                    exp.Risk_Category === category &&
                    exp.Severity_Level === categoryData.severity &&
                    exp.Tool_Type === csvToolType
                );
                
                if (explanation) {
                    categoryData.explanation = explanation;
                    profile.activeRisks.push({
                        category: category,
                        categoryName: this.harmCategories[category],
                        severity: categoryData.severity,
                        explanation: explanation
                    });
                }
            }
        });
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
            if (category.hasRisk && this.isSeverityHigher(category.severity, highestSeverity)) {
                highestSeverity = category.severity;
            }
        });
        
        return highestSeverity;
    }
    
    displayResults(riskProfile) {
        const container = document.getElementById('results-content');
        container.innerHTML = '';
        
        // Overall risk summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'results-summary';
        summaryDiv.innerHTML = `
            <div class="overall-risk ${riskProfile.overallRisk.toLowerCase()}">
                <h3>Overall Risk Level</h3>
                <div class="risk-badge ${riskProfile.overallRisk.toLowerCase()}">${riskProfile.overallRisk}</div>
                <p class="risk-description">
                    Based on your ${riskProfile.activeRisks.length} identified risk categories for 
                    ${this.getToolDisplayName(riskProfile.toolType)} implementation.
                </p>
            </div>
        `;
        container.appendChild(summaryDiv);
        
        // Compound risk warnings
        if (riskProfile.compoundWarnings && riskProfile.compoundWarnings.length > 0) {
            const warningsDiv = document.createElement('div');
            warningsDiv.className = 'compound-warnings';
            warningsDiv.innerHTML = `
                <h3>⚠️ Compound Risk Warnings</h3>
                <div class="warning-content">
                    <p><strong>Dangerous Risk Combinations Detected:</strong></p>
                    ${riskProfile.compoundWarnings.map(warning => `
                        <div class="warning-item">
                            <div class="warning-header">
                                <strong>${warning.riskCombination}</strong>
                                <span class="warning-badge">HIGH PRIORITY</span>
                            </div>
                            <p>${warning.warning}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(warningsDiv);
        }
        
        // Risk categories with 4 interaction layers
        if (riskProfile.activeRisks.length > 0) {
            const risksDiv = document.createElement('div');
            risksDiv.className = 'risk-categories';
            risksDiv.innerHTML = '<h3>Risk Analysis by Kennedy & Campos Framework</h3>';
            
            riskProfile.activeRisks.forEach(risk => {
                const riskDiv = document.createElement('div');
                riskDiv.className = `risk-category ${risk.severity.toLowerCase()}`;
                
                riskDiv.innerHTML = `
                    <div class="risk-header">
                        <h4>${risk.categoryName}</h4>
                        <div class="risk-badge ${risk.severity.toLowerCase()}">${risk.severity}</div>
                    </div>
                    <div class="risk-explanation">
                        <p>${risk.explanation.Explanation_Text}</p>
                        ${risk.explanation.Citation_Text ? `
                            <div class="citation">
                                <strong>Research Citation:</strong> ${risk.explanation.Citation_Text}
                                ${risk.explanation.Citation_URL ? `<br><a href="${risk.explanation.Citation_URL}" target="_blank">View Research</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="interaction-layers">
                        <h5>Risk Manifestation Across Interaction Layers:</h5>
                        ${this.generateLayerDescriptions(risk.category)}
                    </div>
                `;
                
                risksDiv.appendChild(riskDiv);
            });
            
            container.appendChild(risksDiv);
        } else {
            const noRiskDiv = document.createElement('div');
            noRiskDiv.className = 'no-risks';
            noRiskDiv.innerHTML = `
                <h3>No Significant Risks Identified</h3>
                <p>Based on your responses, the selected implementation approach shows minimal risks across the Kennedy & Campos harm categories.</p>
            `;
            container.appendChild(noRiskDiv);
        }
        
        // Framework information
        const frameworkDiv = document.createElement('div');
        frameworkDiv.className = 'framework-info';
        frameworkDiv.innerHTML = `
            <h4>About This Assessment</h4>
            <p>This assessment is based on the <strong>Kennedy & Campos "Vernacularized Taxonomy of AI Harms in Education"</strong> framework, 
            which identifies risks across 6 harm categories and 4 interaction layers to provide comprehensive risk evaluation for educational AI implementations.</p>
        `;
        container.appendChild(frameworkDiv);
    }
    
    generateLayerDescriptions(category) {
        const descriptions = {
            'Bias': {
                'Output': 'Individual AI responses may contain biased assumptions or discriminatory content',
                'Whole': 'Complete interactions reinforce systematic bias patterns over time',
                'Group': 'Classroom dynamics affected by biased AI outputs creating unfair group experiences',
                'System': 'Institutional embedding of biased AI systems affecting policies and culture'
            },
            'Privacy': {
                'Output': 'Individual AI responses may expose or misuse personal student information',
                'Whole': 'Complete interaction sessions create comprehensive behavioral profiles',
                'Group': 'Group privacy violations through collective data analysis and sharing',
                'System': 'Institution-wide data collection creating permanent surveillance infrastructure'
            },
            'Flourishing': {
                'Output': 'Individual AI responses may reduce student agency and critical thinking',
                'Whole': 'Complete AI interactions replace authentic learning relationships',
                'Group': 'Group learning dynamics diminished through AI mediation',
                'System': 'Institutional over-reliance on AI reduces human potential development'
            },
            'Organizational': {
                'Output': 'Individual AI outputs create administrative burden and complexity',
                'Whole': 'Complete AI systems require significant organizational restructuring',
                'Group': 'Group-level changes in roles and responsibilities due to AI implementation',
                'System': 'System-wide organizational transformation and dependency on AI vendors'
            },
            'Accuracy': {
                'Output': 'Individual AI responses may contain factual errors or misinformation',
                'Whole': 'Complete AI interactions may reinforce misconceptions systematically',
                'Group': 'Group learning affected by collectively shared AI misinformation',
                'System': 'Institutional reliance on potentially inaccurate AI systems'
            },
            'Misuse': {
                'Output': 'Individual AI responses can be misused for academic shortcuts or cheating',
                'Whole': 'Complete AI interactions enable systematic academic dishonesty',
                'Group': 'Group misuse creating unfair academic advantages or cyberbullying',
                'System': 'Institutional failure to prevent systematic AI misuse and abuse'
            }
        };
        
        const categoryDescriptions = descriptions[category] || {};
        
        return Object.entries(this.interactionLayers).map(([layer, layerDesc]) => `
            <div class="layer-item">
                <strong>${layer} Level:</strong> ${categoryDescriptions[layer] || `${category} risks at the ${layer.toLowerCase()} level`}
            </div>
        `).join('');
    }
    
    getToolDisplayName(toolType) {
        const names = {
            'plagiarism_detection': 'Plagiarism Detection',
            'llm_tutors': 'LLM Tutors'
        };
        return names[toolType] || toolType;
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        this.state.currentSection = sectionId;
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
    
    showError(message) {
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
            animation: slideIn 0.3s ease-out;
        `;
        errorDiv.textContent = message;
        
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            activeSection.insertBefore(errorDiv, activeSection.firstChild.nextSibling);
        }
        
        setTimeout(() => errorDiv.remove(), 5000);
        this.hideLoading();
    }
    
    resetAssessment() {
        this.state = {
            currentSection: 'tool-selection',
            selectedTool: null,
            toolAnswers: {},
            contextAnswers: {}
        };
        
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.getElementById('tool-form').innerHTML = '';
        document.getElementById('context-form').innerHTML = '';
        document.getElementById('results-content').innerHTML = '';
        
        this.showSection('tool-selection');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.riskAssessmentApp = new RiskAssessmentApp();
});