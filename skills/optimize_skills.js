const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const SKILLS_DIR = path.join(process.env.HOME, '.openclaw', 'skills');

const SKILL_EMOJIS = {
  'agent-browser': '🌐',
  'ai-data-analyst': '📊',
  'api-patterns': '🔌',
  'app-builder': '🏗️',
  'architecture': '📐',
  'asaas': '💳',
  'brainstorming': '🧠',
  'canvas-design': '🎨',
  'capability-evolver': '🧬',
  'database-design': '🗄️',
  'docker-expert': '🐳',
  'documentation-templates': '📝',
  'find-skills': '🔍',
  'frontend-design': '✨',
  'gog-workspace': '🏢',
  'gpus-theme': '🖌️',
  'linear-planner': '📅',
  'nano-banana-pro': '🍌',
  'notion': '📓',
  'parallel-agents': '👯',
  'performance-profiling': '⚡',
  'plan-writing': '📋',
  'planning': '🗺️',
  'proactive-agent': '🤖',
  'product-management': '👔',
  'python-patterns': '🐍',
  'react-patterns': '⚛️',
  'seo-fundamentals': '🔎',
  'server-management': '🖥️',
  'systematic-debugging': '🐛',
  'tailwind-patterns': '🌊',
  'testing-patterns': '🧪',
  'typescript-expert': '📘',
  'uds-search': '🗃️',
  'ui-ux-pro-max': '💎',
  'voice-calling': '📞',
  'vulnerability-scanner': '🛡️',
  'webapp-testing': '🎭',
  'xlsx': '📊',
  'zoom': '🎥'
};

const SKILL_BINS = {
  'agent-browser': ['agent-browser'],
  'docker-expert': ['docker'],
  'nano-banana-pro': ['python'],
  'frontend-design': ['python']
};

const SKILL_ENV = {
  'nano-banana-pro': ['GEMINI_API_KEY'],
  'frontend-design': ['GEMINI_API_KEY']
};

function processSkill(skillDirName) {
  const skillPath = path.join(SKILLS_DIR, skillDirName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return;

  let content = fs.readFileSync(skillPath, 'utf8');

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`[!] No frontmatter found for ${skillDirName}`);
    return;
  }

  const rawFrontmatter = frontmatterMatch[1];
  let parsedFrontmatter;
  try {
    parsedFrontmatter = yaml.parse(rawFrontmatter);
  } catch (e) {
    console.log(`[!] Error parsing YAML for ${skillDirName}:`, e.message);
    return;
  }

  const originalDescription = parsedFrontmatter.description || '';

  let shortDescription = originalDescription;
  if (shortDescription.length > 140) {
      // Very naive sentence split. We prefer the first one or two sentences under 140 chars.
      const sentences = shortDescription.split(/(?<=[.!?])\s+(?=[A-Z])/);
      shortDescription = sentences[0];
      if (sentences.length > 1 && (shortDescription.length + sentences[1].length + 1) < 140) {
          shortDescription += ' ' + sentences[1];
      }
      if (shortDescription.length > 140) {
          shortDescription = shortDescription.substring(0, 137) + '...';
      }
  }

  const metadata = {
    openclaw: {
      emoji: SKILL_EMOJIS[skillDirName] || '🛠️'
    }
  };

  if (SKILL_BINS[skillDirName] || SKILL_ENV[skillDirName]) {
    metadata.openclaw.requires = {};
    if (SKILL_BINS[skillDirName]) {
      metadata.openclaw.requires.bins = SKILL_BINS[skillDirName];
    }
    if (SKILL_ENV[skillDirName]) {
      metadata.openclaw.requires.env = SKILL_ENV[skillDirName];
    }
  }

  // Purely informational skills or guidelines shouldn't be invoked by the model automatically as tools,
  // but OpenClaw might still inject them unless we do something else.

  // Since openclaw requires the metadata object as a single-line json STRING in yaml.
  // Example from docs: 'metadata: { "openclaw": { ... } }'

  // We recreate yaml string manually to ensure the stringified JSON isn't word-wrapped by the yaml library
  // and sits on a single line.

  const nameLine = `name: ${parsedFrontmatter.name}`;
  // Escape description to avoid parsing errors
  const escapedDesc = shortDescription.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const descLine = `description: "${escapedDesc}"`;

  const metaString = JSON.stringify(metadata);
  const metadataLine = `metadata: ${metaString}`;

  let newFrontmatterStr = `${nameLine}\n${descLine}\n${metadataLine}`;

  let bodyContent = content.substring(frontmatterMatch[0].length).trim();

  if (originalDescription.length > 140 && !bodyContent.includes(originalDescription.substring(0, 50))) {
     // Inject it right after the first H1 or completely at the top
     const h1Match = bodyContent.match(/^# .*\n/);
     if (h1Match) {
       bodyContent = bodyContent.replace(h1Match[0], `${h1Match[0]}\n## Overview\n\n> ${originalDescription}\n\n`);
     } else {
       bodyContent = `## Overview\n\n> ${originalDescription}\n\n` + bodyContent;
     }
  }

  const finalContent = `---\n${newFrontmatterStr}\n---\n\n${bodyContent}\n`;

  fs.writeFileSync(skillPath, finalContent, 'utf8');
  console.log(`[✓] Optimized ${skillDirName}`);
}

const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'node_modules' && dirent.name !== 'references' && !dirent.name.startsWith('.'))
  .map(dirent => dirent.name);

console.log(`Found ${dirs.length} skills. Optimizing...`);
dirs.forEach(processSkill);
console.log('Done.');
