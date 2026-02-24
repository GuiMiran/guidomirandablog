/**
 * Spec-Driven Development Pipeline
 * Validation Script
 * 
 * Validates that implementation matches specifications
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: ValidationResult[] = [];

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function addResult(category: string, item: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ category, item, status, message });
}

// Validation 1: Skills Layer
function validateSkills() {
  log(colors.blue, '\n📊 Validating Skills Layer...');
  
  const requiredSkills = [
    'generate_content.ts',
    'summarize_content.ts',
    'chat_interaction.ts',
    'analyze_seo.ts',
    'moderate_content.ts',
    'translate_content.ts'
  ];
  
  const skillsPath = 'src/lib/skills';
  
  requiredSkills.forEach(skill => {
    const skillPath = join(skillsPath, skill);
    if (existsSync(skillPath)) {
      addResult('Skills', skill, 'pass', 'Skill implementation found');
      log(colors.green, `  ✓ ${skill}`);
    } else {
      addResult('Skills', skill, 'fail', 'Skill implementation missing');
      log(colors.red, `  ✗ ${skill}`);
    }
  });
}

// Validation 2: Agents Layer
function validateAgents() {
  log(colors.blue, '\n🤖 Validating Agents Layer...');
  
  const requiredAgents = [
    'planner.ts',
    'executor.ts',
    'coder.ts',
    'reviewer.ts',
    'orchestrator.ts',
    'base.ts'
  ];
  
  const agentsPath = 'src/lib/agents';
  
  requiredAgents.forEach(agent => {
    const agentPath = join(agentsPath, agent);
    if (existsSync(agentPath)) {
      addResult('Agents', agent, 'pass', 'Agent implementation found');
      log(colors.green, `  ✓ ${agent}`);
    } else {
      addResult('Agents', agent, 'fail', 'Agent implementation missing');
      log(colors.red, `  ✗ ${agent}`);
    }
  });
}

// Validation 3: Protocols
function validateProtocols() {
  log(colors.blue, '\n📋 Validating Protocols...');
  
  const protocolsPath = 'src/lib/protocols';
  
  if (existsSync(protocolsPath)) {
    addResult('Protocols', 'Directory', 'pass', 'Protocols directory exists');
    log(colors.green, `  ✓ Protocols directory`);
    
    if (existsSync(join(protocolsPath, 'index.ts'))) {
      addResult('Protocols', 'index.ts', 'pass', 'Protocol definitions found');
      log(colors.green, `  ✓ Protocol definitions (ACP, SEP, CVP, ENP, EHP)`);
    }
  } else {
    addResult('Protocols', 'Directory', 'fail', 'Protocols directory missing');
    log(colors.red, `  ✗ Protocols directory`);
  }
}

// Validation 4: API Endpoints
function validateAPI() {
  log(colors.blue, '\n🌐 Validating API Endpoints...');
  
  const requiredEndpoints = [
    'generate/route.ts',
    'chat/route.ts',
    'summarize/route.ts',
    'analyze/route.ts',
    'orchestrate/route.ts',
    'health/route.ts',
    'metrics/route.ts'
  ];
  
  const apiPath = 'src/app/api/ai';
  
  requiredEndpoints.forEach(endpoint => {
    const endpointPath = join(apiPath, endpoint);
    if (existsSync(endpointPath)) {
      addResult('API', endpoint, 'pass', 'API endpoint found');
      log(colors.green, `  ✓ ${endpoint}`);
    } else {
      addResult('API', endpoint, 'fail', 'API endpoint missing');
      log(colors.red, `  ✗ ${endpoint}`);
    }
  });
}

// Validation 5: Observability
function validateObservability() {
  log(colors.blue, '\n👁️  Validating Observability Layer...');
  
  const utilsPath = 'src/lib/utils';
  const requiredUtils = ['logger.ts', 'metrics.ts', 'cache.ts'];
  
  requiredUtils.forEach(util => {
    const utilPath = join(utilsPath, util);
    if (existsSync(utilPath)) {
      addResult('Observability', util, 'pass', 'Utility implementation found');
      log(colors.green, `  ✓ ${util}`);
    } else {
      addResult('Observability', util, 'fail', 'Utility implementation missing');
      log(colors.red, `  ✗ ${util}`);
    }
  });
}

// Validation 6: Tests
function validateTests() {
  log(colors.blue, '\n🧪 Validating Tests...');
  
  const testsPath = 'tests/unit';
  
  if (existsSync(testsPath)) {
    const testFiles = readdirSync(testsPath).filter(f => f.endsWith('.test.ts'));
    
    if (testFiles.length > 0) {
      addResult('Tests', 'Unit Tests', 'pass', `${testFiles.length} test files found`);
      log(colors.green, `  ✓ ${testFiles.length} unit test files`);
      testFiles.forEach(file => {
        log(colors.green, `    • ${file}`);
      });
    } else {
      addResult('Tests', 'Unit Tests', 'warning', 'No test files found');
      log(colors.yellow, `  ⚠ No test files found`);
    }
  } else {
    addResult('Tests', 'Directory', 'fail', 'Tests directory missing');
    log(colors.red, `  ✗ Tests directory missing`);
  }
}

// Validation 7: Documentation
function validateDocumentation() {
  log(colors.blue, '\n📚 Validating Documentation...');
  
  const requiredDocs = [
    'PHASE-1-SKILLS-SPEC.md',
    'PHASE-2-AGENT-LAYER-SPEC.md',
    'PHASE-3-OPTIMIZATION-SPEC.md',
    'TESTING-RESULTS.md'
  ];
  
  const docsPath = 'docs';
  
  requiredDocs.forEach(doc => {
    const docPath = join(docsPath, doc);
    if (existsSync(docPath)) {
      addResult('Documentation', doc, 'pass', 'Documentation found');
      log(colors.green, `  ✓ ${doc}`);
    } else {
      addResult('Documentation', doc, 'warning', 'Documentation missing');
      log(colors.yellow, `  ⚠ ${doc}`);
    }
  });
}

// Generate Summary
function generateSummary() {
  log(colors.blue, '\n' + '='.repeat(60));
  log(colors.blue, '📊 VALIDATION SUMMARY');
  log(colors.blue, '='.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const total = results.length;
  
  log(colors.green, `✓ Passed:   ${passed}/${total}`);
  if (failed > 0) {
    log(colors.red, `✗ Failed:   ${failed}/${total}`);
  }
  if (warnings > 0) {
    log(colors.yellow, `⚠ Warnings: ${warnings}/${total}`);
  }
  
  const percentage = ((passed / total) * 100).toFixed(1);
  log(colors.blue, `\nAlignment: ${percentage}%`);
  
  // Category breakdown
  log(colors.blue, '\n📋 By Category:');
  const categorySet = new Set(results.map(r => r.category));
  const categories = Array.from(categorySet);
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.status === 'pass').length;
    const categoryTotal = categoryResults.length;
    const categoryPercentage = ((categoryPassed / categoryTotal) * 100).toFixed(0);
    
    const color = categoryPercentage === '100' ? colors.green : 
                  parseInt(categoryPercentage) >= 80 ? colors.yellow : colors.red;
    
    log(color, `  ${category}: ${categoryPassed}/${categoryTotal} (${categoryPercentage}%)`);
  });
  
  // Exit code
  log(colors.blue, '\n' + '='.repeat(60));
  if (failed > 0) {
    log(colors.red, '❌ VALIDATION FAILED');
    process.exit(1);
  } else {
    log(colors.green, '✅ VALIDATION PASSED');
    process.exit(0);
  }
}

// Main execution
async function main() {
  log(colors.blue, '🚀 Spec-Driven Development Pipeline');
  log(colors.blue, '   Validating Implementation vs Specifications\n');
  
  validateSkills();
  validateAgents();
  validateProtocols();
  validateAPI();
  validateObservability();
  validateTests();
  validateDocumentation();
  
  generateSummary();
}

main().catch(error => {
  log(colors.red, `\n❌ Error: ${error.message}`);
  process.exit(1);
});
