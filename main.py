import os
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="SatQuery AI Backend",
    description="AI-powered Satellite Image Analysis using Natural Language Queries",
    version="1.0.0",
)

# Allow frontend to communicate with backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisResponse(BaseModel):
    answer: str
    mode: str


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SatQuery AI",
        "version": "1.0.0",
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(...),
    question: str = Form(...),
):
    if not image:
        raise HTTPException(
            status_code=400,
            detail="Image file is required.",
        )

    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    image_bytes = await image.read()
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    print("Gemini API key found:", bool(gemini_api_key))

    if gemini_api_key:
        try:
            print("Sending image to Gemini...")

            answer = generate_gemini_analysis(
                image_bytes=image_bytes,
                mime_type=image.content_type,
                question=question,
            )

            print("Gemini analysis successful!")

            return AnalysisResponse(
                answer=answer,
                mode="AI Analysis",
            )

        except Exception as e:
            print("GEMINI ERROR:", repr(e))

            return AnalysisResponse(
                answer=f"Gemini API Error: {str(e)}",
                mode="Error",
            )

    answer = generate_demo_response(question)

    return AnalysisResponse(
        answer=answer,
        mode="Demo Mode",
    )


def generate_gemini_analysis(
    image_bytes: bytes,
    mime_type: Optional[str],
    question: str,
) -> str:
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing!")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are SatQuery AI, an AI assistant specialized in satellite
and aerial image analysis.

Analyze ONLY what is visually supported by the provided image.

The user asked:

"{question}"

Instructions:
- Answer clearly and concisely.
- Use bullet points where helpful.
- Identify visible features such as:
  roads, buildings, vegetation, water bodies,
  agricultural land, urban areas, or natural terrain.
- Do not invent exact percentages unless they can
  reasonably be estimated from the image.
- If something cannot be determined, say so.
- Keep the answer understandable for a non-expert user.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type or "image/jpeg",
            ),
            prompt,
        ],
    )

    return response.text or "No analysis could be generated."


def generate_demo_response(question: str) -> str:
    q = question.lower()

    if "urban" in q or "rural" in q:
        return """
### Land Use Analysis

- The image can be examined for urban and rural characteristics.
- Urban regions typically contain dense buildings and road networks.
- Rural regions generally show more open land, vegetation, or agricultural patterns.

**Demo Mode:** Connect a Gemini API key for live AI analysis of the uploaded image.
"""

    if any(word in q for word in ["road", "building", "infrastructure"]):
        return """
### Infrastructure Analysis

- The system can identify visible roads and built structures.
- Road networks, building clusters, and other infrastructure can be analyzed from the satellite image.

**Demo Mode:** Live image recognition requires the Gemini API connection.
"""

    if any(word in q for word in ["vegetation", "tree", "forest", "crop", "green"]):
        return """
### Vegetation Analysis

- The system can analyze visible vegetation patterns.
- Possible features include forests, agricultural land, tree cover, and green spaces.

**Demo Mode:** Connect Gemini for image-specific AI analysis.
"""

    if any(word in q for word in ["water", "river", "lake", "ocean", "sea"]):
        return """
### Water Body Analysis

- The system can identify visible water features.
- These may include rivers, lakes, reservoirs, coastal regions, or other surface water.

**Demo Mode:** Connect Gemini for live analysis of the uploaded image.
"""

    return """
### Satellite Image Analysis

SatQuery AI is ready to analyze the uploaded satellite image.

You can ask questions such as:

- Are there any roads or buildings?
- Is this an urban or rural area?
- Analyze the vegetation.
- Are there any visible water bodies?
- Describe this satellite image.

**Demo Mode:** Add a Gemini API key to enable live AI-powered image analysis.
"""


if __name__ == "__main__":
    import uvicorn

    print("SatQuery AI Backend starting...")
    print("http://127.0.0.1:8000")

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
