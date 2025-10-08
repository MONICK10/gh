// ai-monitor.js
// --- AI STRESS ANALYSIS & SUGGESTION SYSTEM ---

// Stress keywords with weights
const STRESS_KEYWORDS = {
    // High stress
    'overwhelmed': 30, 'anxious': 30, 'hopeless': 40, 'failed': 35, 'can\'t': 25,
    'exhausted': 30, 'drowning': 35, 'lost': 25, 'hate': 20, 'stupid': 25, 'useless': 35,
    // Medium stress
    'stressed': 15, 'worried': 15, 'pressure': 15, 'deadline': 10, 'confused': 10, 'tired': 10,
    // Positive / Calm words
    'happy': -20, 'great': -20, 'excited': -25, 'solved': -15, 'passed': -25, 'grateful': -15,
    'relaxed': -30, 'good': -10, 'calm': -20, 'confident': -15, 'joy': -20
};

// Stress thresholds
const STRESS_THRESHOLD = 40; // trigger actions
const VERY_HIGH_THRESHOLD = 80;

/**
 * Calculate stress score from text
 * @param {string} text 
 * @returns {number} score between 5-99
 */
export function calculateStressFromText(text) {
    let score = 50; // neutral baseline
    const words = text.toLowerCase().replace(/[.,!?;]/g,'').split(/\s+/);
    for(const w of words){
        if(STRESS_KEYWORDS[w]) score += STRESS_KEYWORDS[w];
    }
    score = Math.max(5, Math.min(99, score));
    return Math.round(score);
}

/**
 * Determine stress action based on score
 * @param {number} score
 * @returns {object} action details
 */
export function getStressAction(score) {
    if(score < 40){
        return { level:'low', action:'motivation', text: "Keep going! Focus on the positives and breathe." };
    } else if(score >= 40 && score <= 60){
        return { level:'medium', action:'exercises', options:["Breathing","Meditation","Stretching","Journaling","Mindfulness"] };
    } else if(score > 60 && score <= 80){
        return { level:'high', action:'story', story:"Once upon a time, a student learned to overcome challenges by taking small steps and believing in themselves. Moral: Keep calm and focus on what you can control." };
    } else { // score > 80
        return { level:'very-high', action:'lyrics', lyrics:"🎵 You are strong, you can overcome, keep moving forward! 🎵", bgm:"audio/calm1.mp3" };
    }
}

/**
 * Main function to check stress and suggest actions
 * @param {string} text 
 */
export async function checkStressAndSuggest(text) {
    const score = calculateStressFromText(text);
    const action = getStressAction(score);

    // Save for resources page / diary
    localStorage.setItem('lastStressSuggestion', JSON.stringify(action));

    // Pop-up in class.html if stress is above threshold
    if(score >= STRESS_THRESHOLD){
        const popup = document.getElementById('stress-popup');
        const message = document.getElementById('stress-message');

        if(popup && message){
            let displayText = '';
            switch(action.action){
                case 'motivation':
                    displayText = action.text;
                    break;
                case 'exercises':
                    displayText = `Try these exercises: ${action.options.join(', ')}`;
                    break;
                case 'story':
                    displayText = `Read this short story:\n${action.story}`;
                    localStorage.setItem('lastStory', JSON.stringify({ story: action.story, score }));
                    break;
                case 'lyrics':
                    displayText = `Sing along with these lyrics:\n${action.lyrics}`;
                    if(action.bgm){
                        const audio = new Audio(action.bgm);
                        audio.loop = true;
                        audio.play();
                    }
                    break;
            }
            message.textContent = displayText;
            popup.classList.remove('hidden');
        }
    }

    return action; // Return for further handling in class.js (AI messages, resources, etc.)
}
