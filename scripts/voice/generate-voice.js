const InworldTTSClient = require('./inworld-client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function generate() {
  const tts = new InworldTTSClient();
  
  if (!tts.isConfigured()) {
    console.error('Inworld API not configured');
    process.exit(1);
  }

  const text = process.argv[2] || 'Oi Maurício! Confere agora se essa é a voz correta da Laura que você configurou. Fiz o ajuste para usar a configuração exata do Inworld.';
  console.log(`Generating audio for: "${text}"`);

  try {
    const pcmBuffer = await tts.synthesize(text);
    
    const pcmPath = path.join('/tmp', `voice-${Date.now()}.pcm`);
    const mp3Path = pcmPath.replace('.pcm', '.mp3');
    
    fs.writeFileSync(pcmPath, pcmBuffer);
    console.log(`PCM saved to ${pcmPath}`);

    // Convert PCM to MP3 using ffmpeg
    // Assuming 48kHz 16-bit mono based on config default
    const cmd = `ffmpeg -f s16le -ar 48000 -ac 1 -i "${pcmPath}" -y "${mp3Path}"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`ffmpeg error: ${error.message}`);
        return;
      }
      console.log(`MP3 saved to ${mp3Path}`);
      console.log(`MEDIA_PATH:${mp3Path}`); // Output for parsing
      
      // Cleanup PCM
      fs.unlinkSync(pcmPath);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

generate();
