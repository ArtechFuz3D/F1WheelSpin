  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");
  const spinButton = document.getElementById("spin-button");
  const selectedTrackDisplay = document.getElementById("selected-track");


  // F1 Track Names
  const tracks = [
    "Bahrain",
    "Jeddah",
    "Australia",
    "Shanghai",
    "Miami",
    "Imola",
    "Canada",
    "RBRing",
    "Monaco",
    "Silverstone",
    "Monza",
    "Spa",
    "Suzuka",
    "Interlagos",
    "Imola",
    "Austin",
    "Abu Dhabi",
    "Barcelona",
    "Hungary",
    "Zandvoort",
    "Baku",
    "Singapore",
    "USA",
    "Mexico",
    "LA",
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
        this.size = Math.random() * 5 + 10; // Larger particles now (between 30 and 35)
        this.speedX = Math.random() * 2 + 1;  // Increased speed for faster movement
        this.speedY = Math.random() * 2 + 1;  // Increased speed for faster movement
        this.color = "rgba(27, 18, 16, 0.04)";
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
      for (let i = 0; i < 25; i++) {
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
      ((2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI)) / sliceAngle
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
        special.style.border = "5px solid red";  // Optional: border for visibility
        special.style.background = "rgba(255, 0, 0, 0.5)";  // Optional: background for visibility

        special.style.opacity = "1";
        special.style.position = "absolute";
        special.style.width = "650px";
        special.style.height = "450px";
        
        // Center the image relative to the canvas
        special.style.top = `${canvas.offsetTop + canvas.height / 2 - 400}px`;  // Half of image height (225px)
        special.style.left = `${canvas.offsetLeft + canvas.width / 2 - 400}px`;  // Half of image width (325px)
        
        special.style.transform = "translate(-50%, -50%)";
        special.style.zIndex = "9999";

        // Hide the image after 9 seconds
        setTimeout(() => {
            special.style.display = "none";
        }, 9000);  // 9000 milliseconds = 9 seconds
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
  audio.addEventListener('canplaythrough', () => {
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
      oscillator.type = 'sine'; // Bell-like sound
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
    lowOscillator.type = 'sawtooth';
    lowOscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Low RPM rumble sound (120 Hz)
    lowOscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1); // Gradual rise in low frequency to simulate engine acceleration

    // High-frequency oscillator for high-pitched whirring (high RPM)
    highOscillator.type = 'sawtooth';
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
    }, 230); // Stop the engine after 5 seconds (adjust duration as needed)
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
        currentVelocity -= deceleration * 0.85;
    
        // Normalize angle to stay within 0-2π radians
        if (currentAngle > 2 * Math.PI) {
          currentAngle -= 2 * Math.PI; // Keep it within a single rotation range
        }
    
        // Redraw the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
    
        // Draw the particles first (behind the wheel)

        
        // Draw the wheel after the particles
        drawWheel();
        wheelOverlay.style.transform = `translate(-50%, -50%) rotate(${currentAngle}rad)`;
        drawParticles();
        // Create and update particles while spinning
        createDustParticles(canvasRadius - wheelOverlaySize / 2 + 120, canvasRadius + wheelOverlaySize / 2 - 80);
        updateParticles();
    
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
    }, 9000);
  }

  // Initial setup
  function init() {
    drawWheel();
    wheelOverlay.style.transform = `translate(-50%, -50%) rotate(0rad)`;
  }

  spinButton.addEventListener("click", spinWheel);
  init();
