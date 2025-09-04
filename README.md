# Agent Onboarding Platform Prototype

A modern, responsive web application for managing agents through their complete lifecycle.

## 🚀 Features

### Agent Lifecycle Management
- **Create** → **Configure** → **Evaluate** → **Deploy** → **Monitor**
- Visual step-by-step guidance for new users

### Agent Templates
- 💼 **Sales Agent** - Lead qualification and customer engagement
- 🔍 **Research Agent** - Information gathering and analysis  
- 🚨 **OpsGenie Agent** - System monitoring and incident management

### Comprehensive Dashboard
- **Agent Management** - View, edit, and monitor all agents
- **Create Agent Form** - Complete form with validation and template integration
- **Metrics & Analytics** - Performance dashboards with charts and KPIs
- **Interactive Features** - Demo toggle, template auto-population

## 🎮 Demo

### Live Preview
Open `src/index.html` in your browser or run a local server:

```bash
cd src
python3 -m http.server 8000
# Then open http://localhost:8000
```

### Key Interactions
1. **Toggle Demo Data** - Blue button (bottom-right) switches between empty and populated states
2. **Template Selection** - Click "Use this template" to auto-populate the create form
3. **Navigation** - Use sidebar to explore different sections
4. **Form Validation** - Try creating an agent with the comprehensive form

## 📊 What's Included

### No Agents State
- Agent lifecycle visualization
- Template selection cards
- Call-to-action for first agent creation

### Agents Exist State  
- Agent list table with mock data
- Performance metrics dashboard
- Quick action buttons (Edit, Evaluate, View Metrics)

### Create Agent Form
- Agent name, product, host configuration
- Owner assignment and date tracking
- Sign-off status management
- Template-based auto-population

### Metrics Dashboard
- KPI cards (Total Agents, Deployments, Requests, Response Time)
- Performance charts (Line chart, Pie chart, Bar chart)
- Top performing agents table with rankings

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Design**: Mobile-first responsive design
- **Data**: Mock data with localStorage persistence
- **No Dependencies** - Pure web technologies

## 🎨 Design Philosophy

- **Developer-focused** interface (not marketing-heavy)
- **Clean, modern layout** with sidebar navigation
- **Accessibility compliant** with proper contrast and focus states
- **Mobile responsive** with breakpoints for all screen sizes

## 📁 File Structure

```
src/
├── index.html      # Main HTML structure
├── styles.css      # Complete CSS with custom properties
└── script.js       # JavaScript functionality and interactions
```

## 🚀 Quick Start

1. Clone or download the repository
2. Open `src/index.html` in your browser
3. Click "Toggle Demo Data" to see populated state
4. Explore different sections using sidebar navigation
5. Try creating an agent using templates

## 💡 Use Cases

Perfect for:
- **Product demos** and stakeholder presentations
- **User experience testing** and feedback collection
- **Development planning** and feature specification
- **Design system** validation and iteration

---

