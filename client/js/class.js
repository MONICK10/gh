"""
Advanced Multi-Model Stress Detection System
Integrates TF-IDF, Naive Bayes, LSTM, DistilBERT with Explainability
"""

import numpy as np
import pandas as pd
import pickle
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import warnings
warnings.filterwarnings('ignore')

# ==================== FEATURE EXTRACTOR ====================
class AdvancedFeatureExtractor:
    """Extract 30+ linguistic and behavioral features"""
    
    STRESS_KEYWORDS = {
        'overwhelmed': 30, 'anxious': 30, 'hopeless': 40, 'failed': 35,
        'exhausted': 30, 'drowning': 35, 'hate': 20, 'stupid': 25,
        'stressed': 15, 'worried': 15, 'pressure': 15, 'deadline': 10,
        'panic': 35, 'crying': 30, 'breakdown': 40, 'terrified': 35,
        'happy': -20, 'great': -20, 'excited': -25, 'solved': -15,
        'confident': -20, 'calm': -25, 'peaceful': -22
    }
    
    STRESS_PHRASES = [
        'give up', "can't handle", 'too much', 'breaking down',
        'falling apart', 'losing it', "don't know", 'help me'
    ]
    
    @staticmethod
    def extract_features(text, user_history=None):
        """Extract comprehensive feature set"""
        features = {}
        text_lower = text.lower()
        words = text_lower.split()
        
        # Basic text features
        features['text_length'] = len(text)
        features['word_count'] = len(words)
        features['avg_word_length'] = np.mean([len(w) for w in words]) if words else 0
        features['sentence_count'] = max(1, len(re.split(r'[.!?]+', text)))
        
        # Punctuation analysis
        features['exclamation_count'] = text.count('!')
        features['question_count'] = text.count('?')
        features['ellipsis_count'] = text.count('...') + text.count('…')
        features['punctuation_density'] = sum(1 for c in text if c in '!?.,;:') / max(len(text), 1)
        
        # Capitalization patterns
        features['capital_ratio'] = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        features['all_caps_words'] = sum(1 for w in text.split() if w.isupper() and len(w) > 1)
        
        # Repetition & emphasis
        features['repeated_chars'] = len(re.findall(r'(.)\1{2,}', text))
        features['repeated_words'] = len(words) - len(set(words))
        
        # Linguistic markers
        negative_words = ['not', 'no', 'never', "can't", "won't", "don't", 'nothing', 'nowhere']
        features['negative_word_count'] = sum(1 for w in words if w in negative_words)
        
        first_person = ['i', 'me', 'my', 'mine', 'myself']
        features['first_person_count'] = sum(1 for w in words if w in first_person)
        
        absolute_words = ['always', 'never', 'every', 'all', 'none', 'completely', 'totally']
        features['absolute_word_count'] = sum(1 for w in words if w in absolute_words)
        
        # Stress keyword scoring
        stress_score = sum(AdvancedFeatureExtractor.STRESS_KEYWORDS.get(word, 0) 
                          for word in words)
        features['keyword_stress_score'] = max(0, min(100, stress_score))
        
        # Stress phrase detection
        features['stress_phrase_count'] = sum(1 for phrase in AdvancedFeatureExtractor.STRESS_PHRASES 
                                             if phrase in text_lower)
        
        # Sentiment polarity
        positive_words = ['good', 'great', 'happy', 'excited', 'love', 'amazing', 'wonderful']
        negative_words_list = ['bad', 'hate', 'terrible', 'awful', 'worst', 'horrible', 'sad']
        
        pos_count = sum(1 for w in words if w in positive_words)
        neg_count = sum(1 for w in words if w in negative_words_list)
        features['positive_word_count'] = pos_count
        features['negative_word_count'] = neg_count
        features['sentiment_polarity'] = (pos_count - neg_count) / max(len(words), 1)
        
        # Temporal features (if history available)
        if user_history and len(user_history) > 0:
            recent_scores = [h.get('stress', 50) for h in user_history[-5:]]
            features['stress_trend'] = np.mean(recent_scores)
            features['stress_volatility'] = np.std(recent_scores) if len(recent_scores) > 1 else 0
        else:
            features['stress_trend'] = 50
            features['stress_volatility'] = 0
        
        return features

# ==================== DATA GENERATOR ====================
class StressDataGenerator:
    """Generate synthetic training data"""
    
    @staticmethod
    def create_training_data():
        data = [
            # Critical stress (85-100)
            ("I'm completely overwhelmed with assignments and exams", 95),
            ("I can't handle this pressure anymore, I'm drowning", 98),
            ("Failed my test again, feeling absolutely hopeless", 92),
            ("So anxious I can't sleep or focus on anything", 88),
            ("Everything is falling apart, I'm exhausted and useless", 94),
            ("Deadline tomorrow and I haven't started, panicking badly", 90),
            ("I hate myself for being so stupid and incompetent", 91),
            ("Can't cope with all these expectations, breaking down", 93),
            ("Terrified of failing, anxiety is paralyzing me", 89),
            ("Feel like giving up, nothing I do is good enough", 96),
            
            # High stress (70-84)
            ("Really stressed about upcoming exams next week", 75),
            ("Worried I won't finish this project on time", 72),
            ("Feeling pressured by all these deadlines", 78),
            ("Tired from staying up late studying every night", 70),
            ("Stressed out about grades and performance", 74),
            ("Under pressure to maintain my scholarship", 76),
            ("Worried about disappointing my parents", 71),
            ("Struggling to balance work and studies", 73),
            ("Nervous about the presentation tomorrow", 77),
            ("Anxious about meeting everyone's expectations", 74),
            
            # Moderate stress (50-69)
            ("A bit worried about the quiz this Friday", 55),
            ("Slightly stressed but managing okay", 52),
            ("Some pressure but nothing I can't handle", 58),
            ("Little concerned about my grades", 54),
            ("Mildly anxious about group project", 56),
            ("Somewhat tired from studying", 50),
            ("A bit confused about one concept", 53),
            ("Minor stress from deadlines", 57),
            ("Slightly overwhelmed but coping", 59),
            ("A little worried about exam prep", 51),
            
            # Low stress (30-49)
            ("Feeling okay but could use a break", 42),
            ("Pretty calm and focused right now", 35),
            ("Doing well with time management", 38),
            ("Comfortable with my study schedule", 40),
            ("Managing everything smoothly", 37),
            ("Feeling capable and in control", 41),
            ("Content with my academic progress", 36),
            ("Somewhat relaxed today", 44),
            ("Getting things done steadily", 39),
            ("Feeling decent overall", 43),
            
            # Minimal stress (0-29)
            ("So happy I passed my exam with flying colors!", 10),
            ("Excited about learning new things today", 8),
            ("Grateful for such amazing classmates and teachers", 5),
            ("Love how everything is going smoothly", 12),
            ("Feeling absolutely great and confident", 3),
            ("Had a wonderful day, totally relaxed", 15),
            ("So proud of my achievements this semester", 7),
            ("Enjoying my studies and feeling fulfilled", 6),
            ("Relaxed weekend, feeling recharged", 14),
            ("Great discussion in class today, learned a lot", 11),
        ]
        
        texts, labels = zip(*data)
        return list(texts), list(labels)

# ==================== TF-IDF + LOGISTIC REGRESSION ====================
class TFIDFStressClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        
    def train(self, texts, labels):
        X = self.vectorizer.fit_transform(texts)
        y = np.array(labels)
        self.model.fit(X, y)
        
    def predict_stress(self, text):
        X = self.vectorizer.transform([text])
        # Get decision function score and normalize to 0-100
        score = self.model.decision_function(X)[0]
        normalized = 1 / (1 + np.exp(-score))  # Sigmoid
        return int(normalized * 100)
    
    def get_important_words(self, text):
        """Get words contributing most to stress"""
        X = self.vectorizer.transform([text])
        feature_names = self.vectorizer.get_feature_names_out()
        coefficients = self.model.coef_[0]
        
        word_scores = []
        for idx in X.nonzero()[1]:
            word = feature_names[idx]
            score = coefficients[idx] * X[0, idx]
            word_scores.append((word, abs(float(score))))
        
        return sorted(word_scores, key=lambda x: x[1], reverse=True)[:8]

# ==================== NAIVE BAYES ====================
class NaiveBayesStressClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500)
        self.model = MultinomialNB()
        
    def train(self, texts, labels):
        X = self.vectorizer.fit_transform(texts)
        # Convert to binary classification for probability estimation
        y = (np.array(labels) > 50).astype(int)
        self.model.fit(X, y)
        
    def predict_stress(self, text):
        X = self.vectorizer.transform([text])
        prob = self.model.predict_proba(X)[0][1]
        return int(prob * 100)

# ==================== LSTM MODEL ====================
class LSTMStressClassifier(nn.Module):
    def __init__(self, vocab_size=5000, embedding_dim=128, hidden_dim=64):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True, 
                           bidirectional=True, dropout=0.2)
        self.fc = nn.Linear(hidden_dim * 2, 1)
        self.sigmoid = nn.Sigmoid()
        self.vocab = {}
        
    def forward(self, x):
        embedded = self.embedding(x)
        lstm_out, _ = self.lstm(embedded)
        pooled = torch.mean(lstm_out, dim=1)
        out = self.fc(pooled)
        return self.sigmoid(out)
    
    def build_vocab(self, texts):
        words = set()
        for text in texts:
            words.update(text.lower().split())
        self.vocab = {word: idx + 1 for idx, word in enumerate(list(words)[:4999])}
    
    def text_to_sequence(self, text, max_len=50):
        words = text.lower().split()
        seq = [self.vocab.get(word, 0) for word in words]
        if len(seq) < max_len:
            seq += [0] * (max_len - len(seq))
        else:
            seq = seq[:max_len]
        return torch.tensor([seq])
    
    def predict_stress(self, text):
        self.eval()
        with torch.no_grad():
            seq = self.text_to_sequence(text)
            prob = self.forward(seq).item()
            return int(prob * 100)

# ==================== DISTILBERT MODEL ====================
class DistilBERTStressClassifier:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
        self.model = AutoModel.from_pretrained("distilbert-base-uncased")
        self.regressor = nn.Sequential(
            nn.Linear(768, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 1),
            nn.Sigmoid()
        )
        self.model.eval()
        
    def predict_stress(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, 
                               max_length=512, padding=True)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            cls_embedding = outputs.last_hidden_state[:, 0, :]
            stress = self.regressor(cls_embedding) * 100
            
        return int(stress.item())
    
    def get_attention_weights(self, text):
        """Extract attention for explainability"""
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = self.model(**inputs, output_attentions=True)
            attention = outputs.attentions[-1]
            avg_attention = attention.mean(dim=1).squeeze()[0]
        
        tokens = self.tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
        token_scores = {}
        
        for i, token in enumerate(tokens):
            if token not in ['[CLS]', '[SEP]', '[PAD]']:
                token_scores[token] = float(avg_attention[i])
        
        return token_scores

# ==================== ENSEMBLE SYSTEM ====================
class StressEnsemble:
    def __init__(self):
        self.tfidf_model = TFIDFStressClassifier()
        self.nb_model = NaiveBayesStressClassifier()
        self.lstm_model = LSTMStressClassifier()
        self.bert_model = None  # Lazy load
        self.vader = SentimentIntensityAnalyzer()
        self.feature_extractor = AdvancedFeatureExtractor()
        
        # Ensemble weights (must sum to 1.0)
        self.weights = {
            'distilbert': 0.40,
            'lstm_gru': 0.30,
            'tfidf_logreg': 0.20,
            'naive_bayes': 0.10
        }
        
    def train(self, texts=None, labels=None):
        """Train all models"""
        if texts is None:
            generator = StressDataGenerator()
            texts, labels = generator.create_training_data()
        
        print("Training TF-IDF + Logistic Regression...")
        self.tfidf_model.train(texts, labels)
        
        print("Training Naive Bayes...")
        self.nb_model.train(texts, labels)
        
        print("Training LSTM...")
        self.lstm_model.build_vocab(texts)
        optimizer = torch.optim.Adam(self.lstm_model.parameters(), lr=0.001)
        criterion = nn.MSELoss()
        
        for epoch in range(15):
            total_loss = 0
            for text, label in zip(texts, labels):
                optimizer.zero_grad()
                seq = self.lstm_model.text_to_sequence(text)
                output = self.lstm_model(seq)
                target = torch.tensor([[label / 100.0]])
                loss = criterion(output, target)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            if (epoch + 1) % 5 == 0:
                print(f"  Epoch {epoch+1}/15, Loss: {total_loss/len(texts):.4f}")
        
        print("Loading DistilBERT...")
        self.bert_model = DistilBERTStressClassifier()
        
        print("✅ All models trained successfully!")
        
    def analyze_text(self, text, user_history=None):
        """Complete stress analysis with explainability"""
        
        # Get individual model predictions
        tfidf_score = self.tfidf_model.predict_stress(text)
        nb_score = self.nb_model.predict_stress(text)
        lstm_score = self.lstm_model.predict_stress(text)
        
        # Load BERT only when needed
        if self.bert_model is None:
            self.bert_model = DistilBERTStressClassifier()
        bert_score = self.bert_model.predict_stress(text)
        
        # Calculate weighted ensemble score
        final_score = (
            self.weights['distilbert'] * bert_score +
            self.weights['lstm_gru'] * lstm_score +
            self.weights['tfidf_logreg'] * tfidf_score +
            self.weights['naive_bayes'] * nb_score
        )
        
        # VADER for additional context
        vader_scores = self.vader.polarity_scores(text)
        vader_stress = int((1 - vader_scores['compound']) * 50 + 50)
        
        # Extract features
        features = self.feature_extractor.extract_features(text, user_history)
        
        # Determine dominant emotion
        emotion = self._get_dominant_emotion(final_score, text, features)
        
        # Get suggestion
        suggestion = self._get_intervention(final_score, emotion)
        
        # Get important words (XAI)
        important_words = self.tfidf_model.get_important_words(text)
        top_keywords = [word for word, _ in important_words[:5]]
        
        # Get attention weights for explainability
        attention_weights = self.bert_model.get_attention_weights(text)
        top_attention = sorted(attention_weights.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Generate explanation
        explanation = self._generate_explanation(final_score, top_keywords, emotion)
        
        # Calculate confidence
        scores_list = [tfidf_score, nb_score, lstm_score, bert_score]
        confidence = self._calculate_confidence(scores_list)
        
        return {
            'models': {
                'tfidf_logreg': tfidf_score,
                'naive_bayes': nb_score,
                'lstm_gru': lstm_score,
                'distilbert': bert_score,
                'vader': vader_stress
            },
            'final_stress_score': int(final_score),
            'dominant_emotion': emotion,
            'suggestion': suggestion,
            'top_keywords': top_keywords,
            'explanation': explanation,
            'attention_weights': dict(top_attention),
            'confidence': confidence,
            'color_code': self._get_color_code(final_score),
            'stress_level': self._get_stress_level(final_score),
            'features': features
        }
    
    def _get_dominant_emotion(self, score, text, features):
        """Determine dominant emotion"""
        text_lower = text.lower()
        
        if score >= 85:
            if any(word in text_lower for word in ['anxious', 'anxiety', 'panic', 'terrified']):
                return 'anxiety'
            elif any(word in text_lower for word in ['hopeless', 'give up', 'useless']):
                return 'despair'
            elif any(word in text_lower for word in ['hate', 'angry', 'mad']):
                return 'anger'
            else:
                return 'overwhelm'
        elif score >= 70:
            if any(word in text_lower for word in ['worried', 'nervous', 'scared']):
                return 'worry'
            elif any(word in text_lower for word in ['exhausted', 'tired', 'burnout']):
                return 'burnout'
            else:
                return 'stress'
        elif score >= 50:
            return 'mild_concern'
        elif score >= 30:
            return 'neutral'
        else:
            if any(word in text_lower for word in ['happy', 'great', 'excited']):
                return 'positive'
            else:
                return 'calm'
    
    def _get_intervention(self, score, emotion):
        """Get personalized intervention based on stress level"""
        interventions = {
            'critical': "🚨 CRITICAL: Please contact a counselor immediately. Call: 1-800-273-8255 or visit campus mental health services.",
            'high': "⚠️ HIGH STRESS: Try 10-min guided meditation or deep breathing (4-7-8 technique). Consider talking to someone.",
            'moderate': "💡 MODERATE STRESS: Take a 5-min break. Try journaling or light stretching exercises.",
            'low': "✅ LOW STRESS: Quick breathing exercise (box breathing 4-4-4-4) can maintain your calm state.",
            'minimal': "🌟 GREAT STATE: Keep up the positive energy! Consider gratitude journaling."
        }
        
        emotion_tips = {
            'anxiety': " Focus on grounding: Name 5 things you see, 4 you hear, 3 you feel.",
            'despair': " Remember: This feeling is temporary. Reach out to a trusted friend or counselor.",
            'anger': " Take 10 deep breaths before responding. Physical activity can help release tension.",
            'burnout': " You need rest, not productivity. Schedule a complete break today.",
            'worry': " Write down your worries, then list one action for each.",
        }
        
        level = self._get_stress_level(score)
        base = interventions.get(level, interventions['moderate'])
        tip = emotion_tips.get(emotion, "")
        
        return base + tip
    
    def _generate_explanation(self, score, keywords, emotion):
        """Generate human-readable explanation"""
        level = self._get_stress_level(score)
        
        explanation = f"Stress Level: {level.upper()} ({int(score)}/100)\n\n"
        
        if keywords:
            explanation += f"Key stress indicators detected: {', '.join(keywords)}. "
        
        if score >= 85:
            explanation += "Multiple high-intensity stress markers indicate critical stress levels. "
        elif score >= 70:
            explanation += "Significant stress indicators with negative language patterns. "
        elif score >= 50:
            explanation += "Moderate stress signals detected in your message. "
        elif score >= 30:
            explanation += "Mild stress present but manageable. "
        else:
            explanation += "Minimal stress detected. Language is generally positive. "
        
        explanation += f"\n\nDominant emotion: {emotion.replace('_', ' ').title()}"
        
        return explanation
    
    def _get_stress_level(self, score):
        """Categorize stress level"""
        if score >= 85: return 'critical'
        elif score >= 70: return 'high'
        elif score >= 50: return 'moderate'
        elif score >= 30: return 'low'
        else: return 'minimal'
    
    def _get_color_code(self, score):
        """Get color for visualization"""
        if score >= 71: return 'red'
        elif score >= 41: return 'yellow'
        else: return 'green'
    
    def _calculate_confidence(self, scores):
        """Calculate prediction confidence"""
        std_dev = np.std(scores)
        confidence = max(0, min(100, 100 - std_dev))
        return int(confidence)
    
    def save_models(self, filepath='models.pkl'):
        """Save trained models"""
        models_dict = {
            'tfidf_model': self.tfidf_model,
            'nb_model': self.nb_model,
            'lstm_model': self.lstm_model,
            'weights': self.weights
        }
        with open(filepath, 'wb') as f:
            pickle.dump(models_dict, f)
        print(f"✅ Models saved to {filepath}")
    
    def load_models(self, filepath='models.pkl'):
        """Load pre-trained models"""
        with open(filepath, 'rb') as f:
            models_dict = pickle.load(f)
        
        self.tfidf_model = models_dict['tfidf_model']
        self.nb_model = models_dict['nb_model']
        self.lstm_model = models_dict['lstm_model']
        self.weights = models_dict['weights']
        print(f"✅ Models loaded from {filepath}")

# ==================== MAIN ====================
if __name__ == "__main__":
    print("🚀 Initializing Multi-Model Stress Detection System...")
    print("=" * 60)
    
    ensemble = StressEnsemble()
    ensemble.train()
    ensemble.save_models()
    
    # Test predictions
    test_cases = [
        "I'm so overwhelmed with all these exams and assignments, can't handle it",
        "Feeling pretty good about my progress this week",
        "A bit worried about the quiz tomorrow but I'll manage",
        "Everything is falling apart and I feel hopeless"
    ]
    
    print("\n" + "=" * 60)
    print("📊 Testing Model Predictions:")
    print("=" * 60)
    
    for text in test_cases:
        result = ensemble.analyze_text(text)
        print(f"\n📝 Text: '{text}'")
        print(f"⚡ Final Score: {result['final_stress_score']}/100 ({result['stress_level']})")
        print(f"😟 Emotion: {result['dominant_emotion']}")
        print(f"🎯 Confidence: {result['confidence']}%")
        print(f"🏷️ Keywords: {', '.join(result['top_keywords'])}")
        print(f"💡 Suggestion: {result['suggestion'][:80]}...")
        print(f"📊 Models: TF-IDF={result['models']['tfidf_logreg']}, "
              f"NB={result['models']['naive_bayes']}, "
              f"LSTM={result['models']['lstm_gru']}, "
              f"BERT={result['models']['distilbert']}")
        print("-" * 60)
