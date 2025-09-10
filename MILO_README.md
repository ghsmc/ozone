# Milo Opportunity Scout 🎌

**Production-ready AI system for finding unconventional opportunities for Yale students**

## 🚀 Quick Start

### 1. **In Your React App**
- Complete the onboarding flow
- Switch to the "Milo Scout" tab in the feed
- View personalized opportunities with specific companies, links, and action steps

### 2. **Test the Python Script**
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your_api_key_here"

# Run the test
python3 test-milo.py
```

## 🎯 What Milo Does

Milo finds **unconventional, energizing opportunities** that go beyond typical consulting/IB/FAANG pipelines:

- **Specific opportunities** with real company names and links
- **Yale connections** (3+ per response: professors, labs, centers, alumni)
- **Action ladders** with micro-projects and contact steps
- **Time-aware recommendations** based on current academic term
- **Constraint-aware** (paid, remote, visa-friendly, etc.)

## 🧠 Psychology Principles

- **Originality over conformity**: Surface non-obvious doors and "create your own slot" options
- **Passion through doing**: Recommend small experiments → projects → commitments
- **Hidden potential**: Nudge toward growth via challenge, feedback, and craft
- **Givers win**: Include options that help communities or build ecosystems
- **Deep work over optics**: Prefer opportunities that build real skills and relationships

## 📊 Example Output

For a Yale sophomore in Economics & Math interested in F1, EVs, and LatAm policy:

- **Oliver Wyman** (transportation consulting) - with Yale alumni connection
- **Yale Urban Design Workshop** (research assistant) - direct Yale connection
- **NRDC** (EV policy internship) - environmental focus
- **Inter-American Dialogue** (LatAm policy fellowship) - regional expertise
- **Rivian** (startup shadowing) - EV innovation

Each includes specific contact methods, micro-projects to propose, and exact next steps.

## 🔧 Technical Details

- **Model**: GPT-4o with JSON schema enforcement
- **Temperature**: 0.2 for consistency
- **Validation**: Automatic quality checks (5+ opportunities, 3+ Yale connections)
- **Fallback**: Graceful degradation when OpenAI is unavailable
- **UI**: Japanese-themed interface with clean, modern design

## 🎨 Design Philosophy

- **Soft white/yellowish backgrounds** with red accents
- **Very clean design** with minimal distractions
- **Step-by-step streaming** of responses
- **Immediate actionability** with specific next steps

---

*Built by Yale students, for Yale students* 🎓
