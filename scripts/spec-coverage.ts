/**
 * Spec Coverage Calculator
 * 
 * Calculates alignment percentage based on implemented features
 */

import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CoverageReport {
  alignment: number;
  skills: string;
  agents: string;
  optimization: string;
  details: {
    skills: string;
    agents: string;
    tests: string;
    apis: string;
  };
  breakdown: {
    category: string;
    implemented: number;
    total: number;
    percentage: number;
  }[];
}

function checkExists(paths: string[]): number {
  return paths.filter(p => existsSync(p)).length;
}

function calculateCoverage(): CoverageReport {
  // Phase 1: Skills Layer (60% target)
  const skillPaths = [
    'src/lib/skills/generate_content.ts',
    'src/lib/skills/summarize_content.ts',
    'src/lib/skills/chat_interaction.ts',
    'src/lib/skills/analyze_seo.ts',
    'src/lib/skills/moderate_content.ts',
    'src/lib/skills/translate_content.ts'
  ];
  const skillsImplemented = checkExists(skillPaths);
  const skillsPercentage = (skillsImplemented / skillPaths.length) * 100;

  // Phase 2: Agents Layer (80% target)
  const agentPaths = [
    'src/lib/agents/base.ts',
    'src/lib/agents/planner.ts',
    'src/lib/agents/executor.ts',
    'src/lib/agents/coder.ts',
    'src/lib/agents/reviewer.ts',
    'src/lib/agents/orchestrator.ts',
    'src/lib/protocols/index.ts'
  ];
  const agentsImplemented = checkExists(agentPaths);
  const agentsPercentage = (agentsImplemented / agentPaths.length) * 100;

  // Phase 3: Optimization Layer (95% target)
  const optimizationPaths = [
    'src/lib/utils/logger.ts',
    'src/lib/utils/metrics.ts',
    'src/lib/utils/cache.ts',
    'src/app/api/ai/health/route.ts',
    'src/app/api/ai/metrics/route.ts'
  ];
  const optimizationImplemented = checkExists(optimizationPaths);
  const optimizationPercentage = (optimizationImplemented / optimizationPaths.length) * 100;

  // API Endpoints
  const apiPaths = [
    'src/app/api/ai/generate/route.ts',
    'src/app/api/ai/chat/route.ts',
    'src/app/api/ai/summarize/route.ts',
    'src/app/api/ai/analyze/route.ts',
    'src/app/api/ai/orchestrate/route.ts',
    'src/app/api/ai/health/route.ts',
    'src/app/api/ai/metrics/route.ts'
  ];
  const apisImplemented = checkExists(apiPaths);

  // Tests
  const testPaths = [
    'tests/unit/logger.test.ts',
    'tests/unit/cache.test.ts',
    'tests/unit/metrics.test.ts'
  ];
  const testsImplemented = checkExists(testPaths);

  // Calculate overall alignment
  const totalImplemented = skillsImplemented + agentsImplemented + optimizationImplemented;
  const totalRequired = skillPaths.length + agentPaths.length + optimizationPaths.length;
  const overallAlignment = Math.round((totalImplemented / totalRequired) * 100);

  const report: CoverageReport = {
    alignment: overallAlignment,
    skills: skillsPercentage === 100 ? '✅ Complete' : `${skillsPercentage}%`,
    agents: agentsPercentage === 100 ? '✅ Complete' : `${agentsPercentage}%`,
    optimization: optimizationPercentage === 100 ? '✅ Complete' : `${optimizationPercentage}%`,
    details: {
      skills: `${skillsImplemented}/${skillPaths.length}`,
      agents: `${agentsImplemented}/${agentPaths.length}`,
      tests: `${testsImplemented}/${testPaths.length}`,
      apis: `${apisImplemented}/${apiPaths.length}`
    },
    breakdown: [
      {
        category: 'Skills Layer',
        implemented: skillsImplemented,
        total: skillPaths.length,
        percentage: Math.round(skillsPercentage)
      },
      {
        category: 'Agent Layer',
        implemented: agentsImplemented,
        total: agentPaths.length,
        percentage: Math.round(agentsPercentage)
      },
      {
        category: 'Optimization Layer',
        implemented: optimizationImplemented,
        total: optimizationPaths.length,
        percentage: Math.round(optimizationPercentage)
      },
      {
        category: 'API Endpoints',
        implemented: apisImplemented,
        total: apiPaths.length,
        percentage: Math.round((apisImplemented / apiPaths.length) * 100)
      },
      {
        category: 'Unit Tests',
        implemented: testsImplemented,
        total: testPaths.length,
        percentage: Math.round((testsImplemented / testPaths.length) * 100)
      }
    ]
  };

  return report;
}

function printReport(report: CoverageReport) {
  console.log('\n📊 SPEC-DRIVEN DEVELOPMENT COVERAGE REPORT');
  console.log('='.repeat(60));
  console.log(`\n🎯 Overall Alignment: ${report.alignment}%\n`);
  
  console.log('Phase Completion:');
  console.log(`  • Skills Layer:       ${report.skills}`);
  console.log(`  • Agent Layer:        ${report.agents}`);
  console.log(`  • Optimization Layer: ${report.optimization}`);
  
  console.log('\nImplementation Details:');
  console.log(`  • Skills:     ${report.details.skills}`);
  console.log(`  • Agents:     ${report.details.agents}`);
  console.log(`  • Tests:      ${report.details.tests}`);
  console.log(`  • API Routes: ${report.details.apis}`);
  
  console.log('\nBreakdown by Category:');
  report.breakdown.forEach(item => {
    const status = item.percentage === 100 ? '✅' : 
                   item.percentage >= 80 ? '🟡' : '🔴';
    console.log(`  ${status} ${item.category.padEnd(20)} ${item.implemented}/${item.total} (${item.percentage}%)`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (report.alignment >= 95) {
    console.log('🎉 EXCELLENT! System is production-ready');
  } else if (report.alignment >= 80) {
    console.log('✅ GOOD! System is functional');
  } else if (report.alignment >= 60) {
    console.log('⚠️  PARTIAL! More work needed');
  } else {
    console.log('❌ INCOMPLETE! Significant work required');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Main execution
const report = calculateCoverage();
printReport(report);

// Write JSON report for CI/CD
writeFileSync('spec-coverage.json', JSON.stringify(report, null, 2));
console.log('✅ Coverage report saved to spec-coverage.json\n');

// Exit with appropriate code
process.exit(report.alignment >= 80 ? 0 : 1);
