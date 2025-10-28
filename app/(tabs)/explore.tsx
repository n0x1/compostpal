import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Quiz data - random items from the main app's predefined mapping
const QUIZ_ITEMS = [
  { name: "Apple", category: "compost", description: "Red fruit with core" },
  { name: "Banana peel", category: "compost", description: "Yellow fruit skin" },
  { name: "Plastic bottle", category: "recycle", description: "Clear plastic container" },
  { name: "Newspaper", category: "recycle", description: "Printed paper" },
  { name: "Coffee grounds", category: "compost", description: "Used coffee filter contents" },
  { name: "Glass jar", category: "recycle", description: "Empty glass container" },
  { name: "Eggshells", category: "compost", description: "Crushed egg shells" },
  { name: "Cardboard box", category: "recycle", description: "Brown cardboard packaging" },
  { name: "Orange peel", category: "compost", description: "Citrus fruit skin" },
  { name: "Aluminum can", category: "recycle", description: "Metal beverage container" },
  { name: "Styrofoam", category: "trash", description: "White foam packaging" },
  { name: "Pizza box", category: "trash", description: "Greasy cardboard box" },
  { name: "Tea bag", category: "compost", description: "Used tea bag" },
  { name: "Plastic bag", category: "trash", description: "Thin plastic shopping bag" },
  { name: "Metal can", category: "recycle", description: "Steel food container" },
  { name: "Old shirt", category: "recycle", description: "A used T-shirt"},
];

interface QuizStats {
  streak: number;
  lastQuizDate: string | null;
  totalQuizzes: number;
  correctAnswers: number;
}

export default function ExploreScreen() {
  const [fontsLoaded] = useFonts({
    'EarthyFont': require('@/assets/fonts/CalSans-Regular.ttf'),
  });

  const [currentItem, setCurrentItem] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    streak: 0,
    lastQuizDate: null,
    totalQuizzes: 0,
    correctAnswers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuizStats();
    generateDailyQuiz();
  }, []);

  const loadQuizStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('quizStats');
      if (savedStats) {
        setQuizStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
    setIsLoading(false);
  };

  const saveQuizStats = async (stats: QuizStats) => {
    try {
      await AsyncStorage.setItem('quizStats', JSON.stringify(stats));
      setQuizStats(stats);
    } catch (error) {
      console.error('Error saving quiz stats:', error);
    }
  };

  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const generateDailyQuiz = () => {
    const today = getTodayDate();
    
    // Check if user already completed today's quiz
    if (quizStats.lastQuizDate === today) {
      // Show completed message or different UI
      return;
    }

    // Generate random item for today
    const randomIndex = Math.floor(Math.random() * QUIZ_ITEMS.length);
    const todayItem = QUIZ_ITEMS[randomIndex];
    setCurrentItem(todayItem);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !currentItem) return;

    const isCorrect = selectedAnswer === currentItem.category;
    const today = getTodayDate();
    
    let newStreak = quizStats.streak;
    
    // Update streak logic
    if (quizStats.lastQuizDate === today) {
      // Already completed today
      return;
    } else if (!quizStats.lastQuizDate) {
      // First quiz
      newStreak = 1;
    } else {
      // Check if yesterday
      const lastDate = new Date(quizStats.lastQuizDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = quizStats.streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const newStats: QuizStats = {
      streak: newStreak,
      lastQuizDate: today,
      totalQuizzes: quizStats.totalQuizzes + 1,
      correctAnswers: quizStats.correctAnswers + (isCorrect ? 1 : 0),
    };

    saveQuizStats(newStats);
    setShowResult(true);

    if (isCorrect) {
      Alert.alert(
        'Correct!',
        `Great job! You correctly identified that ${currentItem.name} goes in ${currentItem.category}.`,
        [{ text: 'Continue' }]
      );
    } else {
      Alert.alert(
        'Incorrect',
        `Actually, ${currentItem.name} should go in ${currentItem.category}.`,
        [{ text: 'Continue' }]
      );
    }
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    generateDailyQuiz();
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  const today = getTodayDate();
  const alreadyCompletedToday = quizStats.lastQuizDate === today;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
        />
        <ThemedText style={styles.headerTitle}>Daily Compost Quiz</ThemedText>
      </View>

      <ThemedView style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <ThemedText style={styles.statNumber}>{quizStats.streak}</ThemedText>
            <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={styles.statNumber}>{quizStats.totalQuizzes}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Quizzes</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={styles.statNumber}>
              {quizStats.totalQuizzes > 0 
                ? Math.round((quizStats.correctAnswers / quizStats.totalQuizzes) * 100)
                : 0}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.quizContainer}>
        {alreadyCompletedToday ? (
          <View style={styles.completedContainer}>
            <ThemedText style={styles.completedTitle}>Quiz Complete!</ThemedText>
            <ThemedText style={styles.completedText}>
              You've already completed today's quiz. Come back tomorrow for a new challenge!
            </ThemedText>
            <ThemedText style={styles.streakText}>
              Current streak: {quizStats.streak} days
            </ThemedText>
          </View>
        ) : currentItem ? (
          <>
            <ThemedText style={styles.quizTitle}>Today's Challenge</ThemedText>
            <ThemedText style={styles.itemName}>{currentItem.name}</ThemedText>
            <ThemedText style={styles.itemDescription}>{currentItem.description}</ThemedText>
            
            <ThemedText style={styles.questionText}>
              Where should this item go?
            </ThemedText>

            <View style={styles.answerOptions}>
              <TouchableOpacity
                style={[
                  styles.answerButton,
                  selectedAnswer === 'compost' && styles.selectedAnswer,
                  showResult && currentItem.category === 'compost' && styles.correctAnswer,
                  showResult && selectedAnswer === 'compost' && currentItem.category !== 'compost' && styles.incorrectAnswer,
                ]}
                onPress={() => handleAnswerSelect('compost')}
              >
                <ThemedText style={[
                  styles.answerText,
                  selectedAnswer === 'compost' && styles.selectedAnswerText,
                  showResult && currentItem.category === 'compost' && styles.correctAnswerText,
                ]}>
                  Compost
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.answerButton,
                  selectedAnswer === 'recycle' && styles.selectedAnswer,
                  showResult && currentItem.category === 'recycle' && styles.correctAnswer,
                  showResult && selectedAnswer === 'recycle' && currentItem.category !== 'recycle' && styles.incorrectAnswer,
                ]}
                onPress={() => handleAnswerSelect('recycle')}
              >
                <ThemedText style={[
                  styles.answerText,
                  selectedAnswer === 'recycle' && styles.selectedAnswerText,
                  showResult && currentItem.category === 'recycle' && styles.correctAnswerText,
                ]}>
                  Recycle
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.answerButton,
                  selectedAnswer === 'trash' && styles.selectedAnswer,
                  showResult && currentItem.category === 'trash' && styles.correctAnswer,
                  showResult && selectedAnswer === 'trash' && currentItem.category !== 'trash' && styles.incorrectAnswer,
                ]}
                onPress={() => handleAnswerSelect('trash')}
              >
                <ThemedText style={[
                  styles.answerText,
                  selectedAnswer === 'trash' && styles.selectedAnswerText,
                  showResult && currentItem.category === 'trash' && styles.correctAnswerText,
                ]}>
                  Trash
                </ThemedText>
              </TouchableOpacity>
            </View>

            {selectedAnswer && !showResult && (
              <TouchableOpacity style={styles.submitButton} onPress={submitAnswer}>
                <ThemedText style={styles.submitButtonText}>Submit Answer</ThemedText>
              </TouchableOpacity>
            )}

            {showResult && (
              <TouchableOpacity style={styles.nextButton} onPress={resetQuiz}>
                <ThemedText style={styles.nextButtonText}>Next Quiz</ThemedText>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B8E23" />
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF8DC',
  },
  logo: {
    height: 80,
    width: 120,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'EarthyFont',
    fontSize: 20,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5DC',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'EarthyFont',
    fontSize: 24,
    color: '#6B8E23',
    fontWeight: 'bold',
  },
  statLabel: {
    fontFamily: 'EarthyFont',
    fontSize: 12,
    color: '#8B4513',
    marginTop: 4,
  },
  quizContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5DC',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  completedTitle: {
    fontFamily: 'EarthyFont',
    fontSize: 20,
    color: '#6B8E23',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  completedText: {
    fontFamily: 'EarthyFont',
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  streakText: {
    fontFamily: 'EarthyFont',
    fontSize: 18,
    color: '#6B8E23',
    fontWeight: 'bold',
  },
  quizTitle: {
    fontFamily: 'EarthyFont',
    fontSize: 18,
    color: '#8B4513',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  itemName: {
    fontFamily: 'EarthyFont',
    fontSize: 24,
    color: '#6B8E23',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemDescription: {
    fontFamily: 'EarthyFont',
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 24,
  },
  questionText: {
    fontFamily: 'EarthyFont',
    fontSize: 18,
    color: '#8B4513',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  answerOptions: {
    gap: 12,
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E6F3E6',
  },
  selectedAnswer: {
    borderColor: '#6B8E23',
    backgroundColor: '#E6F3E6',
  },
  correctAnswer: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  incorrectAnswer: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  answerText: {
    fontFamily: 'EarthyFont',
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  selectedAnswerText: {
    color: '#6B8E23',
  },
  correctAnswerText: {
    color: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#6B8E23',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'EarthyFont',
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#8B4513',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'EarthyFont',
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
