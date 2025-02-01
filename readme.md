```js
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spin-button");
const selectedTrackDisplay = document.getElementById("selected-track");


// F1 Track Names
const tracks = [
  // "Bahrain",
  // "Jeddah",
  // "Australia",
  // "Shanghai",
  // "Miami",
  // "Imola",
  // "Canada",
  // "RBRing",
  // "Monaco",
  // "Silverstone",
  // "Monza",
  // "Spa",
  // "Suzuka",
  // "Interlagos",
  // "Imola",
  // "Austin",
  // "Abu Dhabi",
  // "Barcelona",
  // "Hungary",
  // "Zandvoort",
  // "Baku",
  // "Singapore",
  // "USA",
  // "Mexico",
  // "LA",
  "Losail",
  // Special
  "Special",
];
// Set Canvas Dimensions (800px for the entire canvas)
const canvasSize = 800;
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
const wheelOverlaySize = 600;
const wheelOverlay = document.createElement("img");
wheelOverlay.src = "wheel.webp"; // Replace with the correct path
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

// Particle Classes
// Particle Classes
class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.size = Math.random() * 40 + 5; // Smaller particles for smaller wheel
      this.speedX = Math.random();
      this.speedY = Math.random();
      this.color = "rgba(255, 255, 255, 0.4)";
      this.markedForDeletion = false;
    }
  
    update() {
      this.x -= this.speedX;
      this.y -= this.speedY;
      this.size *= 0.93; // Shrinking effect
      if (this.size < 0.5) this.markedForDeletion = true;
    }
  
    draw(context) {
      context.beginPath();
      context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      context.fillStyle = this.color;
      context.fill();
    }
  }
  
  class Dust extends Particle {}
  
  // Particle Management
  const particles = [];
  
  function createDustParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      particles.push(new Dust(null, x, y));
    }
  }
  
  function updateParticles() {
    particles.forEach((particle, index) => {
      particle.update();
      if (particle.markedForDeletion) {
        particles.splice(index, 1);
      }
    });
  }
  
  function drawParticles() {
    particles.forEach((particle) => {
      particle.draw(ctx);
    });
  }
  

function clearParticles() {
  particles.length = 0;
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frames
  
  const wheelRadius = 150; // Radius for the drawn wheel (300px diameter)
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
      ctx.fillStyle = "#FFD700"; // Gold color for the special slice
    } else {
      ctx.fillStyle = i % 2 === 0 ? "#ff4500" : "#008000"; // Regular slice colors
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
    ctx.font = "10px Arial";
    ctx.fillText(track, 0, 0);
    ctx.restore();
  });
}



function displaySpecialImage() {
  const special = document.getElementById("special");

  if (!special) {
    console.error("Special image element not found!");
    return;
  }

  special.style.display = "block";  // Correct the display property
  special.style.opacity = "1";  // Ensure it's fully visible
  special.style.position = "absolute";
  special.style.width = "850px";
  special.style.height = "850px";
  special.style.top = `${canvas.offsetTop + canvasRadius - 75}px`; 
  special.style.left = `${canvas.offsetLeft + canvasRadius - 75}px`;
  special.style.transform = "translate(-50%, -50%)";
  special.style.zIndex = "999";

  console.log("Displaying special image");

  // // Hide it after 3 seconds
  // setTimeout(() => {
  //   special.style.display = "none";
  //   console.log("Hiding special image");
  // }, 3000);
}



function playSpecialSound() {
  // Play a unique sound for the special track if needed
  // Example: Play a fun sound or a unique F1 rev sound
  const audio = new Audio("fart.mp3"); // Replace with the actual sound file
  audio.play();
}

function showSelectedTrack(trackName) {
  const trackElement = document.getElementById("selected-track");
  trackElement.textContent = `Selected Track: ${trackName}`;
  trackElement.classList.add("show");

  setTimeout(() => {
    trackElement.classList.remove("show");
  }, 15000);
}

// Initialize the AudioContext only once
function initializeAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!oscillator) {
    oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Bell-like sound
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frequency in Hz (440 Hz is A4 pitch)
  }

  if (!gainNode) {
    gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
  }
}

// function playBellTone() {
//   // Initialize the AudioContext and components if not done already
//   initializeAudioContext();

//   // Create a new oscillator for the bell sound (every time it's called)
//   oscillator = audioContext.createOscillator();
//   oscillator.type = 'sine'; // Bell-like tone
//   oscillator.frequency.setValueAtTime(240, audioContext.currentTime); // Frequency for bell tone (440Hz = A4)

//   // Connect oscillator to gain node
//   oscillator.connect(gainNode);

//   // Start the oscillator
//   oscillator.start(audioContext.currentTime);

//   // Fade out the sound by changing the gain value
//   gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
//   gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03); // Fade out over 0.1 seconds

//   // Stop the oscillator after 0.1 seconds
//   oscillator.stop(audioContext.currentTime + 0.1);
// }


function playTireScreech() {
  // Initialize the AudioContext and components if not done already
  initializeAudioContext();

  // Create the gain node and its properties
  const gainNodeScreech = audioContext.createGain();
  gainNodeScreech.connect(audioContext.destination);

  // Create oscillators for the screeching sound
  const oscillator1 = audioContext.createOscillator(); // Low-frequency oscillator
  const oscillator2 = audioContext.createOscillator(); // High-frequency oscillator
  const oscillator3 = audioContext.createOscillator(); // Add more complexity with a third oscillator

  // Set frequencies (these frequencies will shift over time to mimic the tire screech)
  oscillator1.frequency.setValueAtTime(200, audioContext.currentTime); // Low frequency, for the base sound
  oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime); // High frequency, for the sharp screech
  oscillator3.frequency.setValueAtTime(1500, audioContext.currentTime); // Another layer of sharp sound

  // Apply a bit of detuning to each oscillator to make the sound more complex
  oscillator1.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1); // Gradual rise in low frequency
  oscillator2.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1); // Gradual rise in high frequency
  oscillator3.frequency.exponentialRampToValueAtTime(1700, audioContext.currentTime + 0.1); // Gradual rise in 3rd oscillator

  // Add a slight vibrato (pitch modulation) to each oscillator
  const lfo1 = audioContext.createOscillator();
  const lfo2 = audioContext.createOscillator();
  const lfo3 = audioContext.createOscillator();
  
  lfo1.frequency.setValueAtTime(4, audioContext.currentTime); // Low-frequency oscillator for pitch modulation
  lfo2.frequency.setValueAtTime(8, audioContext.currentTime); // Slightly faster for added variation
  lfo3.frequency.setValueAtTime(6, audioContext.currentTime); // A different vibrato speed

  const lfoGain1 = audioContext.createGain();
  const lfoGain2 = audioContext.createGain();
  const lfoGain3 = audioContext.createGain();

  // Modulate pitch by slightly altering frequency
  lfoGain1.gain.setValueAtTime(180, audioContext.currentTime); // LFO gain for modulation depth
  lfoGain2.gain.setValueAtTime(60, audioContext.currentTime);
  lfoGain3.gain.setValueAtTime(50, audioContext.currentTime);

  // Connect LFOs to oscillators for pitch modulation
  lfo1.connect(lfoGain1);
  lfo2.connect(lfoGain2);
  lfo3.connect(lfoGain3);

  lfoGain1.connect(oscillator1.frequency);
  lfoGain2.connect(oscillator2.frequency);
  lfoGain3.connect(oscillator3.frequency);

  // Start LFOs
  lfo1.start();
  lfo2.start();
  lfo3.start();

  // Connect oscillators to the gain node
  oscillator1.connect(gainNodeScreech);
  oscillator2.connect(gainNodeScreech);
  oscillator3.connect(gainNodeScreech);

  // Start oscillators
  oscillator1.start();
  oscillator2.start();
  oscillator3.start();

  // Fade out the sound (exponentially) for a sharp end
  gainNodeScreech.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNodeScreech.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); // Fade out slowly over 0.5 seconds

  // Stop oscillators after 0.5 seconds
  oscillator1.stop(audioContext.currentTime + 0.5);
  oscillator2.stop(audioContext.currentTime + 0.5);
  oscillator3.stop(audioContext.currentTime + 0.5);

  // Stop the LFOs (pitch modulation) after sound ends
  lfo1.stop(audioContext.currentTime + 0.5);
  lfo2.stop(audioContext.currentTime + 0.5);
  lfo3.stop(audioContext.currentTime + 0.5);
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
  lowOscillator.type = 'sine';
  lowOscillator.frequency.setValueAtTime(120, audioContext.currentTime); // Low RPM rumble sound (120 Hz)
  lowOscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 1); // Gradual rise in low frequency to simulate engine acceleration

  // High-frequency oscillator for high-pitched whirring (high RPM)
  highOscillator.type = 'sine';
  highOscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher frequency simulating high RPM
  highOscillator.frequency.exponentialRampToValueAtTime(5000, audioContext.currentTime + 1.5); // Rapid rise in frequency simulating revving

  // Create a noise source for engine "growl" (simulating exhaust noise)
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
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
  filter.type = 'lowpass';
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
  gainNodeEngine.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 1); // Gradually increase the gain to full volume

  // Stop all oscillators and noise after a certain time to simulate engine cut-off
  setTimeout(() => {
    lowOscillator.stop();
    highOscillator.stop();
    noiseSource.stop();
    lfo.stop();
    gainNodeEngine.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1); // Fade out over 1 second
  }, 200); // Stop the engine after 5 seconds (adjust duration as needed)
}


function determineSelection() {
  const sliceAngle = (2 * Math.PI) / tracks.length;
  const selectedIndex = Math.floor(
    ((2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI)) / sliceAngle
  );
  const selectedTrack = tracks[selectedIndex];

  // Apply popping effect
  showSelectedTrack(selectedTrack);

  // Check if it's the special track
  if (selectedTrack = "Special") {
    // Display the special image
    displaySpecialImage();
    // Optionally play a special sound
    playSpecialSound();
  }
}

// Spin Wheel
function spinWheel() {
  if (isSpinning) return; // Prevent multiple spins
  isSpinning = true;

  const spinDuration = Math.random() * 3 + 4; // Spin duration between 4 and 7 seconds
  const initialVelocity = Math.random() * 0.2 + 0.3; // Initial angular velocity
  let currentVelocity = initialVelocity;
  const deceleration = initialVelocity / (spinDuration * 60);

  // Clear particles before starting the spin
  clearParticles();

  let lastSlice = -1; // Track the last slice we were on

  function animate() {
    if (currentVelocity > 0) {
      currentAngle += currentVelocity;
      currentVelocity -= deceleration * 4.35;

      // Normalize angle to stay within 0-2π radians
      if (currentAngle > 2 * Math.PI) {
        currentAngle -= 2 * Math.PI; // Keep it within a single rotation range
      }

      // Redraw the wheel
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawWheel();
      wheelOverlay.style.transform = `translate(-50%, -50%) rotate(${currentAngle}rad)`;

      // Create and update particles while spinning
      createDustParticles(canvasRadius - wheelOverlaySize / 2 + 120, canvasRadius + wheelOverlaySize / 2 - 80);
      updateParticles();
      drawParticles();

      // Determine the slice angle
      const sliceAngle = (2 * Math.PI) / tracks.length;

      // Check if the angle crosses a slice boundary
      const currentSlice = Math.floor(currentAngle / sliceAngle);

      // Check if we've crossed into a new slice
      if (currentSlice !== lastSlice) {
        // Play the bell sound at each slice boundary
        // playTireScreech();
        playF1EngineSound()
        lastSlice = currentSlice; // Update the last slice to the current one
      }

      // Continue animation
      requestAnimationFrame(animate);
    } else {
      // Stop spinning
      isSpinning = false;

      // Clear canvas and particles after spin ends
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      clearParticles();

      // Redraw the wheel without particles
      drawWheel();

      // Determine the selected track
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
  }, 15000);
}

// Initial setup
function init() {
  drawWheel();
  wheelOverlay.style.transform = `translate(-50%, -50%) rotate(0rad)`;
}

spinButton.addEventListener("click", spinWheel);
init();
```