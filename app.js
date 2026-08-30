/**
 * SatQuery AI - Frontend Application Logic
 * Handles image upload/preview, preset imagery, quick query chips,
 * API dispatch to POST /analyze, and intelligent mock fallback.
 */

// DOM Elements
const imageInput = document.getElementById('imageInput');
const dropzone = document.getElementById('dropzone');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const resetImageBtn = document.getElementById('resetImageBtn');
const metaFileName = document.getElementById('metaFileName');
const metaDimensions = document.getElementById('metaDimensions');

const questionInput = document.getElementById('questionInput');
const quickChips = document.querySelectorAll('.chip-btn');
const presetBtns = document.querySelectorAll('.preset-btn');

const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeBtnText = document.getElementById('analyzeBtnText');
const responseContainer = document.getElementById('responseContainer');
const loadingState = document.getElementById('loadingState');
const responseCard = document.getElementById('responseCard');
const responseBody = document.getElementById('responseBody');
const responseSourceBadge = document.getElementById('responseSourceBadge');
const copyResponseBtn = document.getElementById('copyResponseBtn');
const analysisTimestamp = document.getElementById('analysisTimestamp');

// State
let currentFile = null;
let currentImageSrc = null;
let currentPresetKey = null;

// Backend API URL (FastAPI default)
const API_URL = 'http://localhost:8000/analyze';

/* -------------------------------------------------------------
 * 1. Preset Satellite Imagery Generator (Canvas-based SVGs)
 * ------------------------------------------------------------- */
const SAMPLE_PRESETS = {
  urban: {
    title: 'urban_metropolitan_grid.jpg',
    resolution: '1920 x 1080 (0.5m GSD)',
    category: 'urban',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <defs>
        <linearGradient id="bgU" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" stroke-width="1.5"/></pattern>
      </defs>
      <rect width="800" height="500" fill="url(#bgU)"/>
      <rect width="800" height="500" fill="url(#grid)" opacity="0.6"/>
      <!-- Main Arterial Avenues -->
      <path d="M0 120 Q400 140 800 110" stroke="#f1f5f9" stroke-width="10" fill="none"/>
      <path d="M0 380 Q400 350 800 370" stroke="#f1f5f9" stroke-width="10" fill="none"/>
      <path d="M260 0 L280 500" stroke="#cbd5e1" stroke-width="8" fill="none"/>
      <path d="M540 0 L520 500" stroke="#cbd5e1" stroke-width="8" fill="none"/>
      <!-- Commercial & Residential Clusters -->
      <g fill="#94a3b8" opacity="0.85">
        <rect x="60" y="30" width="80" height="60" rx="3"/><rect x="160" y="40" width="70" height="50" rx="3"/>
        <rect x="310" y="30" width="90" height="70" rx="3"/><rect x="420" y="25" width="85" height="75" rx="3"/>
        <rect x="580" y="35" width="100" height="60" rx="3"/><rect x="700" y="40" width="70" height="50" rx="3"/>
        <!-- Central Blocks -->
        <rect x="80" y="160" width="140" height="90" rx="4" fill="#64748b"/>
        <rect x="80" y="270" width="140" height="80" rx="4" fill="#475569"/>
        <rect x="310" y="155" width="180" height="180" rx="6" fill="#334155"/>
        <rect x="330" y="180" width="60" height="60" rx="3" fill="#64748b"/>
        <rect x="410" y="180" width="60" height="60" rx="3" fill="#94a3b8"/>
        <rect x="330" y="260" width="140" height="50" rx="3" fill="#0284c7" opacity="0.7"/>
        <rect x="570" y="160" width="90" height="180" rx="4" fill="#64748b"/>
        <rect x="680" y="160" width="90" height="80" rx="4" fill="#475569"/>
        <rect x="680" y="260" width="90" height="90" rx="4" fill="#334155"/>
      </g>
      <!-- Small Green Park in City Center -->
      <circle cx="150" cy="210" r="30" fill="#15803d" opacity="0.85"/>
      <rect x="600" y="410" width="160" height="60" rx="8" fill="#166534" opacity="0.8"/>
    </svg>`
  },
  agriculture: {
    title: 'agricultural_pivot_fields.jpg',
    resolution: '2048 x 1536 (1.0m GSD)',
    category: 'agriculture',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#78350f" opacity="0.9"/>
      <!-- Irrigation Circles -->
      <circle cx="150" cy="150" r="110" fill="#15803d"/>
      <circle cx="150" cy="150" r="4" fill="#fef08a"/>
      <path d="M150 150 L250 190" stroke="#fef08a" stroke-width="2"/>
      
      <circle cx="390" cy="140" r="100" fill="#16a34a"/>
      <circle cx="620" cy="150" r="105" fill="#ca8a04"/>
      
      <circle cx="160" cy="370" r="100" fill="#65a30d"/>
      <circle cx="390" cy="360" r="100" fill="#15803d"/>
      <circle cx="620" cy="370" r="100" fill="#166534"/>
      <!-- Rural Dirt Roads & Canals -->
      <path d="M0 255 L800 255" stroke="#d97706" stroke-width="6" fill="none"/>
      <path d="M270 0 L270 500" stroke="#d97706" stroke-width="5" fill="none"/>
      <path d="M505 0 L505 500" stroke="#d97706" stroke-width="5" fill="none"/>
      <!-- Small Water Channel -->
      <path d="M0 480 Q400 470 800 485" stroke="#0284c7" stroke-width="12" fill="none"/>
    </svg>`
  },
  coastal: {
    title: 'coastal_harbor_terminal.jpg',
    resolution: '1920 x 1080 (0.3m GSD)',
    category: 'coastal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <!-- Ocean Water Body -->
      <rect width="800" height="500" fill="#0369a1"/>
      <path d="M0 0 C250 80, 200 400, 0 500 Z" fill="#334155"/>
      <!-- Harbor Docks / Piers -->
      <rect x="180" y="80" width="220" height="35" rx="3" fill="#64748b"/>
      <rect x="180" y="180" width="260" height="40" rx="3" fill="#64748b"/>
      <rect x="160" y="290" width="240" height="38" rx="3" fill="#64748b"/>
      <rect x="140" y="390" width="200" height="35" rx="3" fill="#64748b"/>
      <!-- Cargo Ships / Vessels -->
      <rect x="420" y="85" width="140" height="25" rx="8" fill="#dc2626"/>
      <rect x="460" y="185" width="180" height="30" rx="10" fill="#2563eb"/>
      <rect x="415" y="295" width="120" height="26" rx="7" fill="#16a34a"/>
      <!-- Ship Wake Trails -->
      <path d="M580 97 Q680 95 780 85" stroke="#bae6fd" stroke-width="3" opacity="0.6" stroke-dasharray="8 4"/>
      <path d="M660 200 Q740 202 800 205" stroke="#bae6fd" stroke-width="4" opacity="0.7" stroke-dasharray="10 5"/>
      <!-- Port Logistics & Containers -->
      <rect x="20" y="60" width="90" height="120" fill="#f59e0b" opacity="0.9"/>
      <rect x="20" y="200" width="80" height="100" fill="#0284c7" opacity="0.9"/>
      <rect x="20" y="320" width="70" height="90" fill="#dc2626" opacity="0.9"/>
    </svg>`
  },
  river: {
    title: 'river_delta_rainforest.jpg',
    resolution: '2560 x 1440 (1.5m GSD)',
    category: 'river',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <!-- Dense Forest Background -->
      <rect width="800" height="500" fill="#14532d"/>
      <circle cx="100" cy="80" r="90" fill="#166534"/>
      <circle cx="700" cy="400" r="140" fill="#166534"/>
      <circle cx="650" cy="90" r="100" fill="#052e16"/>
      <circle cx="200" cy="420" r="110" fill="#052e16"/>
      <!-- Winding River Channel -->
      <path d="M-20 220 Q180 120 320 280 T650 200 T820 310" stroke="#0284c7" stroke-width="50" fill="none" stroke-linecap="round"/>
      <!-- Tributaries -->
      <path d="M300 250 Q360 80 440 0" stroke="#0ea5e9" stroke-width="18" fill="none"/>
      <path d="M550 210 Q580 400 700 500" stroke="#0ea5e9" stroke-width="16" fill="none"/>
      <path d="M120 180 Q80 340 0 400" stroke="#38bdf8" stroke-width="12" fill="none"/>
      <!-- Sandbars & Sediment -->
      <ellipse cx="320" cy="275" rx="35" ry="12" fill="#d97706" opacity="0.8"/>
      <ellipse cx="640" cy="210" rx="30" ry="10" fill="#d97706" opacity="0.8"/>
    </svg>`
  }
};

// Convert SVG string to data URL
function svgToDataUrl(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

// Convert data URL to File object for FormData upload
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/* -------------------------------------------------------------
 * 2. Image Upload & Selection Handling
 * ------------------------------------------------------------- */
function handleFileSelect(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please select a valid satellite or remote sensing image (JPG, PNG, TIFF, WebP).');
    return;
  }

  currentFile = file;
  currentPresetKey = null;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageSrc = e.target.result;
    displayImage(currentImageSrc, file.name);
  };
  reader.readAsDataURL(file);
}

function displayImage(src, filename, resolutionText = null) {
  previewImage.src = src;
  metaFileName.textContent = filename;
  metaFileName.title = filename;

  previewContainer.classList.remove('hidden');
  dropzone.classList.add('hidden');
  resetImageBtn.classList.remove('hidden');

  // Compute resolution once image loads
  previewImage.onload = () => {
    if (resolutionText) {
      metaDimensions.textContent = resolutionText;
    } else {
      metaDimensions.textContent = `${previewImage.naturalWidth} x ${previewImage.naturalHeight} px`;
    }
  };
}

function resetImage() {
  currentFile = null;
  currentImageSrc = null;
  currentPresetKey = null;
  imageInput.value = '';
  previewImage.src = '';
  
  previewContainer.classList.add('hidden');
  dropzone.classList.remove('hidden');
  resetImageBtn.classList.add('hidden');

  // Reset scan state if present
  document.querySelector('.image-wrapper')?.classList.remove('scanning');
}

// File Input Event
imageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Drag & Drop Events
['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
  });
});

dropzone.addEventListener('drop', (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

resetImageBtn.addEventListener('click', resetImage);

/* -------------------------------------------------------------
 * 3. Preset Sample Images Activation
 * ------------------------------------------------------------- */
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const sampleKey = btn.getAttribute('data-sample');
    const preset = SAMPLE_PRESETS[sampleKey];
    if (!preset) return;

    currentPresetKey = sampleKey;
    const dataUrl = svgToDataUrl(preset.svg);
    currentImageSrc = dataUrl;
    currentFile = dataURLtoFile(dataUrl, preset.title);
    
    displayImage(dataUrl, preset.title, preset.resolution);

    // Auto-focus question input
    questionInput.focus();
  });
});

/* -------------------------------------------------------------
 * 4. Quick Question Chips
 * ------------------------------------------------------------- */
quickChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const question = chip.getAttribute('data-question');
    questionInput.value = question;
    questionInput.focus();
    
    // Pulse highlight effect on textarea
    questionInput.style.borderColor = '#38bdf8';
    setTimeout(() => {
      questionInput.style.borderColor = '';
    }, 400);
  });
});

/* -------------------------------------------------------------
 * 5. Analyze Dispatch & AI Response
 * ------------------------------------------------------------- */
analyzeBtn.addEventListener('click', async () => {
  // Validations
  if (!currentFile && !currentImageSrc) {
    alert('Please upload a satellite image or choose one of the preset captures.');
    dropzone.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const question = questionInput.value.trim();
  if (!question) {
    alert('Please enter a question or click one of the quick prompt buttons.');
    questionInput.focus();
    return;
  }

  // Set UI to Loading State
  setLoadingState(true);

  // Attempt real API call to FastAPI backend
  try {
    const formData = new FormData();
    // If currentFile is present, send it; otherwise convert dataUrl
    const fileToSend = currentFile || dataURLtoFile(currentImageSrc, 'satellite_capture.png');
    formData.append('image', fileToSend);
    formData.append('question', question);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout before fallback

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      renderAIResponse(data.answer, 'FastAPI / Vision AI');
    } else {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
  } catch (err) {
    console.warn('Backend API not reachable. Using built-in intelligent Earth Observation mock engine:', err.message);
    
    // Simulate brief processing delay for realistic demo experience
    await new Promise(resolve => setTimeout(resolve, 1400));
    const mockAnswer = generateSmartMockResponse(question, currentPresetKey);
    renderAIResponse(mockAnswer, 'SatQuery AI Engine (Demo Mode)');
  } finally {
    setLoadingState(false);
  }
});

function setLoadingState(isLoading) {
  const imageWrapper = document.querySelector('.image-wrapper');
  
  if (isLoading) {
    analyzeBtn.disabled = true;
    analyzeBtnText.textContent = 'Analyzing Satellite Capture...';
    responseContainer.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    responseCard.classList.add('hidden');
    if (imageWrapper) imageWrapper.classList.add('scanning');
  } else {
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = 'Analyze Image';
    loadingState.classList.add('hidden');
    if (imageWrapper) imageWrapper.classList.remove('scanning');
  }
}

function renderAIResponse(text, sourceLabel) {
  responseSourceBadge.textContent = sourceLabel;
  
  // Format simple markdown into HTML structure
  responseBody.innerHTML = formatMarkdownToHTML(text);
  responseCard.classList.remove('hidden');
  
  // Update timestamp
  const now = new Date();
  analysisTimestamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Smooth scroll to response
  responseCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Convert markdown asterisks and lists into styled HTML
function formatMarkdownToHTML(text) {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers ###
    .replace(/^### (.*$)/gim, '<h4 style="color:#38bdf8; margin-top:0.8rem; margin-bottom:0.3rem; font-size:0.95rem;">$1</h4>')
    // Bold **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Bullet points * or -
    .replace(/^\s*[\-\*]\s+(.*)$/gim, '<li>$1</li>');

  // Wrap loose <li> tags into <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Clean up adjacent <ul><ul>
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return html;
}

/* -------------------------------------------------------------
 * 6. Copy Response to Clipboard
 * ------------------------------------------------------------- */
copyResponseBtn.addEventListener('click', () => {
  const text = responseBody.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = copyResponseBtn.innerHTML;
    copyResponseBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => {
      copyResponseBtn.innerHTML = originalHTML;
    }, 2000);
  });
});

/* -------------------------------------------------------------
 * 7. Intelligent Earth Observation Mock Engine
 * Provides context-aware answers based on queries & presets
 * ------------------------------------------------------------- */
function generateSmartMockResponse(question, presetKey) {
  const q = question.toLowerCase();

  // 1. Urban / Rural Question
  if (q.includes('urban') || q.includes('rural')) {
    if (presetKey === 'agriculture' || presetKey === 'river') {
      return `### Classification: Rural / Natural Landscape

Based on multispectral texture and feature geometry:
* **Land Use**: Predominantly **Rural & Agricultural** with minimal artificial impervious surfaces (< 4%).
* **Structure Density**: Sparse standalone rural structures detected; no dense road networks or commercial towers.
* **Vegetation & Terrain**: High proportion of vegetative cover and open agricultural fields.
* **Confidence Level**: **97.4%** Rural classification.`;
    }
    return `### Classification: Urban Metropolitan Area

Based on high-resolution spatial feature extraction:
* **Land Use**: **High-Density Urban / Industrial**.
* **Man-Made Features**: Extensive orthogonal grid pattern of buildings, paved roadways, and infrastructure cover (> 82%).
* **Impervious Surfaces**: Concrete and asphalt signatures dominate the scene.
* **Green Spaces**: Fragmented urban parks and roadside greenery.
* **Confidence Level**: **98.2%** Urban classification.`;
  }

  // 2. Buildings & Roads Detection
  if (q.includes('building') || q.includes('road') || q.includes('infrastructure')) {
    if (presetKey === 'coastal') {
      return `### Infrastructure & Maritime Detection:

* **Harbor & Piers**: Identified 4 major concrete cargo docks and marine berthing facilities.
* **Vessels Detected**: Detected 3 large cargo/transport ships berthed along the northern and central berths.
* **Logistics & Roadways**: Container storage yards with primary coastal access highways.
* **Structural Coverage**: ~45% developed port infrastructure, 55% open water channel.`;
    }
    if (presetKey === 'agriculture' || presetKey === 'river') {
      return `### Infrastructure Analysis:

* **Roadways**: Identified unpaved rural access tracks and secondary transport routes along field perimeters.
* **Buildings**: Low building density (< 2 structures/km²). No multi-story or industrial complexes detected.
* **Hydrological Infrastructure**: Irrigation channels and water management ditches identified.`;
    }
    return `### Building & Road Network Extraction:

* **Building Footprints**: Successfully segmented multiple commercial and residential blocks arranged in an organized grid layout.
* **Road Transportation**: Two major multi-lane arterial thoroughfares intersecting with secondary access streets.
* **Estimated Impervious Surface Ratio**: **76.8%**.
* **Structural Regularity**: High rectilinear alignment typical of planned urban development.`;
  }

  // 3. Vegetation / Agriculture Analysis
  if (q.includes('vegetation') || q.includes('tree') || q.includes('forest') || q.includes('crop') || q.includes('green')) {
    if (presetKey === 'agriculture') {
      return `### Vegetation & Agricultural Assessment:

* **Cropland Geometry**: Center-pivot circular irrigation parcels clearly visible with distinct spectral signatures.
* **Estimated NDVI (Normalized Difference Vegetation Index)**: High active photosynthetic biomass (**NDVI: 0.72 - 0.85**).
* **Crop Stages**: Mixed maturity phases observed — deep green parcels indicate peak canopy cover, while yellowish sectors indicate ripening or fallow soil.
* **Soil Condition**: Managed agricultural soil with moisture retention along active spray pivots.`;
    }
    if (presetKey === 'river') {
      return `### Forest Canopy & Riparian Vegetation:

* **Canopy Density**: Continuous dense subtropical/tropical rainforest canopy cover (> 88%).
* **Riparian Buffer**: Healthy natural vegetation buffer along both banks of the main river channel.
* **Ecosystem Health**: Uniform spectral reflectance indicating undisturbed contiguous forest cover with negligible deforestation patches.`;
    }
    return `### Vegetation Cover Analysis:

* **Estimated Canopy / Green Space**: **18.5%** of total scene area.
* **Distribution**: Distributed as municipal green belts, isolated park parcels, and perimeter tree lines.
* **NDVI Index**: **0.42 (Moderate)** in vegetated zones, contrasting with low values (< 0.1) across paved built-up areas.`;
  }

  // 4. Water Bodies Detection
  if (q.includes('water') || q.includes('river') || q.includes('lake') || q.includes('ocean') || q.includes('sea')) {
    if (presetKey === 'coastal') {
      return `### Hydrological & Marine Assessment:

* **Water Feature Type**: Coastal marine bay / deep-water port fairway.
* **Surface Area**: Occupies approximately **55%** of the captured scene.
* **Vessel Signatures**: Active wake patterns behind moving vessels indicate directional navigation channels.
* **Water Quality Metric**: Deep blue spectral return indicating high depth and low suspended sediment in the outer bay.`;
    }
    if (presetKey === 'river') {
      return `### River System & Tributary Analysis:

* **Main Channel**: Meandering river system flowing diagonally across the scene with average width ~120m.
* **Tributaries**: 3 distinct dendritic feeder streams flowing into the primary channel.
* **Sediment Transport**: Visible sandbars and alluvial sediment accumulation along river inner bends.
* **Floodplain Status**: Saturated soil moisture along riparian corridors.`;
    }
    return `### Water Body Identification:

* **Water Features**: No major open oceans or natural lakes detected.
* **Minor Features**: Detected small surface water reservoir / drainage catchment basin in the central quadrant (~3.2% total area).
* **Spectral Absorption**: High NIR absorption characteristic of open surface water.`;
  }

  // 5. General Description (Default fallback)
  return `### Comprehensive Satellite Scene Analysis:

* **Primary Terrain**: ${presetKey ? presetKey.toUpperCase() : 'Remote Sensing Optical Capture'}.
* **Key Observations**:
  * Distinct spatial patterns displaying both natural environmental features and land use characteristics.
  * Contrast between high-reflectance surfaces and lower-reflectance terrain.
* **Environmental & Structural Balance**:
  * Built/Developed Area: Estimated ~40%
  * Natural/Vegetated Land: Estimated ~35%
  * Water/Open Space: Estimated ~25%
* **Recommendation**: Use specific queries like *"Detect buildings"*, *"Analyze vegetation"*, or *"Is this urban or rural?"* for specialized deep spectral breakdowns.`;
}
