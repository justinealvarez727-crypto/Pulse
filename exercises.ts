import type { Equipment, Exercise, ExerciseType } from '@/types';

/**
 * Curated exercise library (~250). Authoring format: "Name|Equip|Primary|Others,comma|Type".
 * Variants (Incline/Decline, Close-grip…) are expanded programmatically at the bottom.
 * Exercise "pictures" are replaced by icons (spec) — see components/Icons.tsx#exerciseIcon.
 */
const EQ: Record<string, Equipment> = { BW: 'Bodyweight', BB: 'Barbell', DB: 'Dumbbell', KB: 'Kettlebell', CB: 'Cable', MC: 'Machine', SM: 'Smith Machine', EZ: 'EZ Bar', PU: 'Pull-up Bar', RB: 'Resistance Band' };
const TY: Record<string, ExerciseType> = { wr: 'weight_reps', br: 'bodyweight_reps', wb: 'weighted_bodyweight', ab: 'assisted_bodyweight', du: 'duration', dw: 'duration_weight', dd: 'distance_duration', wd: 'weight_distance' };

const RAW = `
Barbell Bench Press|BB|Pectoralis Major|Triceps,Front Delts|wr
Dumbbell Bench Press|DB|Pectoralis Major|Triceps,Front Delts|wr
Smith Machine Bench Press|SM|Pectoralis Major|Triceps,Front Delts|wr
Machine Chest Press|MC|Pectoralis Major|Triceps,Front Delts|wr
Push-Up|BW|Pectoralis Major|Triceps,Front Delts,Abs|br
Weighted Push-Up|BW|Pectoralis Major|Triceps,Front Delts|wb
Chest Dips|BW|Pectoralis Major|Triceps,Front Delts|br
Weighted Chest Dips|BW|Pectoralis Major|Triceps,Front Delts|wb
Assisted Chest Dips|MC|Pectoralis Major|Triceps,Front Delts|ab
Dumbbell Fly|DB|Pectoralis Major|Front Delts|wr
Cable Fly|CB|Pectoralis Major|Front Delts|wr
Cable Crossover|CB|Pectoralis Major|Front Delts|wr
Pec Deck Fly|MC|Pectoralis Major|Front Delts|wr
Dumbbell Pullover|DB|Pectoralis Major|Latissimus Dorsi,Triceps|wr
Resistance Band Chest Press|RB|Pectoralis Major|Triceps|wr
Svend Press|DB|Pectoralis Major|Front Delts|wr
Serratus Push-Up Plus|BW|Serratus Anterior|Pectoralis Major|br
Cable Serratus Crunch|CB|Serratus Anterior|Abs|wr
Pull-Up|PU|Latissimus Dorsi|Biceps,Rhomboids|br
Chin-Up|PU|Latissimus Dorsi|Biceps,Brachialis|br
Weighted Pull-Up|PU|Latissimus Dorsi|Biceps,Rhomboids|wb
Assisted Pull-Up|MC|Latissimus Dorsi|Biceps,Rhomboids|ab
Neutral-Grip Pull-Up|PU|Latissimus Dorsi|Biceps,Brachialis|br
Lat Pulldown|CB|Latissimus Dorsi|Biceps,Rhomboids|wr
Close-Grip Lat Pulldown|CB|Latissimus Dorsi|Biceps,Brachialis|wr
Straight-Arm Pulldown|CB|Latissimus Dorsi|Triceps|wr
Seated Cable Row|CB|Latissimus Dorsi|Rhomboids,Biceps,Rear Delts|wr
Bent-Over Barbell Row|BB|Latissimus Dorsi|Rhomboids,Trapezius,Biceps,Erector Spinae|wr
Pendlay Row|BB|Latissimus Dorsi|Rhomboids,Trapezius,Erector Spinae|wr
One-Arm Dumbbell Row|DB|Latissimus Dorsi|Rhomboids,Biceps|wr
Chest-Supported Row|MC|Rhomboids|Latissimus Dorsi,Rear Delts,Biceps|wr
T-Bar Row|BB|Latissimus Dorsi|Rhomboids,Trapezius,Biceps|wr
Machine Row|MC|Latissimus Dorsi|Rhomboids,Biceps|wr
Inverted Row|BW|Latissimus Dorsi|Rhomboids,Biceps|br
Kettlebell Row|KB|Latissimus Dorsi|Rhomboids,Biceps|wr
Barbell Deadlift|BB|Erector Spinae|Glutes,Hamstrings,Trapezius,Forearm Flexors|wr
Sumo Deadlift|BB|Glutes|Adductors,Hamstrings,Erector Spinae,Quadriceps|wr
Trap Bar Deadlift|BB|Quadriceps|Glutes,Hamstrings,Trapezius,Erector Spinae|wr
Rack Pull|BB|Erector Spinae|Trapezius,Glutes,Hamstrings|wr
Back Extension|BW|Erector Spinae|Glutes,Hamstrings|br
Weighted Back Extension|MC|Erector Spinae|Glutes,Hamstrings|wr
Good Morning|BB|Erector Spinae|Hamstrings,Glutes|wr
Barbell Shrug|BB|Trapezius|Forearm Flexors|wr
Dumbbell Shrug|DB|Trapezius|Forearm Flexors|wr
Face Pull|CB|Rear Delts|Trapezius,Rhomboids|wr
Reverse Pec Deck|MC|Rear Delts|Rhomboids,Trapezius|wr
Superman|BW|Erector Spinae|Glutes|du
Barbell Overhead Press|BB|Front Delts|Side Delts,Triceps,Trapezius|wr
Dumbbell Shoulder Press|DB|Front Delts|Side Delts,Triceps|wr
Seated Dumbbell Press|DB|Front Delts|Side Delts,Triceps|wr
Arnold Press|DB|Front Delts|Side Delts,Triceps|wr
Machine Shoulder Press|MC|Front Delts|Side Delts,Triceps|wr
Smith Machine Shoulder Press|SM|Front Delts|Side Delts,Triceps|wr
Push Press|BB|Front Delts|Triceps,Quadriceps|wr
Dumbbell Lateral Raise|DB|Side Delts|Trapezius|wr
Cable Lateral Raise|CB|Side Delts|Trapezius|wr
Machine Lateral Raise|MC|Side Delts||wr
Dumbbell Front Raise|DB|Front Delts|Side Delts|wr
Plate Front Raise|BB|Front Delts|Side Delts|wr
Rear Delt Fly|DB|Rear Delts|Rhomboids,Trapezius|wr
Cable Rear Delt Fly|CB|Rear Delts|Rhomboids|wr
Upright Row|EZ|Side Delts|Trapezius,Biceps|wr
Pike Push-Up|BW|Front Delts|Triceps,Side Delts|br
Handstand Hold|BW|Front Delts|Triceps,Abs|du
Band Pull-Apart|RB|Rear Delts|Rhomboids,Trapezius|br
Dumbbell Bicep Curl|DB|Biceps|Brachialis,Forearm Flexors|wr
Barbell Curl|BB|Biceps|Brachialis,Forearm Flexors|wr
EZ-Bar Curl|EZ|Biceps|Brachialis,Forearm Flexors|wr
Hammer Curl|DB|Brachialis|Biceps,Brachioradialis|wr
Incline Dumbbell Curl|DB|Biceps|Brachialis|wr
Preacher Curl|EZ|Biceps|Brachialis|wr
Concentration Curl|DB|Biceps|Brachialis|wr
Cable Curl|CB|Biceps|Brachialis|wr
Spider Curl|DB|Biceps|Brachialis|wr
Machine Preacher Curl|MC|Biceps|Brachialis|wr
Resistance Band Curl|RB|Biceps|Brachialis|wr
Reverse Curl|EZ|Brachioradialis|Brachialis,Forearm Extensors|wr
Triceps Pushdown|CB|Triceps||wr
Rope Pushdown|CB|Triceps||wr
Overhead Triceps Extension|DB|Triceps||wr
Cable Overhead Triceps Extension|CB|Triceps||wr
Skull Crusher|EZ|Triceps||wr
Close-Grip Bench Press|BB|Triceps|Pectoralis Major,Front Delts|wr
Bench Dips|BW|Triceps|Front Delts,Pectoralis Major|br
Triceps Dips|BW|Triceps|Pectoralis Major,Front Delts|br
Diamond Push-Up|BW|Triceps|Pectoralis Major|br
Triceps Kickback|DB|Triceps||wr
Machine Triceps Extension|MC|Triceps||wr
Wrist Curl|BB|Forearm Flexors||wr
Reverse Wrist Curl|BB|Forearm Extensors||wr
Farmer's Walk|DB|Forearm Flexors|Trapezius,Abs|wd
Dead Hang|PU|Forearm Flexors|Latissimus Dorsi|du
Plate Pinch|BB|Forearm Flexors||du
Barbell Back Squat|BB|Quadriceps|Glutes,Hamstrings,Erector Spinae,Adductors|wr
Barbell Front Squat|BB|Quadriceps|Glutes,Abs,Erector Spinae|wr
Smith Machine Squat|SM|Quadriceps|Glutes,Adductors|wr
Goblet Squat|DB|Quadriceps|Glutes,Adductors|wr
Kettlebell Goblet Squat|KB|Quadriceps|Glutes,Adductors|wr
Bodyweight Squat|BW|Quadriceps|Glutes|br
Hack Squat|MC|Quadriceps|Glutes|wr
Leg Press|MC|Quadriceps|Glutes,Hamstrings|wr
Leg Extension|MC|Quadriceps||wr
Bulgarian Split Squat|DB|Quadriceps|Glutes,Adductors|wr
Walking Lunge|DB|Quadriceps|Glutes,Hamstrings|wr
Reverse Lunge|DB|Quadriceps|Glutes,Hamstrings|wr
Barbell Lunge|BB|Quadriceps|Glutes,Hamstrings|wr
Step-Up|DB|Quadriceps|Glutes|wr
Sissy Squat|BW|Quadriceps||br
Wall Sit|BW|Quadriceps|Glutes|du
Pistol Squat|BW|Quadriceps|Glutes|br
Jump Squat|BW|Quadriceps|Glutes,Calves|br
Romanian Deadlift|BB|Hamstrings|Glutes,Erector Spinae|wr
Dumbbell Romanian Deadlift|DB|Hamstrings|Glutes,Erector Spinae|wr
Stiff-Leg Deadlift|BB|Hamstrings|Glutes,Erector Spinae|wr
Lying Leg Curl|MC|Hamstrings||wr
Seated Leg Curl|MC|Hamstrings||wr
Standing Leg Curl|MC|Hamstrings||wr
Nordic Hamstring Curl|BW|Hamstrings|Glutes|br
Cable Pull-Through|CB|Glutes|Hamstrings|wr
Kettlebell Swing|KB|Glutes|Hamstrings,Erector Spinae|wr
Barbell Hip Thrust|BB|Glutes|Hamstrings|wr
Smith Machine Hip Thrust|SM|Glutes|Hamstrings|wr
Machine Hip Thrust|MC|Glutes|Hamstrings|wr
Glute Bridge|BW|Glutes|Hamstrings|br
Single-Leg Glute Bridge|BW|Glutes|Hamstrings|br
Cable Kickback|CB|Glutes|Hamstrings|wr
Glute Kickback Machine|MC|Glutes||wr
Banded Lateral Walk|RB|Glute Medius|Abductors|br
Fire Hydrant|BW|Glute Medius|Glutes|br
Hip Abduction Machine|MC|Abductors|Glute Medius|wr
Hip Adduction Machine|MC|Adductors||wr
Copenhagen Plank|BW|Adductors|Obliques|du
Cossack Squat|BW|Adductors|Quadriceps,Glutes|br
Standing Calf Raise|MC|Calves|Soleus|wr
Seated Calf Raise|MC|Soleus|Calves|wr
Smith Machine Calf Raise|SM|Calves|Soleus|wr
Donkey Calf Raise|MC|Calves|Soleus|wr
Leg Press Calf Raise|MC|Calves|Soleus|wr
Single-Leg Calf Raise|BW|Calves|Soleus|br
Dumbbell Calf Raise|DB|Calves|Soleus|wr
Tibialis Raise|BW|Calves||br
Plank|BW|Abs|Transverse Abs,Obliques|du
Side Plank|BW|Obliques|Transverse Abs,Glute Medius|du
Crunch|BW|Abs||br
Cable Crunch|CB|Abs||wr
Machine Crunch|MC|Abs||wr
Sit-Up|BW|Abs|Hip Flexors|br
Decline Sit-Up|BW|Abs|Hip Flexors|br
Hanging Leg Raise|PU|Abs|Hip Flexors|br
Hanging Knee Raise|PU|Abs|Hip Flexors|br
Lying Leg Raise|BW|Abs|Hip Flexors|br
Reverse Crunch|BW|Abs|Hip Flexors|br
Bicycle Crunch|BW|Obliques|Abs|br
Russian Twist|BW|Obliques|Abs|br
Weighted Russian Twist|DB|Obliques|Abs|wr
Woodchopper|CB|Obliques|Abs,Transverse Abs|wr
Pallof Press|CB|Transverse Abs|Obliques|wr
Ab Wheel Rollout|BW|Abs|Transverse Abs,Hip Flexors|br
Dead Bug|BW|Transverse Abs|Abs,Hip Flexors|br
Bird Dog|BW|Transverse Abs|Erector Spinae,Glutes|br
Hollow Body Hold|BW|Abs|Transverse Abs|du
Mountain Climber|BW|Abs|Hip Flexors,Front Delts|du
V-Up|BW|Abs|Hip Flexors|br
Toes-to-Bar|PU|Abs|Hip Flexors,Latissimus Dorsi|br
Suitcase Carry|DB|Obliques|Forearm Flexors,Transverse Abs|wd
Hip Flexor March|BW|Hip Flexors|Abs|br
Seated Hip Flexor Raise|MC|Hip Flexors|Abs|wr
Kettlebell Turkish Get-Up|KB|Transverse Abs|Front Delts,Glutes,Obliques|wr
Kettlebell Clean|KB|Glutes|Trapezius,Hamstrings,Front Delts|wr
Kettlebell Snatch|KB|Glutes|Front Delts,Trapezius,Hamstrings|wr
Kettlebell Press|KB|Front Delts|Triceps,Side Delts|wr
Burpee|BW|Quadriceps|Pectoralis Major,Front Delts,Abs|br
Box Jump|BW|Quadriceps|Glutes,Calves|br
Jump Rope|BW|Calves|Soleus,Forearm Flexors|du
Treadmill Run|MC|Quadriceps|Calves,Hamstrings,Glutes|dd
Outdoor Run|BW|Quadriceps|Calves,Hamstrings,Glutes|dd
Treadmill Walk|MC|Quadriceps|Calves,Glutes|dd
Brisk Walk|BW|Quadriceps|Calves,Glutes|dd
Cycling|BW|Quadriceps|Calves,Hamstrings,Glutes|dd
Stationary Bike|MC|Quadriceps|Calves,Hamstrings|dd
Rowing Machine|MC|Latissimus Dorsi|Quadriceps,Biceps,Erector Spinae|dd
Elliptical|MC|Quadriceps|Glutes,Calves|dd
Stair Climber|MC|Glutes|Quadriceps,Calves|dd
Swimming|BW|Latissimus Dorsi|Front Delts,Triceps,Quadriceps|dd
Sled Push|MC|Quadriceps|Glutes,Calves|wd
Sled Pull|MC|Hamstrings|Glutes,Erector Spinae|wd
Battle Ropes|BW|Front Delts|Abs,Forearm Flexors|du
Bear Crawl|BW|Front Delts|Abs,Quadriceps|dd
Cat-Cow Stretch|BW|Erector Spinae|Abs|du
World's Greatest Stretch|BW|Hip Flexors|Glutes,Hamstrings,Erector Spinae|du
Hip Flexor Stretch|BW|Hip Flexors|Quadriceps|du
Hamstring Stretch|BW|Hamstrings||du
Quad Stretch|BW|Quadriceps||du
Child's Pose|BW|Latissimus Dorsi|Erector Spinae|du
Doorway Chest Stretch|BW|Pectoralis Major|Front Delts|du
Cross-Body Shoulder Stretch|BW|Rear Delts|Rhomboids|du
Pigeon Pose|BW|Glutes|Hip Flexors|du
Calf Stretch|BW|Calves|Soleus|du
Foam Roll Back|BW|Erector Spinae||du
Arm Circles|BW|Side Delts|Front Delts,Rear Delts|du
Leg Swings|BW|Hip Flexors|Hamstrings,Glute Medius|br
Band Shoulder Dislocates|RB|Rear Delts|Side Delts,Rhomboids|br
Jumping Jacks|BW|Calves|Side Delts,Quadriceps|du
High Knees|BW|Hip Flexors|Quadriceps,Calves|du
Inchworm|BW|Hamstrings|Abs,Front Delts|br
Glute Activation Squat Hold|BW|Glutes|Quadriceps|du
`;

const POPULAR = ['Barbell Bench Press', 'Barbell Back Squat', 'Barbell Deadlift', 'Barbell Overhead Press', 'Bent-Over Barbell Row', 'Pull-Up', 'Chest Dips', 'Romanian Deadlift', 'Barbell Hip Thrust', 'Dumbbell Bicep Curl', 'Dumbbell Lateral Raise', 'Lat Pulldown', 'Seated Cable Row', 'Leg Press', 'Lying Leg Curl', 'Leg Extension', 'Standing Calf Raise', 'Plank'];
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function parse(): Exercise[] {
  const out: Exercise[] = [];
  for (const line of RAW.trim().split('\n')) {
    const [name, eq, primary, others, type] = line.split('|');
    out.push({ id: slug(name), name, equipment: EQ[eq], primary, others: others ? others.split(',') : [], type: TY[type], popular: POPULAR.includes(name) });
  }
  // Programmatic variants
  const base = (n: string) => out.find((e) => e.name === n)!;
  const variants: [string, string, string][] = [
    ['Barbell Bench Press', 'Incline', 'Barbell Incline Bench Press'], ['Barbell Bench Press', 'Decline', 'Barbell Decline Bench Press'],
    ['Dumbbell Bench Press', 'Incline', 'Dumbbell Incline Bench Press'], ['Dumbbell Bench Press', 'Decline', 'Dumbbell Decline Bench Press'],
    ['Dumbbell Fly', 'Incline', 'Incline Dumbbell Fly'], ['Machine Chest Press', 'Incline', 'Incline Machine Chest Press'],
    ['Smith Machine Bench Press', 'Incline', 'Smith Machine Incline Bench Press'], ['Push-Up', 'Incline', 'Incline Push-Up'], ['Push-Up', 'Decline', 'Decline Push-Up'],
    ['One-Arm Dumbbell Row', 'Chest-Supported', 'Chest-Supported Dumbbell Row'],
  ];
  for (const [b, , nm] of variants) { const e = base(b); out.push({ ...e, id: slug(nm), name: nm, popular: false }); }
  return out;
}
export const BUILTIN_EXERCISES: Exercise[] = parse();
export const exerciseIndex = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]));
export const POPULAR_NAMES = POPULAR;

/** Short technique cues. Feed the Form-Check spaced-repetition deck. Others fall back to a generic cue by pattern. */
export const CUES: Record<string, string[]> = {
  'barbell-bench-press': ['Shoulder blades pinned back and down', 'Feet planted, slight arch', 'Bar touches mid-chest, forearms vertical', 'Press up and slightly back'],
  'barbell-back-squat': ['Brace core before descending', 'Knees track over toes', 'Hips and chest rise together', 'Hit at least parallel depth'],
  'barbell-deadlift': ['Bar over mid-foot', 'Lats tight — "bend the bar"', 'Push the floor away', 'Lock hips and knees together'],
  'barbell-overhead-press': ['Squeeze glutes, ribs down', 'Bar path close to the face', 'Head through at the top', 'Full lockout over mid-foot'],
  'bent-over-barbell-row': ['Hinge to ~45°, neutral spine', 'Pull to the lower ribs', 'Lead with elbows', 'No torso heaving'],
  'pull-up': ['Start from a dead hang', 'Depress scapulae first', 'Chin over the bar', 'Control the lowering'],
  'chest-dips': ['Lean the torso forward', 'Lower until shoulders at elbow height', 'Elbows slightly flared', 'Don’t bounce at the bottom'],
  'romanian-deadlift': ['Soft knees, push hips back', 'Bar slides down the thighs', 'Stop at the hamstring stretch', 'Squeeze glutes to stand'],
  'barbell-hip-thrust': ['Upper back on the bench', 'Chin tucked, ribs down', 'Shins vertical at the top', 'Pause and squeeze glutes'],
  'dumbbell-bicep-curl': ['Elbows pinned at your sides', 'No swinging', 'Supinate as you curl', 'Slow eccentric'],
  'dumbbell-lateral-raise': ['Slight forward lean', 'Lead with the elbows', 'Stop at shoulder height', 'Control the descent'],
  'lat-pulldown': ['Chest up, slight lean back', 'Pull elbows to the hips', 'Bar to upper chest', 'Full stretch overhead'],
  'seated-cable-row': ['Sit tall, don’t round', 'Drive elbows back', 'Squeeze shoulder blades', 'Let the stack pull you forward'],
  'leg-press': ['Feet shoulder-width, mid-platform', 'Lower back stays flat', 'Don’t lock the knees', 'Full controlled depth'],
  'lying-leg-curl': ['Hips pressed into pad', 'Curl heels to glutes', 'Pause at the top', 'Slow 3-second lowering'],
  'leg-extension': ['Back flat against the pad', 'Extend fully, squeeze quads', 'Pause at the top', 'Control the return'],
  'standing-calf-raise': ['Full stretch at the bottom', 'Rise onto the big toe', 'Pause 1s at the top', 'No bouncing'],
  plank: ['Neutral spine, ribs down', 'Squeeze glutes and quads', 'Elbows under shoulders', 'Breathe steadily'],
};
export function cuesFor(e: Exercise): string[] {
  if (CUES[e.id]) return CUES[e.id];
  return ['Set up with a neutral spine and braced core', `Feel the ${e.primary.toLowerCase()} doing the work`, 'Full range of motion, controlled tempo', 'Stop 1–2 reps before form breaks'];
}
