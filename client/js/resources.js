// resources.js
import { calculateStressFromText } from './ai-monitor.js';
import { getAIResponse } from './ai-chat-logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const resourcesSection = document.getElementById('resources-section');
    const exerciseList = document.getElementById('exercise-list');
    const storyOutput = document.getElementById('story-output');
    const bgmPlayer = document.getElementById('bgm-player');
    const bgmSource = document.getElementById('bgm-source');
    const calendarNotes = document.getElementById('calendar-notes');

    // AI Coach elements
    const aiInput = document.getElementById('ai-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiResponseBox = document.getElementById('ai-response');

    // --- Dummy exercises, stories, and music ---
    const exercisesByStress = [
        { range: [0, 30], exercises: ["Quick desk stretch", "Mini mindfulness break", "Gratitude note"] },
        { range: [31, 60], exercises: ["5-min deep breathing", "Short walk", "Progressive muscle relaxation"] },
        { range: [61, 80], exercises: ["Meditation", "Stretching", "Journaling"] },
        { range: [81, 99], exercises: ["Talk to AI Coach", "Deep relaxation exercise", "Call a friend/support"] }
    ];

    const storiesByStress = {
        low: "Today is calm and easy. Keep up your positive vibes!",
        medium: "Take a short break and breathe. Small steps matter.",
        high: "You're under pressure. Pause, reflect, and use the AI Coach for guidance."
    };

    const musicByStress = {
        low: "audio/neutral1.mp3",
        medium: "audio/calm1.mp3",
        high: "audio/relax1.mp3"
    };

    const NOTES_KEY = "studentNotes";

    // --- Render past notes ---
    function renderNotes() {
        const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
        calendarNotes.innerHTML = notes.map(n => 
            `<div class="border p-2 rounded bg-gray-50 mb-1">
                <strong>${new Date(n.date).toLocaleDateString()}:</strong> ${n.text}
            </div>`).join('');
    }

    // --- Display resources based on stress score ---
    function displayResources(stressScore) {
        resourcesSection.classList.remove('hidden');

        // Exercises
        const selected = exercisesByStress.find(e => stressScore >= e.range[0] && stressScore <= e.range[1]);
        exerciseList.innerHTML = selected.exercises.map(e => `<li>${e}</li>`).join('');

        // Story
        let story = storiesByStress.low;
        if (stressScore > 30 && stressScore <= 60) story = storiesByStress.medium;
        else if (stressScore > 60) story = storiesByStress.high;
        storyOutput.textContent = story;

        // Music
        let bgm = musicByStress.low;
        if (stressScore > 30 && stressScore <= 60) bgm = musicByStress.medium;
        else if (stressScore > 60) bgm = musicByStress.high;
        bgmSource.src = bgm;
        bgmPlayer.load();
        bgmPlayer.play();
    }

    renderNotes();

    // --- Load last suggestion automatically ---
    const lastSuggestion = JSON.parse(localStorage.getItem('lastStressSuggestion'));
    if (lastSuggestion) {
        displayResources(lastSuggestion.score);
    }

    // --- AI Coach Messaging ---
    aiSendBtn.addEventListener('click', async () => {
        const userText = aiInput.value.trim();
        if (!userText) return;

        aiResponseBox.textContent = "⏳ Aura is thinking...";
        try {
            const response = await getAIResponse(userText);
            aiResponseBox.textContent = response;

            // TTS playback
            const utter = new SpeechSynthesisUtterance(response);
            speechSynthesis.speak(utter);
        } catch (err) {
            console.error(err);
            aiResponseBox.textContent = "❌ Error: Unable to reach AI Coach.";
        }

        aiInput.value = "";
    });

    aiInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            aiSendBtn.click();
        }
    });

    // --- Auto-check stress from latest posts ---
    const latestPosts = JSON.parse(localStorage.getItem('latestPosts') || "[]");
    if (latestPosts.length > 0) {
        let maxScore = 0;
        latestPosts.forEach(p => {
            const score = calculateStressFromText(p.content || "");
            if (score > maxScore) maxScore = score;
        });

        if (maxScore > 60) {
            alert(`⚠️ High stress detected from recent posts (${maxScore}). Check your resources!`);
            displayResources(maxScore);

            // Save suggestion for next visit
            localStorage.setItem('lastStressSuggestion', JSON.stringify({
                score: maxScore,
                suggestedFeature: "Check exercises, story, or music in Resources"
            }));
        }
    }
});
