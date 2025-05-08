const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spin-button");
const selectedTrackDisplay = document.getElementById("selected-track");

// F1 Track Names
const tracks = [
  "Australia", // Melbourne
  "China", // Shanghai
  "Japan", // Suzuka
  "Bahrain", // Sakhir
  "Saudi Arabia", // Jeddah
  "Miami", // Miami
  "Imola", // Imola
  "Monaco", // Monaco
  "Spain", // Barcelona
  "Canada", // Montreal
  "Austria", // Spielberg
  "Silverstone", // Silverstone
  "Belgium", // Spa
  "Hungary", // Budapest
  "Netherlands", // Zandvoort
  "Monza", // Monza
  "Azerbaijan", // Baku
  "Singapore", // Singapore
  "Austin", // Austin
  "Mexico", // Mexico City
  "Brazil", // São Paulo
  "Las Vegas", // Las Vegas
  "Qatar", // Lusail
  "Abu Dhabi", // Yas Marina
  // Special
  "Special",
];

// Set Canvas Dimensions (800px for the entire canvas)
const canvasSize = 1000;
const canvasRadius = canvasSize / 2;

canvas.width = canvasSize;
canvas.height = canvasSize;
canvas.style.width = `${canvasSize}px`;
canvas.style.height = `${canvasSize}px`;

canvas.style.position = "absolute";
canvas.style.top = "50%";
canvas.style.left = "50%";
canvas.style.transform = "translate(-50%, -50%)";

// Add Overlay Image for Wheel (600px for overlay)
const wheelOverlaySize = 800;
const wheelOverlay = document.createElement("img");
wheelOverlay.src = "wheel2.svg"; // Replace with the correct path
wheelOverlay.style.position = "absolute";
wheelOverlay.style.width = `${wheelOverlaySize}px`;
wheelOverlay.style.height = `${wheelOverlaySize}px`;
wheelOverlay.style.top = "50%";
wheelOverlay.style.left = "50%";
wheelOverlay.style.transform = "translate(-50%, -50%)";
wheelOverlay.style.transformOrigin = "center center";
wheelOverlay.style.pointerEvents = "none";
document.body.appendChild(wheelOverlay);

let currentAngle = 0;
let isSpinning = false;
// Reuse the same AudioContext
let audioContext = null;
let oscillator = null;
let gainNode = null;
const particles = [];
let lastSlice = -1;

class Particle {
  constructor(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 2; // 2-6px
    this.speedX = 0; // Overridden in subclasses
    this.speedY = 0;
    this.opacity = 0;
    this.color = '';
    this.shrinkRate = 0.96; // Shrink 4% per frame
    this.drag = 0.96; // Slow down
    this.lifetime = 0;
    this.markedForDeletion = false;
    this.shadowBlur = 0;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedX *= this.drag;
    this.speedY *= this.drag;
    this.size *= this.shrinkRate;
    this.opacity *= 0.95;
    this.color = this.color.replace(/rgba\([^,]+,[^,]+,[^,]+,[^)]+\)/, `rgba(${this.color.split(',')[0].split('(')[1]},${this.color.split(',')[1]},${this.color.split(',')[2]},${this.opacity})`);
    this.lifetime--;
    if (this.size < 0.5 || this.opacity < 0.01 || this.lifetime <= 0) {
      this.markedForDeletion = true;
    }
  }

  draw(context) {
    context.save();
    context.shadowBlur = this.shadowBlur;
    context.shadowColor = this.shadowColor || 'rgba(255, 255, 255, 0.5)';
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }
}

class Dust extends Particle {
  constructor(x, y, velocity) {
    super(x, y, velocity);
    this.speedX = -(velocity * (Math.random() * 32 + 32)); // Leftward, 2-5x velocity
    this.speedY = (Math.random() - 0.5) * 6; // ±3px vertical
    this.opacity = Math.random() * 0.4 + 0.4; // 0.4-0.8
    // Improved dust color - slightly warmer gray with subtle variation
    const dustBrightness = Math.floor(Math.random() * 30 + 170); // 170-200 range
    this.color = `rgba(${dustBrightness + 10}, ${dustBrightness + 5}, ${dustBrightness}, ${this.opacity})`; // Warmer gray dust
    this.lifetime = Math.random() * 60 + 60; // 60-120 frames
    this.shadowBlur = Math.random() * 4 + 4; // 4-8 glow
  }
}

class Spark extends Particle {
  constructor(x, y, velocity) {
    super(x, y, velocity);
    this.speedX = -(velocity * (Math.random() * 14 + 13)); // Leftward, 3-7x velocity
    this.speedY = (Math.random() - 0.5) * 8; // ±4px vertical
    this.opacity = Math.random() * 0.4 + 0.6; // 0.6-1.0
    this.color = `rgba(255, 200, 100, ${this.opacity})`; // Yellow/orange spark
    this.lifetime = Math.random() * 40 + 40; // 40-80 frames
    this.shadowBlur = Math.random() * 8 + 8; // 8-16 glow
    this.shadowColor = 'rgba(255, 200, 100, 0.7)';
  }
}

// New class for realistic smoke
class Smoke extends Particle {
  constructor(x, y, velocity) {
    super(x, y, velocity);
    // Slower speed and more vertical movement than dust
    this.speedX = -(velocity * (Math.random() * 30 + 30));
    this.speedY = (Math.random() - 0.7) * 5; // Slightly biased upward
    
    // Initial properties
    this.initialSize = Math.random() * 8 + 4; // Bigger than dust (4-12px)
    this.size = this.initialSize;
    this.opacity = Math.random() * 0.25 + 0.2; // Lower opacity (0.2-0.45)
    
    // Smoky gray colors with variation
    const smokeBase = Math.floor(Math.random() * 40 + 120); // 120-160 base
    this.color = `rgba(${smokeBase}, ${smokeBase}, ${smokeBase + Math.random() * 10}, ${this.opacity})`;
    
    // Different physics than other particles
    this.shrinkRate = 0.985; // Shrink more slowly
    this.drag = 0.98; // Less drag
    this.lifetime = Math.random() * 120 + 120; // 120-240 frames (longer lifetime)
    this.shadowBlur = 0; // No glow effect
    
    // Wiggle effect
    this.wiggleSpeed = Math.random() * 0.02 + 0.01;
    this.wiggleAngle = 0;
    this.wiggleRange = Math.random() * 0.5 + 0.5; // How much it wiggles
  }
  
  update() {
    // Special smoke effect - wiggles as it rises
    this.wiggleAngle += this.wiggleSpeed;
    this.speedX += Math.sin(this.wiggleAngle) * this.wiggleRange * 0.1;
    
    // Gradually slow down vertical movement
    this.speedY *= 0.98;
    
    // Call parent update
    super.update();
    
    // Smoke expands slightly before disappearing
    if (this.lifetime < 60) {
      this.shrinkRate = 0.95; // Start shrinking faster at end of life
    } else if (this.lifetime > 100) {
      this.size *= 1.001; // Expand slightly at beginning
    }
  }
  
  draw(context) {
    // For smoke, use a slightly different rendering technique
    context.save();
    context.globalAlpha = this.opacity * 0.9;
    context.beginPath();
    
    // Use a slight oval shape instead of perfect circle
    const stretch = 1 + Math.sin(this.wiggleAngle) * 0.1;
    context.ellipse(this.x, this.y, this.size * stretch, this.size / stretch, this.wiggleAngle, 0, Math.PI * 2);
    
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }
}

// Updated particle creation and management
function createDustParticles(x, y, velocity) {
  const dustCount = Math.floor(velocity * 80) + 5;
  const sparkCount = Math.floor(velocity * 20);
  const smokeCount = Math.floor(velocity * 40) + 5; // Add smoke particles
  
  const maxParticles = 200; // Maximum particles to maintain performance
  
  // Add dust particles
  for (let i = 0; i < dustCount && particles.length < maxParticles; i++) {
    particles.push(new Dust(x, y, velocity));
  }
  
  // Add spark particles
  for (let i = 0; i < sparkCount && particles.length < maxParticles; i++) {
    particles.push(new Spark(x, y, velocity));
  }
  
  // Add smoke particles - slightly offset to create a more natural effect
  for (let i = 0; i < smokeCount && particles.length < maxParticles; i++) {
    const smokeX = x + (Math.random() - 0.5) * 20;
    const smokeY = y + (Math.random() - 0.5) * 15;
    particles.push(new Smoke(smokeX, smokeY, velocity));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].markedForDeletion) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  // Draw smoke first (in background)
  particles.forEach(particle => {
    if (particle instanceof Smoke) {
      particle.draw(ctx);
    }
  });
  
  // Draw dust second (middle layer)
  particles.forEach(particle => {
    if (particle instanceof Dust) {
      particle.draw(ctx);
    }
  });
  
  // Draw sparks last (foreground)
  particles.forEach(particle => {
    if (particle instanceof Spark) {
      particle.draw(ctx);
    }
  });
}

function clearParticles() {
  particles.length = 0;
}

function drawWheel() {

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frames

  const wheelRadius = 220; // Radius for the drawn wheel (300px diameter)
  const sliceAngle = (2 * Math.PI) / tracks.length;

  // Draw Wheel Slices
  tracks.forEach((track, i) => {
    const startAngle = currentAngle + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(canvasRadius, canvasRadius);
    ctx.arc(canvasRadius, canvasRadius, wheelRadius, startAngle, endAngle);
    ctx.closePath();

    // Alternate slice colors
    if (track === "Special") {
      ctx.fillStyle = "#008000"; // Gold color for the special slice
    } else {
      ctx.fillStyle = i % 2 === 0 ? "#ff0000" : "#000000"; // Regular slice colors
    }
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add Track Names
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.translate(
      canvasRadius +
        Math.cos(startAngle + sliceAngle / 2) * (wheelRadius * 0.75),
      canvasRadius +
        Math.sin(startAngle + sliceAngle / 2) * (wheelRadius * 0.75)
    );
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "center";
    ctx.font = "20px Racing Sans One";
    ctx.fillText(track, 0, 0);
    ctx.restore();
  });
}

function determineSelection() {
  const sliceAngle = (2 * Math.PI) / tracks.length;
  const selectedIndex = Math.floor(
    ((2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI)) /
      sliceAngle
  );
  const selectedTrack = tracks[selectedIndex];

  // Apply popping effect
  showSelectedTrack(selectedTrack);

  // Check if it's the special track
  if (selectedTrack === "Special") {
    // Display the special image
    displaySpecialImage();
    // Optionally play a special sound
    playSpecialSound();
  }
}

function displaySpecialImage() {
  let special = document.getElementById("special");
  if (!special) {
    special = document.createElement("img");
    special.id = "special";
    document.body.appendChild(special);
  }

  if (!special) {
    // console.error("Special image element not found!");
    return;
  }

  special.onload = () => {
    special.style.display = "block";
    special.style.border = "5px solid red"; // Optional: border for visibility
    special.style.background = "rgba(255, 0, 0, 0.5)"; // Optional: background for visibility

    special.style.opacity = "1";
    special.style.position = "absolute";
    special.style.width = "650px";
    special.style.height = "450px";

    // Center the image relative to the canvas
    special.style.top = `${canvas.offsetTop + canvas.height / 2 - 400}px`; // Half of image height (225px)
    special.style.left = `${canvas.offsetLeft + canvas.width / 2 - 400}px`; // Half of image width (325px)

    special.style.transform = "translate(-50%, -50%)";
    special.style.zIndex = "9999";

    // Hide the image after 9 seconds
    setTimeout(() => {
      special.style.display = "none";
    }, 9000); // 9000 milliseconds = 9 seconds
  };

  special.src = "";
  setTimeout(() => {
    special.src = "special.webp";
  }, 10);

  // console.log("Displaying special image");
}

function playSpecialSound() {
  // Create an audio context for better control over the sound
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Create a gain node to control volume
  const gainNode = audioContext.createGain();

  // Load the audio file
  const audio = new Audio("fart.mp3"); // Replace with the actual sound file

  // Once the audio is loaded, we need to create a buffer source
  audio.addEventListener("canplaythrough", () => {
    // Create a buffer source node
    const sourceNode = audioContext.createMediaElementSource(audio);

    // Connect the source node to the gain node
    sourceNode.connect(gainNode);

    // Connect the gain node to the audio context's destination (speakers)
    gainNode.connect(audioContext.destination);

    // Set the gain (volume). 1 is the normal volume (default),
    // 0 is silence, and 2 is double the normal volume, etc.
    gainNode.gain.value = 2; // Set your desired volume level here (e.g., 0.5 for 50%)

    // Play the audio
    audio.play();
  });
}

// Initialize the AudioContext only once
function initializeAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!oscillator) {
    oscillator = audioContext.createOscillator();
    oscillator.type = "sine"; // Bell-like sound
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frequency in Hz (440 Hz is A4 pitch)
  }

  if (!gainNode) {
    gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
  }
}

function playF1EngineSound() {
  // Initialize the AudioContext and components if not done already
  initializeAudioContext();

  // Create the gain node for the engine sound
  const gainNodeEngine = audioContext.createGain();
  gainNodeEngine.connect(audioContext.destination);

  // Create low and high frequency oscillators
  const lowOscillator = audioContext.createOscillator();
  const highOscillator = audioContext.createOscillator();

  // Low-frequency oscillator for rumble (simulating low RPM)
  lowOscillator.type = "sawtooth";
  lowOscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Low RPM rumble sound (120 Hz)
  lowOscillator.frequency.exponentialRampToValueAtTime(
    50,
    audioContext.currentTime + 1
  ); // Gradual rise in low frequency to simulate engine acceleration

  // High-frequency oscillator for high-pitched whirring (high RPM)
  highOscillator.type = "sawtooth";
  highOscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher frequency simulating high RPM
  highOscillator.frequency.exponentialRampToValueAtTime(
    5000,
    audioContext.currentTime + 1.5
  ); // Rapid rise in frequency simulating revving

  // Create a noise source for engine "growl" (simulating exhaust noise)
  const noiseBuffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate,
    audioContext.sampleRate
  );
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.1; // White noise (random values between -0.1 and 0.1)
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true; // Loop the noise source
  noiseSource.start(0);

  // Apply a low-pass filter to reduce high-end noise for a growling engine effect
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, audioContext.currentTime); // Filter out higher frequencies to mimic engine growl
  noiseSource.connect(filter);
  filter.connect(gainNodeEngine);

  // Connect the oscillators (low and high frequencies) to the gain node
  lowOscillator.connect(gainNodeEngine);
  highOscillator.connect(gainNodeEngine);

  // Add dynamic modulation (pitch shift) to simulate revving up and down
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();

  lfo.frequency.setValueAtTime(0.5, audioContext.currentTime); // Slow frequency modulation for a slight "flutter"
  lfoGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Modulate the frequency of the low oscillator

  lfo.connect(lfoGain);
  lfoGain.connect(lowOscillator.frequency);

  // Start all components
  lowOscillator.start();
  highOscillator.start();
  lfo.start();

  // Fade in sound to simulate engine startup
  gainNodeEngine.gain.setValueAtTime(0, audioContext.currentTime);
  gainNodeEngine.gain.linearRampToValueAtTime(
    0.2,
    audioContext.currentTime + 1
  ); // Gradually increase the gain to full volume

  // Stop all oscillators and noise after a certain time to simulate engine cut-off
  setTimeout(() => {
    lowOscillator.stop();
    highOscillator.stop();
    noiseSource.stop();
    lfo.stop();
    gainNodeEngine.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + 0.01
    ); // Fade out over 1 second
  }, 242); // Stop the engine after 5 seconds (adjust duration as needed)
}

function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const spinDuration = Math.random() * 3 + 4;
  const initialVelocity = Math.random() * 0.2 + 0.3;
  let currentVelocity = initialVelocity;
  const deceleration = initialVelocity / (spinDuration * 60);

  clearParticles();

  function animate() {
    if (currentVelocity > 0) {
      currentAngle += currentVelocity;
      currentVelocity -= deceleration * 0.85;

      if (currentAngle > 2 * Math.PI) {
        currentAngle -= 2 * Math.PI;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const minAlpha = 0.5;
      const maxAlpha = 1;
      const normalizedVelocity = Math.min(currentVelocity / initialVelocity, 1);
      const globalAlpha =
        minAlpha + (maxAlpha - minAlpha) * (1 - normalizedVelocity);
      ctx.globalAlpha = globalAlpha;
      ctx.globalCompositeOperation = "lighter";
      // ctx.globalCompositeOperation = "lighter";

      drawWheel(currentAngle - currentVelocity * 0.5);

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // Apply the same alpha to the wheelOverlay image
      
      wheelOverlay.style.opacity = globalAlpha *1.8;

      // Now draw particles with improved layering
      drawParticles();
      wheelOverlay.style.transform = `translate(-50%, -50%) rotate(${currentAngle}rad)`;

      // Bottom center, moved down
      const particleX = canvasRadius - 90; // 400
      const particleY = canvasRadius + 150 + 185; // 575
      createDustParticles(particleX, particleY, currentVelocity);

      updateParticles();

      const sliceAngle = (2 * Math.PI) / tracks.length;
      const currentSlice = Math.floor(currentAngle / sliceAngle);
      if (currentSlice !== lastSlice) {
        playF1EngineSound();
        lastSlice = currentSlice;
      }

      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      // Reset wheelOverlay opacity when spinning stops
      wheelOverlay.style.opacity = 1;
      clearParticles();
      drawWheel();
      determineSelection();
    }
  }

  animate();
}

function showSelectedTrack(trackName) {
  const trackElement = document.getElementById("selected-track");
  trackElement.textContent = `Selected Track: ${trackName}`;
  trackElement.classList.add("show");

  setTimeout(() => {
    trackElement.classList.remove("show");
  }, 9000);
}

// Initial setup
function init() {
  drawWheel();
  wheelOverlay.style.transform = `translate(-50%, -50%) rotate(0rad)`;
}

spinButton.addEventListener("click", spinWheel);
init();
