# AI Risk Assessment Tool for Education

## Project Overview
This is a web-based quiz application for assessing AI implementation risks in educational settings. Built for a UNICEF conference presentation, it applies the Kennedy & Campos "Vernacularized Taxonomy of AI Harms in Education" framework to real-world AI tool deployments.

## Target User
Educators and school administrators evaluating AI tool procurement decisions.

## Application Structure
Single-page web application with 3 sections:
1. **Tool Selection**: Choose one AI tool type to assess (Proctoring, Tutoring, Grading, Content Creation, Adaptive Learning, Safety)
2. **Usage Questions**: 3-4 tool-specific questions about implementation approach
3. **Context Questions**: 4 universal questions about school demographics and readiness

Total: 7-9 questions maximum per assessment

## Data Structure
Four CSV files in `/data` folder:
- `tool_questions.csv`: All tool-specific quiz questions with boolean harm category mappings
- `context_questions.csv`: Universal school context questions with risk modifiers  
- `risk_calculation_rules.csv`: Compound risk escalation and context modifier logic
- `harm_categories_reference.csv`: Definitions and examples of 6 harm categories

## Risk Framework (Kennedy & Campos Taxonomy)
**6 Harm Categories:**
1. **BA** - Bias & Authenticity
2. **MA** - Misinformation & Accuracy  
3. **PS** - Privacy & Safety
4. **MC** - Misuse & Cyberbullying
5. **HI** - Human Flourishing & Interpretability
6. **OH** - Organizational & Human Potential

**4 Interaction Layers:**
1. **Output** - Individual AI response level
2. **Whole** - Complete interaction with AI system
3. **Group** - Classroom/learning group level
4. **System** - School/district/institutional level

**Severity Levels:** LOW, MEDIUM, HIGH, CRITICAL

## Key Technical Requirements

### Data Processing
- Load CSV files using JavaScript (Papa Parse library recommended)
- All harm category mappings use boolean columns (A_BA, A_MA, etc.)
- All interaction layer mappings use boolean columns (A_Output, A_Whole, etc.)
- Context modifiers are numeric (+3, +2, +1, 0, -1)

### Quiz Logic
- Single tool focus per assessment
- Question flow: Tool selection → Tool usage questions → Context questions → Results
- Risk calculation applies base severity + context modifiers + compound risk rules
- Results show harm manifestation across all 4 interaction layers

### Critical Implementation Notes
- **No localStorage/sessionStorage** - Claude.ai artifacts don't support browser storage
- Use in-memory JavaScript objects for state management
- Include "Assess Different Tool" button at end to restart with new tool type
- Professional styling suitable for conference presentation
- Responsive design for laptop presentation

### Compound Risk System
The application must implement compound risk logic from `risk_calculation_rules.csv`:
- Certain answer combinations escalate severity (e.g., biometric monitoring + vulnerable populations = CRITICAL)
- Context modifiers affect specific harm categories differently
- Some risks have minimum severity floors that cannot be reduced below certain levels
- Bootstrap effects where multiple tools with same risks compound over time

### Results Display Requirements
Show results across interaction layers:
- Individual student impact
- Classroom/group dynamics impact  
- School/institutional impact
- Systemic educational impact

Include specific examples from harm categories reference sheet to help users understand practical implications.

## User Experience Goals
- Simple, intuitive interface suitable for educators without technical background
- Clear explanation of risk categories and what they mean in educational context
- Actionable results that help inform procurement decisions
- Professional appearance suitable for conference demonstration

## Development Approach
Build as vanilla HTML/CSS/JavaScript application for maximum compatibility and simplicity. No frameworks required - keep dependencies minimal for easy deployment and demonstration.
