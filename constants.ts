import { EraData, EraId } from './types';

export const ERAS: EraData[] = [
  {
    id: EraId.CAREERS,
    name: 'Future Career',
    description: 'Transform into a professional in your dream career.',
    isAiGenerated: true,
    promptInstructions: `Create an ultra-realistic cinematic professional portrait of an Egyptian {{CAREER}}.

{{SUBJECT_DESCRIPTION}}

Position the subject(s) professionally. Their bodies should be clearly visible and facing forward. Adjust body poses naturally to fit the composition while preserving each person's facial identity from the uploaded image.

The environment should be a realistic, professional setting in Egypt appropriate for a {{CAREER}}.

The outfit, uniform, attire, and setting must be fully suitable for a professional working in this career in Egypt. Do not include any text, writing, numbers, letters, symbols, or words on any backgrounds, screens, signs, blueprints, name tags, uniforms, or badges. The entire scene must be completely clean and free of any written text or characters.

{{CAREER_SPECIFICS}}

Style Requirements:
- hyper-realistic
- professional photography lighting
- photorealistic skin and fabric details
- authentic career-specific attire and accessories
- seamless compositing
- natural anatomy and proportions

Image Quality Requirements:
- 8K ultra detailed
- HDR
- sharp focus
- professional cinematic color grading

Composition Requirements:
- aspect ratio: 2:3 vertical (portrait)
- all subjects clearly visible
- no distortion
- no extra fingers
- no malformed anatomy
- no blurry face
- no duplicated people

The final result must look like a real professional photograph of the subject(s) working as a {{CAREER}}.`
  },
  {
    id: EraId.SNAP_A_MEMORY,
    name: 'Snap a Memory',
    description: 'Take a beautiful framed photo with no AI transformation.',
    isAiGenerated: false,
    promptInstructions: ''
  }
];

export const CAREERS = [
  "lawyer", "judge", "pharmacist", "artist", "architect",
  "mechanical engineer", "civil engineer", "anchorman",
  "petroleum engineer", "tour guide", "teacher", "doctor", "pilot"
];