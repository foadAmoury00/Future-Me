import { GoogleGenAI } from "@google/genai";
import { EraData, FaceDetectionResult, EraId } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const DASHBOARD_API_URL = "https://ai-photobooth-dashboard.vercel.app/api/projects/adbe6e74-98c1-48c1-98bb-2ac5dd90d088/generate";
/**
 * Increments the generated images count on the dashboard
 */
const incrementGeneratedCount = async () => {
  try {
    const response = await fetch(DASHBOARD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.warn(`[Dashboard] Failed to increment count: ${response.status} ${response.statusText}`);
    } else {
      console.log('[Dashboard] Successfully incremented generation count');
    }
  } catch (error) {
    console.error('[Dashboard] Error calling increment API:', error);
  }
};

export interface GenerationResult {
  image: string;
  prompt: string;
}

/**
 * Builds a detailed subject description block for the image generation prompt
 * using the actual face detection counts and genders.
 */
const buildSubjectDescription = (faceData: FaceDetectionResult, era: EraData): string => {
  const lines: string[] = [];

  // Enforce strictly 1 person
  lines.push(`Use the uploaded photo as the facial reference. There is exactly 1 person in the photo who must be seamlessly integrated into the scene.`);

  // Preserve exact features and prevent alterations
  lines.push(`\nIDENTITY PRESERVATION RULES (apply strictly to the subject):`);
  lines.push(`- The person's face must remain fully recognizable and match the uploaded photo exactly.`);
  lines.push(`- Preserve real skin tone, skin texture, facial proportions, eye shape, nose, lips, hairline, and overall likeness.`);
  lines.push(`- Do NOT stylize, cartoonize, beautify, age, de-age, or alter any facial structure.`);
  lines.push(`- Seamlessly integrate the person into the career scene as if they were originally part of the photo.`);

  return lines.join("\n");
};

export const generateHistoricalImage = async (
  base64Image: string,
  era: EraData,
  faceData: FaceDetectionResult,
  devSelectedCareer: string = "random"
): Promise<GenerationResult> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  // 1. Build detailed subject description from face detection data
  const subjectDescription = buildSubjectDescription(faceData, era);

  // 2. Select a Random or Specific Career
  console.log("[geminiService] generateHistoricalImage received devSelectedCareer:", devSelectedCareer);
  let selectedCareer = devSelectedCareer;
  if (selectedCareer === "random") {
    selectedCareer = CAREERS[Math.floor(Math.random() * CAREERS.length)];
  }
  console.log("[geminiService] selectedCareer chosen is:", selectedCareer);

  const getCareerSpecifics = (career: string): string => {
    switch (career.toLowerCase()) {
      case 'judge':
        return "The setting is a formal Egyptian courtroom. The Egyptian judge must be seated behind a long wooden desk. " +
          "Attire: The judge must wear a professional suit with a green sash draped over his right shoulder. The sash must feature a gold emblem that resembles the Egyptian eagle. The eagle emblem must feature a shield on its chest displaying the horizontal tricolor of the Egyptian flag: red on top, white in the middle, and black on the bottom. There must be no name tags, ID badges, or any text on the sash or suit. " +
          "Action: The judge is sitting behind the long wooden desk, actively gesturing with his hand as if speaking, with a thick stack of papers or case files resting on the desk in front of him. " +
          "Background: The wall behind must be heavily paneled in wood, featuring an ornate arch design overhead. At the center of the arch, there must be a wooden emblem depicting the scales of justice. Do not place any text, writing, calligraphy, letters, numbers, symbols, badges, or words of any kind in the background or courtroom decor. The entire background must be completely clean and free of text.";
      case 'tour guide':
        return "The tour guide must be located in Egypt (e.g., standing in front of the Pyramids of Giza, the Sphinx, or an ancient Egyptian temple setting). Do not place any text, writing, signage, letters, numbers, symbols, or words in the background.";
      case 'petroleum engineer':
        return "The petroleum engineer must be actively on-site at a realistic field location in Egypt (e.g., an offshore oil rig or onshore drilling site with industrial equipment in the background). Do not include any text, writing, safety signs, labels, numbers, letters, symbols, hard hat logos, or badges on the equipment, background, or outfit.";
      case 'mechanical engineer':
        return "The mechanical engineer must be actively on-site at a realistic machinery location in Egypt (e.g., a machine shop, machinery factory, or industrial engineering floor with mechanical gear). Do not include any text, writing, labels, numbers, letters, symbols, or badges on any machinery, walls, hard hats, or outfits.";
      case 'civil engineer':
        return "The civil engineer must be actively on-site at a realistic construction location in Egypt (e.g., a building construction site, bridge project, or infrastructure development zone with blueprints or safety gear). Do not include any text, writing, safety signs, labels, blueprints, hard hat logos, or badges.";
      case 'pharmacist':
        return "The pharmacist must NOT wear any hats, caps, or headwear of any kind. The pharmacist must NOT wear or hold any heart rate ear tools, stethoscopes, or medical ear instruments of any kind. The pharmacist must be inside a clean modern pharmacy setting in Egypt. Do not include any text, writing, labels, numbers, letters, symbols, or words on any medicine bottles, signs, shelves, or name badges.";
      case 'doctor':
        return "The doctor must be inside a hospital in Egypt (e.g., in a modern hospital hallway, clinical office, or patient care room). Do not include any text, writing, letters, numbers, symbols, labels, or words on signs, medical equipment, patient charts, name badges, or IDs.";
      case 'pilot':
        return "The pilot must be an Egyptian pilot. " +
          "Attire: The pilot must wear a professional Egyptian airline pilot uniform, including a dark navy blue or black pilot jacket with gold stripes on the sleeves, pilot wings pinned to the chest, and a matching pilot cap. There must be no ID cards, name badges, or text of any kind on the uniform. " +
          "Background: The pilot should be in the cockpit of a modern commercial airplane, or standing inside an airport runway setting with a commercial airliner in the background. Do not place any text, writing, letters, numbers, symbols, or words on the airplane controls, signs, or background.";
      case 'architect':
        return "The architect must be holding a rolled-up blueprint or plan. Do not place any text, writing, numbers, letters, symbols, or words on the blueprints, blueprint sketches, hard hats, safety signs, or background.";
      default:
        return "";
    }
  };

  // 3. Construct Unified Prompt
  const careerSpecifics = getCareerSpecifics(selectedCareer);
  const prompt = era.promptInstructions
    .replace(/\{\{SUBJECT_DESCRIPTION\}\}/g, subjectDescription)
    .replace(/\{\{CAREER\}\}/g, selectedCareer)
    .replace(/\{\{CAREER_SPECIFICS\}\}/g, careerSpecifics);

  console.log("------------------- GENERATED PROMPT -------------------");
  console.log(prompt);
  console.log("--------------------------------------------------------");

  // Using raw object structure to bypass potential TS mismatches with the SDK
  const safetySettings: any[] = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
  ];

  const requestConfig: any = {
    temperature: 0.5, // 0.5 is the beginning
    imageConfig: {
      aspectRatio: "2:3",

    },
    responseModalities: ['TEXT', 'IMAGE'],
    safetySettings: safetySettings
  };

  try {
    // 4. Send to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', //'gemini-3.1-flash-image'
      config: requestConfig,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            { text: prompt }
          ]
        }
      ]
    });

    // Extract image from response
    const candidate = response.candidates?.[0];
    if (candidate) {
      if (candidate.finishReason !== 'STOP') {
        console.warn('Gemini Generation Warning: Finish Reason:', candidate.finishReason);
      }

      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          // Increment dashboard count after successful generation
          incrementGeneratedCount();

          return {
            image: `data:image/jpeg;base64,${part.inlineData.data}`,
            prompt: prompt
          };
        }
      }
    }

    console.error('Gemini No Image Generated. Response:', JSON.stringify(response, null, 2));
    throw new Error("No image generated");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
