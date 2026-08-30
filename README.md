# 🛰️ SatQuery AI

> **"Ask questions. Understand Earth."**  
> A simple, modern MVP web application to analyze satellite imagery using natural language queries and AI.

---

## 🌟 Features

1. **Satellite Image Upload & Presets**
   - Drag & drop or upload any satellite/aerial image (JPG, PNG, WebP, TIFF).
   - High-resolution scan reticle with dimension and status display.
   - **Interactive One-Click Presets**: Test instantly with built-in satellite captures (*Urban Grid*, *Agriculture*, *Coastal Port*, *River Delta*).

2. **Natural Language Question Input**
   - Free-form text queries for flexible Earth observation inquiry.
   - **Quick Question Chips**:
     - 🔍 *Describe Image*
     - 🏙️ *Urban or Rural?*
     - 🏗️ *Detect Buildings and Roads*
     - 🌿 *Analyze Vegetation*
     - 🌊 *Detect Water Bodies*

3. **AI Analysis Engine**
   - Sends image + question to backend `POST /analyze`.
   - Built-in **Orbital Telemetry Loader** and radar sweep animations.
   - Clean, formatted response card with key metrics, bullet points, and copy button.
   - **Zero-Downtime Mock Fallback**: If the backend is not running, the frontend automatically falls back to an intelligent client-side Earth observation engine for seamless demos.

---

## 📁 Project Structure

```
satquery-ai/
├── frontend/
│   ├── index.html        # Clean, modern semantic HTML5 interface
│   ├── style.css         # Space-themed dark CSS (glassmorphism, glowing cyan/purple accents)
│   └── app.js            # Upload handling, preset generator, API connector & smart mock engine
│
├── backend/
│   ├── main.py           # FastAPI server with POST /analyze and optional Gemini Vision support
│   └── requirements.txt  # Python backend dependencies
│
└── README.md             # Documentation & Presentation Guide
```

---

## 🚀 Getting Started

### Option A: Run Frontend Instantly (No setup needed)
1. Navigate to the `frontend/` folder.
2. Open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
3. The app is 100% interactive right out of the box with presets and mock analysis!

---

### Option B: Run with Python FastAPI Backend

#### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Run the FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/](http://localhost:8000/)

#### 3. *(Optional)* Enable Live Gemini 2.5 Flash Vision
To use live Google Gemini Vision for open-ended satellite analysis, set your API key in your terminal before running the server:
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_api_key_here"

# Linux / macOS
export GEMINI_API_KEY="your_api_key_here"
```

---

## 📡 API Specification

### Endpoint: `POST /analyze`
**Content-Type**: `multipart/form-data`

#### Request Parameters:
| Field | Type | Description |
|---|---|---|
| `image` | `UploadFile` | The uploaded satellite or remote sensing image file |
| `question` | `string` | The natural language question to ask about the image |

#### Response Format (`application/json`):
```json
{
  "answer": "### Classification: Urban Metropolitan Area\n\n* **Land Use**: High-Density Urban...\n* **Impervious Surfaces**: 78.4%..."
}
```

---

## 🏆 Presentation & Demo Flow (Hackathons / SIH)

1. **Step 1 - Select Image**: Click **"🏙️ Urban Grid"** or **"🌾 Agriculture"** in the sample captures (or drag and drop your own satellite image).
2. **Step 2 - Choose Prompt**: Click **"Urban or Rural?"** or **"Detect Buildings and Roads"** from the Quick Prompts.
3. **Step 3 - Analyze**: Click **"Analyze Image"**.
4. **Step 4 - Review Output**: Watch the orbital radar scanner reveal the structured AI breakdown with estimated surface ratios and land use metrics.
