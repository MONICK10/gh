// TF-IDF Implementation
class TFIDFAnalyzer {
    constructor() {
        this.documents = [];
        this.vocabulary = new Set();
    }

    fit(texts) {
        this.documents = texts;
        texts.forEach(text => {
            const words = this.tokenize(text);
            words.forEach(word => this.vocabulary.add(word));
        });
    }

    transform(text) {
        const vector = {};
        const words = this.tokenize(text);
        
        // Calculate TF
        words.forEach(word => {
            vector[word] = (vector[word] || 0) + 1;
        });
        
        // Apply IDF
        Array.from(this.vocabulary).forEach(word => {
            const docCount = this.documents.filter(doc => 
                doc.toLowerCase().includes(word)).length;
            const idf = Math.log(this.documents.length / (docCount + 1));
            if (vector[word]) {
                vector[word] *= idf;
            }
        });
        
        return vector;
    }

    tokenize(text) {
        return text.toLowerCase().match(/\b\w+\b/g) || [];
    }
}

// Naive Bayes Implementation
class NaiveBayesClassifier {
    constructor() {
        this.classes = { high: {}, medium: {}, low: {} };
        this.classCounts = { high: 0, medium: 0, low: 0 };
    }

    train(text, label) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        this.classCounts[label]++;
        
        words.forEach(word => {
            this.classes[label][word] = (this.classes[label][word] || 0) + 1;
        });
    }

    predict(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const scores = {};
        
        Object.keys(this.classes).forEach(label => {
            scores[label] = Math.log(this.classCounts[label] + 1);
            words.forEach(word => {
                const wordCount = this.classes[label][word] || 0;
                scores[label] += Math.log((wordCount + 1) / 
                    (this.classCounts[label] + Object.keys(this.classes[label]).length));
            });
        });
        
        return scores;
    }
}

// VADER-inspired Sentiment Analysis
class SentimentAnalyzer {
    constructor() {
        this.positiveWords = new Set(['happy', 'great', 'awesome', 'excellent']);
        this.negativeWords = new Set(['sad', 'bad', 'terrible', 'awful']);
        this.intensifiers = new Set(['very', 'extremely', 'really']);
    }

    analyze(text) {
        const words = text.toLowerCase().split(' ');
        let score = 0;
        let intensity = 1;

        for (let i = 0; i < words.length; i++) {
            if (this.intensifiers.has(words[i])) {
                intensity = 1.5;
                continue;
            }
            if (this.positiveWords.has(words[i])) {
                score += (1 * intensity);
            }
            if (this.negativeWords.has(words[i])) {
                score -= (1 * intensity);
            }
            intensity = 1;
        }

        return score;
    }
}

// Emotion Detection
class EmotionDetector {
    constructor() {
        this.emotions = {
            joy: ['happy', 'excited', 'great'],
            sadness: ['sad', 'disappointed', 'unhappy'],
            anger: ['angry', 'furious', 'mad'],
            fear: ['scared', 'afraid', 'worried'],
            stress: ['overwhelmed', 'anxious', 'stressed']
        };
    }

    detect(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const scores = {};
        
        Object.keys(this.emotions).forEach(emotion => {
            scores[emotion] = words.filter(word => 
                this.emotions[emotion].includes(word)).length;
        });
        
        return scores;
    }
}

// Anomaly Detection
class AnomalyDetector {
    constructor(threshold = 2) {
        this.threshold = threshold;
        this.history = [];
    }

    addScore(score) {
        this.history.push(score);
        if (this.history.length > 30) this.history.shift();
    }

    isAnomaly(score) {
        if (this.history.length < 5) return false;
        
        const mean = this.history.reduce((a, b) => a + b) / this.history.length;
        const std = Math.sqrt(this.history.reduce((a, b) => 
            a + Math.pow(b - mean, 2), 0) / this.history.length);
        
        return Math.abs(score - mean) > (this.threshold * std);
    }
}

// Trend Analysis
class TrendAnalyzer {
    constructor() {
        this.scores = [];
        this.timestamps = [];
    }

    addDataPoint(score, timestamp = new Date()) {
        this.scores.push(score);
        this.timestamps.push(timestamp);
    }

    getMovingAverage(window = 5) {
        if (this.scores.length < window) return null;
        
        const recent = this.scores.slice(-window);
        return recent.reduce((a, b) => a + b) / window;
    }

    getTrend() {
        if (this.scores.length < 2) return 'insufficient data';
        const recent = this.scores.slice(-2);
        return recent[1] > recent[0] ? 'increasing' : 'decreasing';
    }
}

// Ensemble Model
class StressEnsemble {
    constructor() {
        this.tfidf = new TFIDFAnalyzer();
        this.naiveBayes = new NaiveBayesClassifier();
        this.sentiment = new SentimentAnalyzer();
        this.emotion = new EmotionDetector();
        this.anomaly = new AnomalyDetector();
        this.trend = new TrendAnalyzer();
    }

    async analyze(text) {
        // Get individual model predictions
        const tfidfVector = this.tfidf.transform(text);
        const nbScores = this.naiveBayes.predict(text);
        const sentimentScore = this.sentiment.analyze(text);
        const emotions = this.emotion.detect(text);

        // Combine scores (weighted average)
        const stressScore = this.calculateEnsembleScore(
            tfidfVector, nbScores, sentimentScore, emotions
        );

        // Check for anomalies
        const isAnomaly = this.anomaly.isAnomaly(stressScore);
        this.anomaly.addScore(stressScore);
        this.trend.addDataPoint(stressScore);

        return {
            final_stress_score: stressScore,
            dominant_emotion: this.getDominantEmotion(emotions),
            sentiment: sentimentScore,
            is_anomaly: isAnomaly,
            trend: this.trend.getTrend(),
            confidence: this.calculateConfidence(emotions),
            suggestion: this.generateSuggestion(stressScore, emotions),
            method: 'ensemble'
        };
    }

    calculateEnsembleScore(tfidf, nb, sentiment, emotions) {
        // Weighted combination of all signals
        const stressEmotion = emotions.stress || 0;
        const negativeSignals = -sentiment;
        
        return Math.min(100, Math.max(0, 
            (stressEmotion * 30) + 
            (negativeSignals * 20) + 
            (nb.high * 30) + 
            (Object.keys(tfidf).length * 2)
        ));
    }

    getDominantEmotion(emotions) {
        return Object.entries(emotions).reduce((a, b) => 
            b[1] > a[1] ? b : a)[0];
    }

    calculateConfidence(emotions) {
        const total = Object.values(emotions).reduce((a, b) => a + b, 0);
        const max = Math.max(...Object.values(emotions));
        return total ? (max / total) * 100 : 50;
    }

    generateSuggestion(score, emotions) {
        if (score > 80) return "🚨 Critical stress detected. Please consider professional help.";
        if (score > 60) return "⚠️ High stress. Try deep breathing exercises.";
        if (score > 40) return "📝 Moderate stress. Consider journaling.";
        return "✅ Manageable stress levels. Keep up the good work!";
    }
}

// Export for use in main code
window.StressEnsemble = StressEnsemble;
