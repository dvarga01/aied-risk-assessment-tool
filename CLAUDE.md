# AI Risk Assessment Tool for Education

## Project Overview
This is a web-based quiz application for assessing AI implementation risks in educational settings. Built for a UNICEF conference presentation, it applies the Kennedy & Campos "Vernacularized Taxonomy of AI Harms in Education" framework to real-world AI tool procurement decisions.

## Target User
Educators and school administrators evaluating AI tool procurement decisions for plagiarism detection and LLM tutoring systems.

## Application Structure
Single-page web application with 3 sections:
1. **Tool Selection**: Choose one AI tool type to assess (Plagiarism Detection or LLM Tutors)
2. **Tool Questions**: 4 tool-specific questions about implementation approach 
3. **Context Questions**: 5 universal questions about institutional characteristics and readiness

Total: 9 questions per assessment (4 tool + 5 context)

## Data Structure
Four CSV files in `/data` folder:
- `tool_questions.csv`: Tool-specific quiz questions with boolean risk mappings and severity levels
- `context_questions.csv`: Universal institutional context questions with numeric risk modifiers  
- `risk_explanations.csv`: Detailed explanations for each risk category/severity/tool combination
- `compound_risk_rules.csv`: Risk escalation logic for dangerous answer combinations

## Risk Framework (Kennedy & Campos Taxonomy)
**5 Primary Harm Categories:**
1. **Bias & Authenticity** - Discriminatory outputs, false accusations, cultural bias
2. **Privacy & Safety** - Surveillance, data collection, behavioral profiling  
3. **Human Flourishing & Interpretability** - Reduced autonomy, trust erosion, authentic relationship damage
4. **Organizational & Human Potential** - Administrative burden, role restructuring, resource allocation
5. **Misinformation & Accuracy** - Misinformation, false results, reliability issues

**Severity Levels:** LOW, MEDIUM, HIGH, CRITICAL

## Key Technical Requirements

### Data Processing
- Load CSV files using JavaScript (Papa Parse library recommended)
- Risk mappings use boolean columns (A_Bias, A_Privacy, A_Flourishing, A_Organizational, A_Accuracy)
- Context modifiers are numeric (-2 to +3) affecting specific risk categories
- Risk explanations retrieved by matching Risk_Category + Severity_Level + Tool_Type

### Quiz Logic
- Two tool focus options: Plagiarism Detection or LLM Tutors
- Question flow: Tool selection → Tool questions (4) → Context questions (5) → Results
- Risk calculation: Base severity from answers + context modifiers + compound risk escalation
- Results display personalized explanations with academic citations

### Critical Implementation Notes
- **Browser Storage**: Can use localStorage/sessionStorage if desired for preserving quiz state across sessions
- **GitHub Pages Deployment**: Static file serving - ensure all CSV files are in accessible `/data` folder
- Include "Assess Different Tool" button to restart with new tool type
- Professional styling suitable for conference presentation
- Responsive design for laptop presentation
- **CSV Loading**: Ensure proper CORS handling for local CSV file access via Papa Parse

### Risk Calculation System
1. **Base Risk Assessment**: Each tool question answer maps to severity levels for relevant risk categories
2. **Context Modifiers**: Institutional characteristics modify base risks via numeric adjustments
3. **Compound Risk Rules**: Dangerous combinations trigger risk escalations (e.g., high bias + vulnerable populations)
4. **Final Risk Levels**: Calculated risks determine which explanations to display from risk_explanations.csv

### Results Display Requirements
**For Each Active Risk Category:**
- Risk level (LOW/MEDIUM/HIGH/CRITICAL) with visual indicators
- Personalized explanation text specific to tool type and severity
- Academic citation and link to supporting research
- Clear connection between user's answers and resulting risks

**Special Features:**
- Context-aware messaging that references user's specific institutional characteristics
- Compound risk warnings for particularly dangerous combinations
- Academic grounding through Kennedy & Campos framework integration

## User Experience Goals
- **Mobile-First Design**: Optimized for smartphones and tablets as primary interaction medium
- Simple, intuitive interface suitable for educators without technical background
- Touch-friendly interface elements with appropriate sizing for mobile interaction
- Clear explanation of why specific choices create educational risks
- Academic credibility through research citations and framework grounding
- Professional appearance suitable for conference demonstration and sharing
- Fast loading and smooth performance on mobile networks
- Educational value that demonstrates vernacularized risk assessment in action

## Development Approach
Build as vanilla HTML/CSS/JavaScript application for maximum compatibility and simplicity. Use Papa Parse for CSV loading. Focus on clean data flow from CSV files through risk calculation to personalized explanations.

## CSV File Specifications

### tool_questions.csv
Columns: Question_ID, Tool_Type, Question_Text, Answer_A/B/C/D, A/B/C/D_Severity, A/B/C/D_[Risk]

### context_questions.csv  
Columns: Question_ID, Question_Text, Answer_A/B/C/D, A/B/C/D_[Risk]_Modifier

### risk_explanations.csv
Columns: Risk_Category, Severity_Level, Tool_Type, Explanation_Text, Citation_Text, Citation_URL

### compound_risk_rules.csv
Columns: Rule_ID, Tool_Type, Risk_Combination, Trigger_Conditions, Escalation_Effect, Special_Warning
