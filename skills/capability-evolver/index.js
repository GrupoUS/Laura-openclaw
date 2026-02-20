const path = require('path');
const evolve = require('./evolve');
const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const isLoop = args.includes('--loop') || args.includes('--mad-dog');

  if (command === 'run' || command === '/evolve' || isLoop) {
    console.log('🚀 Starting Capability Evolver...');
    
    if (isLoop) {
        console.log('🐕 **MAD DOG MODE (Relay) ACTIVATED** 🐕');
        // [RELAY MODE RESTORED 2026-02-03]
        // Run once, then let evolve.js trigger the next agent via sessions_spawn.
        try {
            await evolve.run();
        } catch (error) {
            console.error('Evolution failed:', error);
            
            // [Self-Healing Hook] (Restored 2026-02-03)
            if (process.env.ON_EVOLUTION_FAIL) {
                console.log('⚠️ Executing Fail Hook...');
                try {
                    execSync(process.env.ON_EVOLUTION_FAIL, { stdio: 'inherit' });
                } catch (hookError) {
                    console.error('Fail Hook crashed:', hookError.message);
                }
            }
            process.exit(1);
        }
    } else {
        // Normal Single Run
        try {
            await evolve.run();
        } catch (error) {
            console.error('Evolution failed:', error);
            process.exit(1);
        }
    }

    // (Star Beggar Module Removed for Professionalism)
    
  } else {
    console.log(`Usage: node index.js [run|/evolve] [--loop]`);
  }
}

if (require.main === module) {
  main();
}
