// Configuration - Update these with your actual values
const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://itvycuswkaectlhutffr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dnljdXN3a2FlY3RsaHV0ZmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjMyODUsImV4cCI6MjA2OTAzOTI4NX0.G50YVGycXU43BGGH75bvQWSArruzpnUIOrxvP2amxDY',
  
  // Vote limits
  MAX_VOTES_PER_CATEGORY: 3
};

// Global state
let supabase;
let currentUser = null;
let userIPAddress = null;
let weaponVotes = [];
let sprayVotes = [];
let submissionsData = {
  weapons: [],
  sprays: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Arena Breakout Voting App...');
  
  try {
    // Initialize Supabase
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    // Get user's IP address
    await getUserIPAddress();
    
    // Check for existing login session
    await checkExistingSession();
    
    // Initialize particles
    createParticles();
    
    // Load submissions data
    await loadSubmissions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Hide loading screen
    hideLoadingScreen();
    
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
    showError('Failed to initialize the voting system. Please refresh the page.');
    hideLoadingScreen();
  }
});

// Get user's IP address
async function getUserIPAddress() {
  try {
    console.log('🌐 Getting user IP address...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    userIPAddress = data.ip;
    console.log('✅ User IP:', userIPAddress);
  } catch (error) {
    console.error('❌ Error getting IP address:', error);
    userIPAddress = 'unknown';
  }
}

// Check for existing login session
async function checkExistingSession() {
  try {
    const savedUser = localStorage.getItem('arenaVotingUser');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      console.log('🔄 Restored user session:', currentUser.name);
      
      // Update UI
      updateAuthUI();
      
      // Check if user has already voted
      const hasAlreadyVoted = await checkExistingVotes();
      
      if (!hasAlreadyVoted) {
        // Show voting interface if user hasn't voted
        showVotingInterface();
      }
    }
  } catch (error) {
    console.error('❌ Error checking existing session:', error);
    // Clear corrupted session data
    localStorage.removeItem('arenaVotingUser');
  }
}

// Particle effects (similar to original site)
function createParticles() {
  console.log('🔥 Creating tactical particles...');
  
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  // Create fire sparks
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('div');
    spark.classList.add('fire-spark');
    const posX = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 4;
    
    spark.style.left = posX + '%';
    spark.style.bottom = '0px';
    
    const sparkKeyframe = `floatSpark-${i}`;
    const sparkStyle = document.createElement('style');
    sparkStyle.innerHTML = `@keyframes ${sparkKeyframe} { 
      0% { transform: translateY(0px) translateX(0px); opacity: 1; } 
      25% { transform: translateY(-25vh) translateX(${Math.random() * 20 - 10}px); opacity: 0.8; } 
      50% { transform: translateY(-50vh) translateX(${Math.random() * 30 - 15}px); opacity: 0.6; } 
      75% { transform: translateY(-75vh) translateX(${Math.random() * 25 - 12}px); opacity: 0.3; } 
      100% { transform: translateY(-100vh) translateX(${Math.random() * 20 - 10}px); opacity: 0; } 
    }`;
    document.head.appendChild(sparkStyle);
    
    spark.style.animation = `${sparkKeyframe} ${duration}s ease-out ${delay}s infinite`;
    particlesContainer.appendChild(spark);
  }
  
  // Create embers
  for (let i = 0; i < 4; i++) {
    const ember = document.createElement('div');
    ember.classList.add('fire-ember');
    const posX = Math.random() * 100;
    const duration = Math.random() * 10 + 8;
    const delay = Math.random() * 5;
    
    ember.style.left = posX + '%';
    ember.style.bottom = '0px';
    
    const emberKeyframe = `floatEmber-${i}`;
    const emberStyle = document.createElement('style');
    emberStyle.innerHTML = `@keyframes ${emberKeyframe} { 
      0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 1; } 
      30% { transform: translateY(-30vh) translateX(${Math.random() * 15 - 7}px) rotate(${Math.random() * 45}deg); opacity: 0.8; } 
      60% { transform: translateY(-60vh) translateX(${Math.random() * 25 - 12}px) rotate(${Math.random() * 90}deg); opacity: 0.5; } 
      100% { transform: translateY(-100vh) translateX(${Math.random() * 20 - 10}px) rotate(${Math.random() * 180}deg); opacity: 0; } 
    }`;
    document.head.appendChild(emberStyle);
    
    ember.style.animation = `${emberKeyframe} ${duration}s ease-out ${delay}s infinite`;
    particlesContainer.appendChild(ember);
  }
}

// Load submission data
async function loadSubmissions() {
  console.log('📊 Loading submissions data...');
  
  try {
    // Load weapon submissions
    const { data: weapons, error: weaponsError } = await supabase
      .from('weapon_submissions')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (weaponsError) throw weaponsError;
    
    // Load spray submissions
    const { data: sprays, error: spraysError } = await supabase
      .from('spray_submissions')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (spraysError) throw spraysError;
    
    submissionsData.weapons = weapons || [];
    submissionsData.sprays = sprays || [];
    
    console.log(`✅ Loaded ${weapons?.length || 0} weapons and ${sprays?.length || 0} sprays`);
    
    // Render submissions
    renderWeaponSubmissions();
    renderSpraySubmissions();
    
  } catch (error) {
    console.error('❌ Error loading submissions:', error);
    
    // Fallback to demo data if database fails
    console.log('🔄 Using demo data...');
    loadDemoData();
  }
}

// Demo data fallback
function loadDemoData() {
  // Generate demo weapon submissions
  submissionsData.weapons = Array.from({ length: 12 }, (_, i) => ({
    id: `weapon_${i + 1}`,
    title: `Weapon Design ${i + 1}`,
    author: `Artist ${i + 1}`,
    image_url: `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Weapon+${i + 1}`,
    created_at: new Date().toISOString()
  }));
  
  // Generate demo spray submissions
  submissionsData.sprays = Array.from({ length: 15 }, (_, i) => ({
    id: `spray_${i + 1}`,
    title: `Spray Design ${i + 1}`,
    author: `Artist ${i + 1}`,
    image_url: `https://via.placeholder.com/300x200/DC143C/FFFFFF?text=Spray+${i + 1}`,
    created_at: new Date().toISOString()
  }));
  
  renderWeaponSubmissions();
  renderSpraySubmissions();
  
  console.log('✅ Demo data loaded');
}

// Handle name input login
function handleNameLogin() {
  const nameInput = document.getElementById('nameInput');
  const userName = nameInput.value.trim();
  
  if (!userName) {
    showError('Please enter your name to continue.');
    return;
  }
  
  if (userName.length < 2) {
    showError('Please enter a valid name (at least 2 characters).');
    return;
  }
  
  console.log('👤 User entered name:', userName);
  
  // Create user object (similar to Google login but with name)
  currentUser = {
    name: userName,
    email: userName // Keep email as name for database consistency
  };
  
  // Save user session to localStorage
  localStorage.setItem('arenaVotingUser', JSON.stringify(currentUser));
  
  // Update auth UI
  updateAuthUI();
  
  // Check if user has already voted
  checkExistingVotes().then(hasAlreadyVoted => {
    if (hasAlreadyVoted) {
      console.log('🚫 Voting blocked - user already voted');
    } else {
      console.log('🎯 Showing voting interface - user can vote');
      showVotingInterface();
    }
  });
}

// Check if user has already voted (by name only - IP check removed)
async function checkExistingVotes() {
  try {
    console.log('🔍 Checking if user has already voted...');
    
    // Check by name only (using email field for consistency)
    const { data: nameVotes, error: nameError } = await supabase
      .from('votes')
      .select('*')
      .eq('user_email', currentUser.name);
    
    if (nameError) {
      console.error('❌ Error checking name votes:', nameError);
      throw nameError;
    }
    
    console.log(`📊 Found ${nameVotes?.length || 0} votes for name ${currentUser.name}`);
    
    if (nameVotes && nameVotes.length > 0) {
      console.log('⚠️ User has already voted - showing already voted message');
      showAlreadyVotedMessage('name');
      return true; // Return true if already voted
    }
    
    console.log('✅ User has not voted yet - can proceed to voting');
    return false; // Return false if not voted yet
  } catch (error) {
    console.error('❌ Error checking existing votes:', error);
    showError('Unable to verify voting status. Please refresh and try again.');
    return true; // BLOCK voting if we can't check (security first!)
  }
}

// Show already voted message
function showAlreadyVotedMessage(blockReason = 'name') {
  console.log('🚫 Showing already voted message');
  
  // FORCE HIDE all voting sections
  document.getElementById('weaponsSection').style.display = 'none';
  document.getElementById('spraysSection').style.display = 'none';
  document.getElementById('successSection').style.display = 'none';
  
  // FORCE SHOW login section with already voted message
  const loginSection = document.getElementById('loginSection');
  loginSection.style.display = 'block';
  
  loginSection.innerHTML = `
    <div class="hero-content">
      <h1>🗳️ Already Voted!</h1>
      <p>Thank you <strong>${currentUser?.name || 'participant'}</strong>! You have already participated in this voting event.</p>
      <div class="login-card already-voted-card">
        <h3 class="centered-text">✅ Your votes are recorded</h3>
        <p class="centered-text" style="font-size: 1.1rem; color: var(--tactical-orange); font-weight: bold; margin-bottom: 15px;">
          You have already voted using this name.
        </p>
        <p class="centered-text" style="font-size: 1.2rem; color: var(--hud-green); font-weight: bold; margin-bottom: 15px;">
          Please share this site link with your friends to encourage them to vote too!
        </p>
        <p class="centered-text" style="margin-bottom: 20px;">
          Results will be announced on our Discord server. Thank you for being part of our Arena Breakout community!
        </p>
        <div class="discord-button-container">
          <a href="https://discord.gg/arenabreakout" target="_blank" rel="noopener noreferrer">
            <button class="discord-button">Join Discord Server</button>
          </a>
        </div>
      </div>
    </div>
  `;
  
  // Scroll to top to make sure user sees the message
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update authentication UI
function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const userInfo = document.getElementById('userInfo');
  const userEmail = document.getElementById('userEmail');
  
  if (currentUser) {
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userEmail.textContent = currentUser.name; // Show name instead of email
  } else {
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

// Show voting interface
function showVotingInterface() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('weaponsSection').style.display = 'block';
  
  // Scroll to weapons section
  document.getElementById('weaponsSection').scrollIntoView({ behavior: 'smooth' });
}

// Render weapon submissions
function renderWeaponSubmissions() {
  const grid = document.getElementById('weaponsGrid');
  if (!grid) return;
  
  grid.innerHTML = submissionsData.weapons.map(submission => `
    <div class="submission-card" data-id="${submission.id}" data-category="weapons">
      <div class="submission-image" style="background-image: url('${submission.image_url}')"></div>
      <div class="submission-info">
        <div class="submission-title">${submission.title}</div>
        <div class="submission-author">by ${submission.author}</div>
        <div class="submission-id">ID: ${submission.id}</div>
        <button class="view-button" onclick="showImageOverlay('${submission.image_url}', '${submission.title}', '${submission.author}', event)">
          <span style="color: black; font-weight: bold;">View</span>
        </button>
      </div>
    </div>
  `).join('');
  
  // Add click listeners
  grid.querySelectorAll('.submission-card').forEach(card => {
    card.addEventListener('click', (event) => {
      // Don't trigger card selection if clicking the view button
      if (!event.target.closest('.view-button')) {
        handleSubmissionClick(card);
      }
    });
  });
}

// Render spray submissions
function renderSpraySubmissions() {
  const grid = document.getElementById('spraysGrid');
  if (!grid) return;
  
  grid.innerHTML = submissionsData.sprays.map(submission => `
    <div class="submission-card spray-card" data-id="${submission.id}" data-category="sprays">
      <div class="submission-image" style="background-image: url('${submission.image_url}')"></div>
      <div class="submission-info">
        <div class="submission-title">${submission.title}</div>
        <div class="submission-author">by ${submission.author}</div>
        <div class="submission-id">ID: ${submission.id}</div>
        <button class="view-button" onclick="showImageOverlay('${submission.image_url}', '${submission.title}', '${submission.author}', event)">
          <span style="color: black; font-weight: bold;">View</span>
        </button>
      </div>
    </div>
  `).join('');
  
  // Add click listeners
  grid.querySelectorAll('.submission-card').forEach(card => {
    card.addEventListener('click', (event) => {
      // Don't trigger card selection if clicking the view button
      if (!event.target.closest('.view-button')) {
        handleSubmissionClick(card);
      }
    });
  });
}

// Handle submission card click
function handleSubmissionClick(card) {
  const submissionId = card.dataset.id;
  const category = card.dataset.category;
  const isSelected = card.classList.contains('selected');
  
  if (isSelected) {
    // Remove vote
    card.classList.remove('selected');
    if (category === 'weapons') {
      weaponVotes = weaponVotes.filter(id => id !== submissionId);
    } else {
      sprayVotes = sprayVotes.filter(id => id !== submissionId);
    }
  } else {
    // Add vote if under limit
    const currentVotes = category === 'weapons' ? weaponVotes : sprayVotes;
    if (currentVotes.length >= CONFIG.MAX_VOTES_PER_CATEGORY) {
      showError(`You can only vote for ${CONFIG.MAX_VOTES_PER_CATEGORY} submissions per category.`);
      return;
    }
    
    card.classList.add('selected');
    if (category === 'weapons') {
      weaponVotes.push(submissionId);
    } else {
      sprayVotes.push(submissionId);
    }
  }
  
  updateVoteCounters();
  updateNavigationButtons();
  
  // Add haptic feedback on mobile
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

// Update vote counters
function updateVoteCounters() {
  const weaponCounter = document.getElementById('weaponVoteCount');
  const sprayCounter = document.getElementById('sprayVoteCount');
  
  if (weaponCounter) weaponCounter.textContent = weaponVotes.length;
  if (sprayCounter) sprayCounter.textContent = sprayVotes.length;
}

// Update navigation buttons
function updateNavigationButtons() {
  const nextToSprays = document.getElementById('nextToSprays');
  const submitVotes = document.getElementById('submitVotes');
  
  // Enable next button if at least one weapon vote
  if (nextToSprays) {
    nextToSprays.disabled = weaponVotes.length === 0;
  }
  
  // Enable submit button if votes in both categories
  if (submitVotes) {
    submitVotes.disabled = weaponVotes.length === 0 || sprayVotes.length === 0;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Name login button
  document.getElementById('nameLoginBtn')?.addEventListener('click', handleNameLogin);
  
  // Enter key for name input
  document.getElementById('nameInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleNameLogin();
    }
  });
  
  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  
  // Navigation buttons
  document.getElementById('nextToSprays')?.addEventListener('click', () => {
    document.getElementById('weaponsSection').style.display = 'none';
    document.getElementById('spraysSection').style.display = 'block';
    document.getElementById('spraysSection').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('backToWeapons')?.addEventListener('click', () => {
    document.getElementById('spraysSection').style.display = 'none';
    document.getElementById('weaponsSection').style.display = 'block';
    document.getElementById('weaponsSection').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('submitVotes')?.addEventListener('click', handleSubmitVotes);
  
  // Modal close
  document.querySelector('.close')?.addEventListener('click', closeModal);
  document.getElementById('errorOk')?.addEventListener('click', closeModal);
  
  // Close modal on outside click
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('errorModal');
    if (event.target === modal) {
      closeModal();
    }
    
    // Close image overlay when clicking outside
    const imageOverlay = document.getElementById('imageOverlay');
    if (event.target === imageOverlay) {
      closeImageOverlay();
    }
  });
  
  // Close overlay with Escape key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeImageOverlay();
    }
  });
}

// Handle logout
function handleLogout() {
  currentUser = null;
  weaponVotes = [];
  sprayVotes = [];
  
  // Clear saved session
  localStorage.removeItem('arenaVotingUser');
  
  updateAuthUI();
  updateVoteCounters();
  updateNavigationButtons();
  
  // Reset UI - clear all selections
  document.querySelectorAll('.submission-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Show login section and hide all others
  document.getElementById('weaponsSection').style.display = 'none';
  document.getElementById('spraysSection').style.display = 'none';
  document.getElementById('successSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'block';
  
  // Reset login section to original content
  const loginSection = document.getElementById('loginSection');
  loginSection.innerHTML = `
    <div class="hero-content">
      <h1>Community Voting Event</h1>
      <p>Vote for your favorite weapon designs and spray artwork submissions from our talented community!</p>
      <div class="login-card">
        <h3>🗳️ Ready to Vote?</h3>
        <p>Enter your name to participate in the community voting event</p>
        <div class="name-input-container">
          <input type="text" id="nameInput" placeholder="Enter your name" maxlength="50" />
          <button id="nameLoginBtn" class="name-login-btn">Continue</button>
        </div>
        <div class="voting-info">
          <div class="info-item">
            <span class="icon">🎨</span>
            <span>Vote for up to 3 submissions per category</span>
          </div>
          <div class="info-item">
            <span class="icon">⚔️</span>
            <span>Two categories: Weapon Designs & Spray Artwork</span>
          </div>
          <div class="info-item">
            <span class="icon">🏆</span>
            <span>Help choose the community favorites!</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Re-attach the event listeners for the new inputs
  setupEventListeners();
  
  console.log('👋 User logged out');
}

// Handle vote submission
async function handleSubmitVotes() {
  if (!currentUser) {
    showError('Please enter your name to submit votes.');
    return;
  }
  
  if (weaponVotes.length === 0 || sprayVotes.length === 0) {
    showError('Please vote in both categories before submitting.');
    return;
  }
  
  console.log('📊 Submitting votes...');
  
  try {
    // DOUBLE-CHECK: Make sure user hasn't already voted by name only
    const { data: nameCheck, error: nameError } = await supabase
      .from('votes')
      .select('user_email')
      .eq('user_email', currentUser.name);
    
    if (nameError) throw nameError;
    
    if (nameCheck && nameCheck.length > 0) {
      console.log('🚨 Duplicate vote attempt blocked!');
      showAlreadyVotedMessage('name');
      return;
    }
    
    // Prepare vote data with name (still save IP but don't check it)
    const voteData = {
      user_email: currentUser.name, // Store name in email field
      user_name: currentUser.name,
      ip_address: userIPAddress, // Still save IP for analytics
      weapon_votes: weaponVotes,
      spray_votes: sprayVotes,
      submitted_at: new Date().toISOString()
    };
    
    console.log('📊 Vote data prepared:', { ...voteData });
    
    // Submit to Supabase
    const { error } = await supabase
      .from('votes')
      .insert([voteData]);
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('🚨 Database blocked duplicate vote!');
        showAlreadyVotedMessage('name');
        return;
      }
      throw error;
    }
    
    console.log('✅ Votes submitted successfully with name:', currentUser.name);
    
    // Show success section
    showSuccessSection();
    
  } catch (error) {
    console.error('❌ Error submitting votes:', error);
    
    // Check if it's a duplicate vote error
    if (error.code === '23505') {
      console.log('🚨 Caught duplicate vote error!');
      showAlreadyVotedMessage('name');
    } else {
      showError('Failed to submit votes. Please try again.');
    }
  }
}

// Show success section
function showSuccessSection() {
  // Hide voting sections
  document.getElementById('weaponsSection').style.display = 'none';
  document.getElementById('spraysSection').style.display = 'none';
  
  // Show success section
  document.getElementById('successSection').style.display = 'block';
  
  // Generate vote summary
  const weaponTitles = weaponVotes.map(id => {
    const submission = submissionsData.weapons.find(w => w.id === id);
    return submission ? submission.title : id;
  });
  
  const sprayTitles = sprayVotes.map(id => {
    const submission = submissionsData.sprays.find(s => s.id === id);
    return submission ? submission.title : id;
  });
  
  const summary = document.getElementById('votesSummary');
  summary.innerHTML = `
    <h4>🗳️ Your Votes Summary</h4>
    <div class="vote-category">
      <h5>⚔️ Weapon Designs (${weaponVotes.length} votes):</h5>
      <ul>
        ${weaponTitles.map(title => `<li>• ${title}</li>`).join('')}
      </ul>
    </div>
    <div class="vote-category">
      <h5>🎨 Spray Artwork (${sprayVotes.length} votes):</h5>
      <ul>
        ${sprayTitles.map(title => `<li>• ${title}</li>`).join('')}
      </ul>
    </div>
  `;
  
  // Scroll to success section
  document.getElementById('successSection').scrollIntoView({ behavior: 'smooth' });
}

// Show image overlay
function showImageOverlay(imageUrl, title, author, event) {
  event.stopPropagation(); // Prevent card selection
  
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('imageOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'imageOverlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <span class="overlay-close" onclick="closeImageOverlay()">&times;</span>
        <img id="overlayImage" src="" alt="">
        <div class="overlay-info">
          <div class="overlay-title" id="overlayTitle"></div>
          <div class="overlay-author" id="overlayAuthor"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  
  // Update overlay content
  document.getElementById('overlayImage').src = imageUrl;
  document.getElementById('overlayTitle').textContent = title;
  document.getElementById('overlayAuthor').textContent = `by ${author}`;
  
  // Show overlay
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent body scrolling
}

// Close image overlay
function closeImageOverlay() {
  const overlay = document.getElementById('imageOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore body scrolling
  }
}

// Utility functions
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

function showError(message) {
  const modal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  
  if (modal && errorMessage) {
    errorMessage.textContent = message;
    modal.style.display = 'flex';
  } else {
    alert(message); // Fallback
  }
  
  console.error('🚨 Error:', message);
}

function closeModal() {
  const modal = document.getElementById('errorModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Handle mobile orientation change
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    window.scrollTo(0, window.scrollY);
  }, 100);
});

// Prevent zoom on input focus (mobile)
document.addEventListener('touchstart', () => {}, { passive: true });

console.log('📱 Arena Breakout Voting App script loaded successfully!');